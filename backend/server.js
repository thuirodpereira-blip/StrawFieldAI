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

dotenv.config();

// ============================================
// ROTA DE HEALTH CHECK - ADICIONAR ISSO
// ============================================
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(process.cwd(), 'data');

// Garante que a pasta data existe
await fs.mkdir(DATA_DIR, { recursive: true });

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

// ===== MIDDLEWARES =====
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Muitas requisições. Aguarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

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
});

// ===== SYSTEM PROMPT STRAWFIELD =====
const SYSTEM_PROMPT = `Você é a StrawField, uma assistente de IA inteligente, criativa e com personalidade própria.

Sobre você:
- Seu nome é StrawField.
- Você pensa antes de responder, analisa o contexto e dá respostas úteis e bem elaboradas.
- Você sabe escrever código, explicar conceitos, criar scripts, resolver problemas e conversar sobre qualquer assunto.
- Você tem um tom amigável e natural, como um amigo que entende de tecnologia.
- Você é honesta: quando não souber algo, admite e sugere como encontrar a resposta.

Regras:
- NUNCA xingue, ofenda, humilhe ou desrespeite o usuário.
- Responda de forma direta e completa. Evite respostas vazias.
- Use português brasileiro natural.`;

// ===== MODERAÇÃO (palavras exatas, sem falsos positivos) =====
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
  const words = text.toLowerCase().replace(/[.,!?;:"'()\[\]{}\-–—@#$%&*+=\/\\|<>~`]/g, ' ').split(/\s+/).filter(w => w);
  for (const w of words) if (FORBIDDEN.has(w)) return false;
  return true;
}

const SAFE_FALLBACK = 'Prefiro manter nossa conversa no respeito. Estou aqui para ajudar de forma construtiva. O que você precisa?';

// ===== CHAMADA ÀS IAs =====
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
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
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

// ===== AUTH ROUTES =====

// Registro
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

  // Cria chats vazio para o user
  const chats = await readJson('chats.json');
  chats[username] = [];
  await writeJson('chats.json', chats);

  res.json({ success: true, token, user: { username, displayName: displayName || username } });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ success: false, error: 'Dados inválidos.' });

  const { username, password } = parse.data;
  const users = await readJson('users.json');
  const user = users[username];

  if (!user) return res.status(401).json({ success: false, error: 'Usuário não encontrado.' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ success: false, error: 'Senha incorreta.' });

  // Gera novo token
  const token = uuidv4();
  user.token = token;
  await writeJson('users.json', users);

  res.json({ success: true, token, user: { username: user.username, displayName: user.displayName } });
});

// Guest (modo convidado, sem conta)
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

// Verifica token
app.get('/api/auth/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Não autenticado.' });

  const users = await readJson('users.json');
  const user = Object.values(users).find(u => u.token === token);
  if (!user) return res.status(401).json({ success: false, error: 'Token inválido.' });

  res.json({ success: true, user: { username: user.username, displayName: user.displayName, isGuest: !!user.isGuest } });
});

// ===== CHAT ROUTES =====

function getUserFromToken(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const users = readJson('users.json'); // sync não funciona aqui, vou fazer async nas rotas
  return null;
}

// Lista chats do usuário
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

// Cria novo chat
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

// Pega mensagens de um chat
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

// Deleta chat
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

// Envia mensagem para um chat
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

  // Adiciona mensagem do usuário
  chat.messages.push({ role: 'user', content: message, timestamp });

  // Monta contexto para IA (só envia role e content, remove timestamp e outros campos)
  const history = chat.messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
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

    // Atualiza título se for a primeira mensagem
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

// Health
app.get('/api/health', async (req, res) => {
  const providers = [];
  if (OLLAMA_URL) providers.push('ollama');
  if (groq) providers.push('groq');
  if (GEMINI_API_KEY) providers.push('gemini');
  if (openai) providers.push('openai');
  res.json({ success: true, status: 'online', providers, timestamp: new Date().toISOString() });
});

app.use((req, res) => res.status(404).json({ success: false, error: 'Rota não encontrada.' }));
app.use((err, req, res, next) => {
  console.error('Erro global:', err.stack);
  res.status(500).json({ success: false, error: 'Erro interno inesperado.' });
});

app.listen(PORT, () => {
  console.log(`🚀 StrawField Backend rodando em http://localhost:${PORT}`);
  const p = [OLLAMA_URL ? 'Ollama' : '', groq ? 'Groq' : '', GEMINI_API_KEY ? 'Gemini' : '', openai ? 'OpenAI' : ''].filter(Boolean);
  console.log(`   Provedores: ${p.join(', ') || 'NENHUM — configure o .env!'}`);
});
