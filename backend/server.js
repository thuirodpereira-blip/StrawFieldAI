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
import multer from 'multer';
import { createHash } from 'crypto';

dotenv.config();

const app = express();
const DATA_DIR = path.join(process.cwd(), 'data');

// ===== MULTER (upload de arquivos) =====
const upload = multer({ dest: path.join(DATA_DIR, 'uploads') });

// ===== AGENTES / PERSONALIDADES =====
const AGENTS = {
  strawfield: `Você é a StrawField, uma assistente de IA inteligente, criativa e com personalidade própria.
- Seu nome é StrawField.
- Tom amigável e natural, como um amigo que entende de tecnologia.
- Sabe escrever código, explicar conceitos, criar scripts, resolver problemas.
- Responde em português brasileiro natural.
- NUNCA xingue, ofenda ou desrespeite o usuário.
- Antes de responder código, analise o problema passo a passo.
- Teste mentalmente o código antes de enviar.
- Se não tiver certeza, diga "não sei" em vez de inventar.`,

  coder: `Você é o CodeMaster, um especialista em programação.
- Foco técnico, respostas diretas e com código bem formatado.
- Sempre explica o código quando necessário.
- Dá dicas de performance e boas práticas.
- Tom profissional mas acessível.
- Analise o problema antes de codar.
- Verifique se as funções existem realmente.`,

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
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Muitas requisições. Aguarde.' },
});
app.use('/api/', limiter);

await fs.mkdir(DATA_DIR, { recursive: true });
await fs.mkdir(path.join(DATA_DIR, 'uploads'), { recursive: true });

// ===== HELPERS =====
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
const deepseek = (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.trim() !== '')
  ? new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com/v1' })
  : null;

const openrouter = (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim() !== '')
  ? new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.FRONTEND_URL || 'https://strawfield.vercel.app',
        'X-Title': 'StrawField AI',
      },
    })
  : null;

const groq = (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '')
  ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' })
  : null;

const gemini = (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '')
  ? new OpenAI({ apiKey: process.env.GEMINI_API_KEY, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai' })
  : null;

const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

// ===== SCHEMAS =====
const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(4).max(100),
  displayName: z.string().min(1).max(50).optional(),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const messageSchema = z.object({
  message: z.string().min(1).max(8000),
  agent: z.string().optional(),
  stream: z.boolean().optional(),
});

// ===== MODERAÇÃO (palavras exatas, não regex) =====
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

// ===== CHAMADA ÀS IAs COM FALLBACK =====
async function callAI(messages, stream = false, res = null) {
  const errors = [];
  const providers = [];

  // 1. DeepSeek (mais inteligente pra código)
  if (deepseek) {
    providers.push(async () => {
      const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
      if (stream && res) {
        const streamResp = await deepseek.chat.completions.create({
          model, messages, temperature: 0.7, max_tokens: 4096, stream: true,
        });
        for await (const chunk of streamResp) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) res.write(`data: ${JSON.stringify({ content })}\\n\\n`);
        }
        res.write('data: [DONE]\\n\\n');
        return null;
      } else {
        const c = await deepseek.chat.completions.create({
          model, messages, temperature: 0.7, max_tokens: 4096,
        });
        return c.choices[0]?.message?.content;
      }
    });
  }

  // 2. OpenRouter (Qwen Coder, etc)
  if (openrouter) {
    providers.push(async () => {
      const model = process.env.OPENROUTER_MODEL || 'qwen/qwen3-coder:free';
      if (stream && res) {
        const streamResp = await openrouter.chat.completions.create({
          model, messages, temperature: 0.7, max_tokens: 4096, stream: true,
        });
        for await (const chunk of streamResp) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) res.write(`data: ${JSON.stringify({ content })}\\n\\n`);
        }
        res.write('data: [DONE]\\n\\n');
        return null;
      } else {
        const c = await openrouter.chat.completions.create({
          model, messages, temperature: 0.7, max_tokens: 4096,
        });
        return c.choices[0]?.message?.content;
      }
    });
  }

  // 3. Groq (rápido)
  if (groq) {
    providers.push(async () => {
      const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
      if (stream && res) {
        const streamResp = await groq.chat.completions.create({
          model, messages, temperature: 0.7, max_tokens: 4096, stream: true,
        });
        for await (const chunk of streamResp) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) res.write(`data: ${JSON.stringify({ content })}\\n\\n`);
        }
        res.write('data: [DONE]\\n\\n');
        return null;
      } else {
        const c = await groq.chat.completions.create({
          model, messages, temperature: 0.7, max_tokens: 4096,
        });
        return c.choices[0]?.message?.content;
      }
    });
  }

  // 4. Gemini
  if (gemini) {
    providers.push(async () => {
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const c = await gemini.chat.completions.create({
        model, messages, temperature: 0.7, max_tokens: 4096,
      });
      return c.choices[0]?.message?.content;
    });
  }

  // 5. Ollama (local)
  providers.push(async () => {
    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OLLAMA_MODEL || 'llama3.2', messages, stream: false }),
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = await res.json();
    return data.message?.content;
  });

  // Tenta cada provedor
  for (const provider of providers) {
    try {
      const result = await provider();
      if (result !== null) return result;
      if (stream && res) return null;
    } catch (e) {
      errors.push(e.message);
      // Se for rate limit, continua pro próximo
      if (e.message.includes('rate_limit') || e.message.includes('429') || e.message.includes('too many')) {
        console.warn(`[RATE LIMIT] ${e.message}, tentando próximo...`);
        continue;
      }
      // Se não for rate limit e não tiver mais opções, throw
      if (provider === providers[providers.length - 1]) throw e;
    }
  }

  throw new Error(`Nenhum provedor disponível.\\n${errors.join('\\n')}`);
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
    username, passwordHash: hash,
    displayName: displayName || username,
    token, createdAt: new Date().toISOString(),
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
    username: guestId, displayName: 'Convidado',
    token, isGuest: true, createdAt: new Date().toISOString(),
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

  res.json({ success: true, user: { username: user.username, displayName: user.displayName, isGuest: !!user.isGuest } });
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

// ===== STREAMING ROUTE =====
app.post('/api/chats/:id/message/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.write(`data: ${JSON.stringify({ error: 'Não autenticado.' })}\\n\\n`);
    return res.end();
  }

  const users = await readJson('users.json');
  const user = Object.values(users).find(u => u.token === token);
  if (!user) {
    res.write(`data: ${JSON.stringify({ error: 'Token inválido.' })}\\n\\n`);
    return res.end();
  }

  const parse = messageSchema.safeParse(req.body);
  if (!parse.success) {
    res.write(`data: ${JSON.stringify({ error: 'Mensagem inválida.' })}\\n\\n`);
    return res.end();
  }

  const { message, agent } = parse.data;
  const chats = await readJson('chats.json');
  const chat = (chats[user.username] || []).find(c => c.id === req.params.id);
  if (!chat) {
    res.write(`data: ${JSON.stringify({ error: 'Chat não encontrado.' })}\\n\\n`);
    return res.end();
  }

  chat.messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

  const history = chat.messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
  const agentKey = agent || DEFAULT_AGENT;
  const systemPrompt = AGENTS[agentKey] || AGENTS[DEFAULT_AGENT];
  const messages = [{ role: 'system', content: systemPrompt }, ...history];

  try {
    let fullResponse = '';
    const result = await callAI(messages, true, res);
    
    if (result) {
      fullResponse = result;
    } else {
      // Streaming já foi enviado pelo callAI
      fullResponse = '(resposta em streaming)';
    }

    if (fullResponse && fullResponse !== '(resposta em streaming)') {
      if (!moderate(fullResponse)) fullResponse = SAFE_FALLBACK;
      chat.messages.push({ role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() });
      chat.updatedAt = new Date().toISOString();
      if (chat.messages.length === 2 && chat.title === 'Nova Conversa') {
        chat.title = message.slice(0, 40) + (message.length > 40 ? '...' : '');
      }
      await writeJson('chats.json', chats);
    }

    res.end();
  } catch (error) {
    console.error('Erro IA:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Erro interno. Tente novamente.' })}\\n\\n`);
    res.end();
  }
});

// ===== NORMAL MESSAGE ROUTE =====
app.post('/api/chats/:id/message', async (req, res) => {
  const timestamp = new Date().toISOString();
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Não autenticado.' });

  const users = await readJson('users.json');
  const user = Object.values(users).find(u => u.token === token);
  if (!user) return res.status(401).json({ success: false, error: 'Token inválido.' });

  const parse = messageSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ success: false, error: 'Mensagem inválida.' });

  const { message, agent } = parse.data;
  const chats = await readJson('chats.json');
  const chat = (chats[user.username] || []).find(c => c.id === req.params.id);
  if (!chat) return res.status(404).json({ success: false, error: 'Chat não encontrado.' });

  chat.messages.push({ role: 'user', content: message, timestamp });

  const history = chat.messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
  const agentKey = agent || DEFAULT_AGENT;
  const systemPrompt = AGENTS[agentKey] || AGENTS[DEFAULT_AGENT];
  const messages = [{ role: 'system', content: systemPrompt }, ...history];

  try {
    let responseText = await callAI(messages);
    if (!moderate(responseText)) responseText = SAFE_FALLBACK;

    chat.messages.push({ role: 'assistant', content: responseText, timestamp: new Date().toISOString() });
    chat.updatedAt = new Date().toISOString();

    if (chat.messages.length === 2 && chat.title === 'Nova Conversa') {
      chat.title = message.slice(0, 40) + (message.length > 40 ? '...' : '');
    }

    await writeJson('chats.json', chats);
    res.json({ success: true, data: responseText, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Erro IA:', error);
    res.status(500).json({ success: false, error: error.message || 'Erro interno. Tente novamente.', timestamp });
  }
});

// ===== UPLOAD =====
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado.' });
  res.json({ success: true, filename: req.file.originalname, path: `/uploads/${req.file.filename}` });
});

app.use('/uploads', express.static(path.join(DATA_DIR, 'uploads')));

// ===== ADMIN / BAN =====
app.post('/api/admin/ban', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const users = await readJson('users.json');
  const user = Object.values(users).find(u => u.token === token);
  if (!user || user.username !== 'StrawField') return res.status(403).json({ success: false, error: 'Acesso negado.' });

  const { fingerprint } = req.body;
  if (!fingerprint) return res.status(400).json({ success: false, error: 'Fingerprint obrigatório.' });

  // Anti auto-ban
  const currentFp = req.headers['x-device-fingerprint'];
  if (fingerprint === currentFp) return res.status(400).json({ success: false, error: 'Você não pode se banir! 🍓' });

  const bans = await readJson('bans.json');
  bans[fingerprint] = { bannedAt: new Date().toISOString(), by: user.username };
  await writeJson('bans.json', bans);

  res.json({ success: true, message: 'Dispositivo banido.' });
});

app.post('/api/admin/unban', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const users = await readJson('users.json');
  const user = Object.values(users).find(u => u.token === token);
  if (!user || user.username !== 'StrawField') return res.status(403).json({ success: false, error: 'Acesso negado.' });

  const { fingerprint } = req.body;
  const bans = await readJson('bans.json');
  delete bans[fingerprint];
  await writeJson('bans.json', bans);

  res.json({ success: true, message: 'Dispositivo desbanido.' });
});

app.get('/api/admin/bans', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const users = await readJson('users.json');
  const user = Object.values(users).find(u => u.token === token);
  if (!user || user.username !== 'StrawField') return res.status(403).json({ success: false, error: 'Acesso negado.' });

  const bans = await readJson('bans.json');
  res.json({ success: true, bans });
});

// ===== HEALTH =====
app.get('/api/health', async (req, res) => {
  const providers = [];
  if (deepseek) providers.push('deepseek');
  if (openrouter) providers.push('openrouter');
  if (groq) providers.push('groq');
  if (gemini) providers.push('gemini');
  res.json({ success: true, status: 'online', providers, timestamp: new Date().toISOString() });
});

// ===== ERROR HANDLERS =====
app.use((req, res) => res.status(404).json({ success: false, error: 'Rota não encontrada.' }));
app.use((err, req, res, next) => {
  console.error('Erro global:', err.stack);
  res.status(500).json({ success: false, error: 'Erro interno inesperado.' });
});

// ===== START =====
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 StrawField Backend rodando na porta ${PORT}`);
  const p = [deepseek ? 'DeepSeek' : '', openrouter ? 'OpenRouter' : '', groq ? 'Groq' : '', gemini ? 'Gemini' : ''].filter(Boolean);
  console.log(`   Provedores: ${p.join(', ') || 'NENHUM — configure o .env!'}`);
});