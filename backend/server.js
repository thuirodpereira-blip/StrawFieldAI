import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import multer from 'multer';

// ===== FINGERPRINT BAN HELPERS =====
async function getBannedFingerprints() {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, 'bans.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function addBan(fingerprint, reason = '') {
  const bans = await getBannedFingerprints();
  bans[fingerprint] = { bannedAt: new Date().toISOString(), reason };
  await fs.writeFile(path.join(DATA_DIR, 'bans.json'), JSON.stringify(bans, null, 2), 'utf-8');
}

async function removeBan(fingerprint) {
  const bans = await getBannedFingerprints();
  delete bans[fingerprint];
  await fs.writeFile(path.join(DATA_DIR, 'bans.json'), JSON.stringify(bans, null, 2), 'utf-8');
}

// Middleware de verificação de ban
async function checkBan(req, res, next) {
  const fp = req.headers['x-device-fingerprint'];
  if (!fp) return next();
  const bans = await getBannedFingerprints();
  if (bans[fp]) {
    return res.status(403).json({ success: false, error: 'Dispositivo banido. Contate o suporte.' });
  }
  next();
}

dotenv.config();

const app = express();
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');

// Garante pastas existem
await fs.mkdir(DATA_DIR, { recursive: true });
await fs.mkdir(UPLOAD_DIR, { recursive: true });

// ===== AGENTES / PERSONALIDADES =====
const AGENTS = {
  strawfield: `Você é a StrawField, uma assistente de IA inteligente, criativa e com personalidade própria.
- Seu nome é StrawField.
- Tom amigável e natural, como um amigo que entende de tecnologia.
- Sabe escrever código, explicar conceitos, criar scripts, resolver problemas.
- Responde em português brasileiro natural.
- NUNCA xingue, ofenda ou desrespeite o usuário.`,

  coder: `Você é o CodeMaster, um especialista em programação.
- Foco técnico, respostas diretas e com código bem formatado.
- Sempre explica o código quando necessário.
- Dá dicas de performance e boas práticas.
- Tom profissional mas acessível.`,

  teacher: `Você é o Professor, um educador paciente e didático.
- Explica conceitos passo a passo, do básico ao avançado.
- Usa analogias simples para facilitar o entendimento.
- Incentiva o aprendizado e a curiosidade.
- Tom calmo, encorajador e claro.`,

  creative: `Você é o Criativo, um brainstorming partner ilimitado.
- Gera ideias inovadoras, conceitos artísticos e soluções fora da caixa.
- Ajuda com roteiros, histórias, design, marketing e criação de conteúdo.
- Tom inspirador, energético e imaginativo.`,

  scientist: `Você é o Cientista, focado em fatos, dados e evidências.
- Respostas baseadas em ciência, lógica e racionalidade.
- Cita fontes e explica metodologias quando possível.
- Tom objetivo, analítico e preciso.`
};

const DEFAULT_AGENT = 'strawfield';

// ===== MIDDLEWARES =====
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(morgan('combined'));
app.use(checkBan); // ← VERIFICA BAN ANTES DE TODAS AS ROTAS

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Muitas requisições. Aguarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ===== MULTER (UPLOAD DE ARQUIVOS) =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|txt|js|jsx|ts|tsx|py|html|css|json|md/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error('Tipo de arquivo não suportado.'));
  }
});

// ===== HELPERS DE PERSISTÊNCIA JSON =====
async function readJson(file) {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeJson(file, data) {
  await fs.writeFile(path.join(DATA_DIR, file), JSON.stringify(data, null, 2), 'utf-8');
}

// ===== CLIENTES DE IA =====
const openai = (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '')
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1' })
  : null;

const groq = (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '')
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') ? process.env.GEMINI_API_KEY : null;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

// ===== SCHEMAS =====
const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Apenas letras, números e underscore'),
  password: z.string().min(4).max(100),
  displayName: z.string().min(1).max(50).optional(),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const messageSchema = z.object({
  message: z.string().min(1, 'Mensagem vazia').max(4000, 'Muito longa'),
  agent: z.string().optional(),
});

// ===== MODERAÇÃO =====
const FORBIDDEN = new Set([
  'idiota','imbecil','estupido','estúpido','burro','retardado',
  'filhodaputa','filho da puta','merda','bosta','cu','caralho','porra',
  'vsf','vai se foder','foda-se','desgraçado','desgracado',
  'maldito','cretino','babaca','otario','otário','palhaço','palhaco',
  'inutil','inútil','nojento','nojenta','lixo','escoria','escória',
  'cuzao','cuzão','cuzona','buceta','pinto','rola','viado','viadinho',
  'puta','putinha','arrombado','arrombada','corno','corna','pau no cu',
  'pau no','fdp','filha da puta','filhadaputa','vadia','vagabundo'
]);

function moderate(text) {
  const words = text.toLowerCase().replace(/[.,!?;:"'()\[\]{}\-–—@#$%&*+=/\\|<>~`]/g, ' ').split(/\s+/).filter(w => w);
  for (const w of words) if (FORBIDDEN.has(w)) return false;
  return true;
}

const SAFE_FALLBACK = 'Prefiro manter nossa conversa no respeito. Estou aqui para ajudar de forma construtiva. O que você precisa?';

// ===== CHAMADA ÀS IAs (SEM STREAMING) =====
async function callAI(messages) {
  const errors = [];

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false }),
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = await res.json();
    if (data.message?.content) return data.message.content;
    throw new Error('vazio');
  } catch (e) { errors.push(`Ollama: ${e.message}`); }

  if (groq) {
    try {
      const c = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages, temperature: 0.7, max_tokens: 4096,
      });
      if (c.choices?.[0]?.message?.content) return c.choices[0].message.content;
      throw new Error('vazio');
    } catch (e) { errors.push(`Groq: ${e.message}`); }
  }

  if (GEMINI_API_KEY) {
    try {
      const contents = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      const systemMsg = messages.find(m => m.role === 'system')?.content || AGENTS.strawfield;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: systemMsg }] },
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 } }) }
      );
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
      throw new Error('vazio');
    } catch (e) { errors.push(`Gemini: ${e.message}`); }
  }

  if (openai) {
    try {
      const c = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages, temperature: 0.7, max_tokens: 4096,
      });
      if (c.choices?.[0]?.message?.content) return c.choices[0].message.content;
      throw new Error('vazio');
    } catch (e) { errors.push(`OpenAI: ${e.message}`); }
  }

  throw new Error(`Nenhum provedor disponível.\n${errors.join('\n')}`);
}

// ===== CHAMADA STREAMING (GROQ) =====
async function* callAIStream(messages) {
  if (!groq) throw new Error('Streaming apenas disponível com Groq.');

  const stream = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    messages, temperature: 0.7, max_tokens: 4096,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}

// ===== AUTH ROUTES =====
app.post('/api/auth/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ success: false, error: parse.error.issues.map(i => i.message).join('; ') });

  const { username, password, displayName } = parse.data;
  const users = await readJson('users.json');

  if (users[username]) return res.status(409).json({ success: false, error: 'Username já existe.' });

  const hash = await bcrypt.hash(password, 10);
  const token = uuidv4();
  users[username] = {
    username,
    passwordHash: hash,
    displayName: displayName || username,
    token,
    createdAt: new Date().toISOString(),
  };
  await writeJson('users.json', users);

  const chats = await readJson('chats.json');
  chats[username] = [];
  await writeJson('chats.json', chats);

  res.json({ success: true, token, user: { username, displayName: displayName || username } });
});

app.post('/api/auth/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ success: false, error: 'Dados inválidos.' });

  const { username, password } = parse.data;
  const users = await readJson('users.json');
  const user = users[username];

  if (!user) return res.status(401).json({ success: false, error: 'Usuário não encontrado.' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ success: false, error: 'Senha incorreta.' });

  const token = uuidv4();
  user.token = token;
  await writeJson('users.json', users);

  res.json({ success: true, token, user: { username: user.username, displayName: user.displayName } });
});

app.post('/api/auth/guest', async (req, res) => {
  const guestId = 'guest_' + uuidv4().slice(0, 8);
  const token = uuidv4();
  const users = await readJson('users.json');
  users[guestId] = {
    username: guestId,
    displayName: 'Convidado',
    token,
    isGuest: true,
    createdAt: new Date().toISOString(),
  };
  await writeJson('users.json', users);

  const chats = await readJson('chats.json');
  chats[guestId] = [];
  await writeJson('chats.json', chats);

  res.json({ success: true, token, user: { username: guestId, displayName: 'Convidado' } });
});

app.get('/api/auth/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Não autenticado.' });

  const users = await readJson('users.json');
  const user = Object.values(users).find(u => u.token === token);
  if (!user) return res.status(401).json({ success: false, error: 'Token inválido.' });

  const isAdmin = user.username === 'StrawField';
  res.json({ success: true, user: { username: user.username, displayName: user.displayName, isGuest: !!user.isGuest, isAdmin } });
});

// ===== CHAT ROUTES =====
app.get('/api/chats', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Não autenticado.' });

  const users = await readJson('users.json');
  const user = Object.values(users).find(u => u.token === token);
  if (!user) return res.status(401).json({ success: false, error: 'Token inválido.' });

  const chats = await readJson('chats.json');
  const userChats = chats[user.username] || [];
  res.json({ success: true, chats: userChats.map(c => ({ id: c.id, title: c.title, updatedAt: c.updatedAt })) });
});

app.post('/api/chats', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Não autenticado.' });

  const users = await readJson('users.json');
  const user = Object.values(users).find(u => u.token === token);
  if (!user) return res.status(401).json({ success: false, error: 'Token inválido.' });

  const title = req.body.title || 'Nova Conversa';
  const chatId = uuidv4();
  const newChat = { id: chatId, title, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

  const chats = await readJson('chats.json');
  if (!chats[user.username]) chats[user.username] = [];
  chats[user.username].unshift(newChat);
  await writeJson('chats.json', chats);

  res.json({ success: true, chat: newChat });
});

app.get('/api/chats/:id', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Não autenticado.' });

  const users = await readJson('users.json');
  const user = Object.values(users).find(u => u.token === token);
  if (!user) return res.status(401).json({ success: false, error: 'Token inválido.' });

  const chats = await readJson('chats.json');
  const chat = (chats[user.username] || []).find(c => c.id === req.params.id);
  if (!chat) return res.status(404).json({ success: false, error: 'Chat não encontrado.' });

  res.json({ success: true, chat });
});

app.delete('/api/chats/:id', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Não autenticado.' });

  const users = await readJson('users.json');
  const user = Object.values(users).find(u => u.token === token);
  if (!user) return res.status(401).json({ success: false, error: 'Token inválido.' });

  const chats = await readJson('chats.json');
  chats[user.username] = (chats[user.username] || []).filter(c => c.id !== req.params.id);
  await writeJson('chats.json', chats);

  res.json({ success: true, message: 'Chat deletado.' });
});

// ===== UPLOAD DE ARQUIVO =====
app.post('/api/upload', upload.single('file'), async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Não autenticado.' });

  if (!req.file) return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado.' });

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ 
    success: true, 
    file: { 
      url: fileUrl, 
      name: req.file.originalname, 
      size: req.file.size,
      type: req.file.mimetype
    } 
  });
});

// Servir arquivos estáticos
app.use('/uploads', express.static(UPLOAD_DIR));

// ===== MENSAGEM NORMAL (SEM STREAMING) =====
app.post('/api/chats/:id/message', async (req, res) => {
  const timestamp = new Date().toISOString();
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Não autenticado.' });

  const users = await readJson('users.json');
  const user = Object.values(users).find(u => u.token === token);
  if (!user) return res.status(401).json({ success: false, error: 'Token inválido.' });

  const parse = messageSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ success: false, error: 'Mensagem inválida.' });

  const { message } = parse.data;
  const chats = await readJson('chats.json');
  const chat = (chats[user.username] || []).find(c => c.id === req.params.id);
  if (!chat) return res.status(404).json({ success: false, error: 'Chat não encontrado.' });

  chat.messages.push({ role: 'user', content: message, timestamp });

  const history = chat.messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
  const agentKey = req.body.agent || DEFAULT_AGENT;
  const systemPrompt = AGENTS[agentKey] || AGENTS[DEFAULT_AGENT];
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
  ];

  try {
    let responseText = await callAI(messages);
    if (!moderate(responseText)) {
      console.warn('[MOD] Bloqueado');
      responseText = SAFE_FALLBACK;
    }

    chat.messages.push({ role: 'assistant', content: responseText, timestamp: new Date().toISOString() });
    chat.updatedAt = new Date().toISOString();

    if (chat.messages.length === 2 && chat.title === 'Nova Conversa') {
      chat.title = message.slice(0, 40) + (message.length > 40 ? '...' : '');
    }

    await writeJson('chats.json', chats);
    res.json({ success: true, data: responseText, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Erro IA:', error);
    res.status(500).json({ success: false, error: error.message || 'Erro interno.', timestamp });
  }
});

// ===== MENSAGEM COM STREAMING =====
app.post('/api/chats/:id/message/stream', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Não autenticado.' });

  const users = await readJson('users.json');
  const user = Object.values(users).find(u => u.token === token);
  if (!user) return res.status(401).json({ success: false, error: 'Token inválido.' });

  const parse = messageSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ success: false, error: 'Mensagem inválida.' });

  const { message } = parse.data;
  const chats = await readJson('chats.json');
  const chat = (chats[user.username] || []).find(c => c.id === req.params.id);
  if (!chat) return res.status(404).json({ success: false, error: 'Chat não encontrado.' });

  chat.messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

  const history = chat.messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
  const agentKey = req.body.agent || DEFAULT_AGENT;
  const systemPrompt = AGENTS[agentKey] || AGENTS[DEFAULT_AGENT];
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
  ];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullResponse = '';

  try {
    for await (const chunk of callAIStream(messages)) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    if (!moderate(fullResponse)) {
      fullResponse = SAFE_FALLBACK;
    }

    chat.messages.push({ role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() });
    chat.updatedAt = new Date().toISOString();

    if (chat.messages.length === 2 && chat.title === 'Nova Conversa') {
      chat.title = message.slice(0, 40) + (message.length > 40 ? '...' : '');
    }

    await writeJson('chats.json', chats);
    res.write(`data: ${JSON.stringify({ done: true, data: fullResponse })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Erro IA Stream:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Erro interno.' })}\n\n`);
    res.end();
  }
});

// ===== ADMIN ROUTES (BAN) =====
app.post('/api/admin/ban', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Não autenticado.' });

  const users = await readJson('users.json');
  const user = Object.values(users).find(u => u.token === token);
  if (!user || user.username !== 'StrawField') {
    return res.status(403).json({ success: false, error: 'Acesso negado. Apenas StrawField pode banir.' });
  }

  const { fingerprint, reason } = req.body;
  if (!fingerprint) return res.status(400).json({ success: false, error: 'Fingerprint obrigatório.' });

  await addBan(fingerprint, reason || 'Sem motivo');
  res.json({ success: true, message: 'Dispositivo banido com sucesso.' });
});

app.post('/api/admin/unban', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Não autenticado.' });

  const users = await readJson('users.json');
  const user = Object.values(users).find(u => u.token === token);
  if (!user || user.username !== 'StrawField') {
    return res.status(403).json({ success: false, error: 'Acesso negado.' });
  }

  const { fingerprint } = req.body;
  if (!fingerprint) return res.status(400).json({ success: false, error: 'Fingerprint obrigatório.' });

  await removeBan(fingerprint);
  res.json({ success: true, message: 'Dispositivo desbanido com sucesso.' });
});

app.get('/api/admin/bans', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Não autenticado.' });

  const users = await readJson('users.json');
  const user = Object.values(users).find(u => u.token === token);
  if (!user || user.username !== 'StrawField') {
    return res.status(403).json({ success: false, error: 'Acesso negado.' });
  }

  const bans = await getBannedFingerprints();
  res.json({ success: true, bans });
});

// ===== HEALTH CHECK =====
app.get('/api/health', async (req, res) => {
  const providers = [];
  if (OLLAMA_URL) providers.push('ollama');
  if (groq) providers.push('groq');
  if (GEMINI_API_KEY) providers.push('gemini');
  if (openai) providers.push('openai');
  res.json({ success: true, status: 'online', providers, timestamp: new Date().toISOString() });
});

// ===== ERROR HANDLERS =====
app.use((req, res) => res.status(404).json({ success: false, error: 'Rota não encontrada.' }));
app.use((err, req, res, next) => {
  console.error('Erro global:', err.stack);
  res.status(500).json({ success: false, error: 'Erro interno inesperado.' });
});

// ===== INICIALIZAÇÃO =====
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 StrawField Backend rodando na porta ${PORT}`);
  const p = [OLLAMA_URL ? 'Ollama' : '', groq ? 'Groq' : '', GEMINI_API_KEY ? 'Gemini' : '', openai ? 'OpenAI' : ''].filter(Boolean);
  console.log(`   Provedores: ${p.join(', ') || 'NENHUM — configure o .env!'}`);
  console.log(`   Streaming: ${groq ? '✅ Groq' : '❌ Não disponível'}`);
  console.log(`   Upload: ✅ Ativo`);
  console.log(`   Admin (Ban): ✅ StrawField`);
});