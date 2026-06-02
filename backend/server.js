const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// ========== FIX RENDER PROXY ==========
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ========== CONFIGURAÇÃO DE PROVIDERS ==========
const PROVIDERS = [
  {
    name: 'Gemini',
    key: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-05-20',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    enabled: !!process.env.GEMINI_API_KEY
  },
  {
    name: 'OpenRouter',
    key: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-maverick:free',
    baseURL: 'https://openrouter.ai/api/v1',
    enabled: !!process.env.OPENROUTER_API_KEY
  },
  {
    name: 'Groq',
    key: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    baseURL: 'https://api.groq.com/openai/v1',
    enabled: !!process.env.GROQ_API_KEY
  },
  {
    name: 'DeepSeek',
    key: process.env.DEEPSEEK_API_KEY,
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    baseURL: 'https://api.deepseek.com/v1',
    enabled: !!process.env.DEEPSEEK_API_KEY
  }
];

// ========== ESTADO DAS KEYS ==========
let providerStatus = {};

async function testProviders() {
  console.log('\n🔍 Testando providers...');
  for (const p of PROVIDERS) {
    if (!p.enabled) {
      providerStatus[p.name] = { ok: false, error: 'Key não configurada' };
      console.log(`  ❌ ${p.name}: Key não configurada`);
      continue;
    }
    try {
      if (p.name === 'Gemini') {
        const url = `${p.baseURL}/models/${p.model}?key=${p.key}`;
        await axios.get(url, { timeout: 10000 });
      } else {
        await axios.get(`${p.baseURL}/models`, {
          headers: { 'Authorization': `Bearer ${p.key}` },
          timeout: 10000
        });
      }
      providerStatus[p.name] = { ok: true };
      console.log(`  ✅ ${p.name}: OK`);
    } catch (err) {
      providerStatus[p.name] = { ok: false, error: err.response?.status || err.message };
      console.log(`  ❌ ${p.name}: ${err.response?.status || err.message}`);
    }
  }
  const working = Object.entries(providerStatus).filter(([_, v]) => v.ok).map(([k]) => k);
  console.log(`\n🟢 Providers funcionando: ${working.join(', ') || 'NENHUM'}\n`);
}

// ========== ENDPOINTS BÁSICOS ==========
app.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    providers: providerStatus,
    working: Object.entries(providerStatus).filter(([_, v]) => v.ok).map(([k]) => k)
  });
});

// ========== CHAT SEM STREAMING ==========
app.post('/api/chat', async (req, res) => {
  const { messages, model, temperature = 0.7 } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const errors = [];

  for (const p of PROVIDERS) {
    if (!p.enabled || !providerStatus[p.name]?.ok) continue;

    try {
      let response;
      const startTime = Date.now();

      if (p.name === 'Gemini') {
        const contents = messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));

        const url = `${p.baseURL}/models/${p.model}:generateContent?key=${p.key}`;
        response = await axios.post(url, {
          contents,
          generationConfig: { temperature, maxOutputTokens: 8192 }
        }, { timeout: 60000 });

        const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const thinking = response.data.candidates?.[0]?.content?.parts?.[1]?.text || '';

        return res.json({
          content: text,
          thinking: thinking || undefined,
          provider: p.name,
          model: p.model,
          latency: Date.now() - startTime
        });

      } else {
        // OpenRouter / Groq / DeepSeek (OpenAI compatible)
        response = await axios.post(`${p.baseURL}/chat/completions`, {
          model: p.model,
          messages,
          temperature,
          max_tokens: 8192
        }, {
          headers: {
            'Authorization': `Bearer ${p.key}`,
            'Content-Type': 'application/json',
            ...(p.name === 'OpenRouter' ? { 'HTTP-Referer': 'https://straw-field-ai-uemo.vercel.app' } : {})
          },
          timeout: 60000
        });

        const choice = response.data.choices?.[0];
        const text = choice?.message?.content || '';
        const reasoning = choice?.message?.reasoning || choice?.message?.reasoning_content || '';

        return res.json({
          content: text,
          thinking: reasoning || undefined,
          provider: p.name,
          model: p.model,
          latency: Date.now() - startTime
        });
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.message;
      errors.push(`${p.name}: ${status} - ${msg}`);
      console.log(`❌ ${p.name} falhou: ${status} - ${msg}`);
      continue;
    }
  }

  // Nenhum provider funcionou
  res.status(503).json({
    error: 'Todos os providers falharam',
    details: errors,
    providers: providerStatus
  });
});

// ========== WEB SEARCH ==========
app.post('/api/search', async (req, res) => {
  const { query } = req.body;
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });

    const results = [];
    const linkRegex = /<a rel="nofollow" class="result__a" href="(.*?)">(.*?)<\/a>/g;
    let match;
    while ((match = linkRegex.exec(data)) !== null && results.length < 5) {
      results.push({
        url: match[1],
        title: match[2].replace(/<[^>]*>/g, '')
      });
    }

    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
});

// ========== ADMIN ==========
const fs = require('fs');
const path = require('path');
const BANS_FILE = path.join(__dirname, 'bans.json');

if (!fs.existsSync(BANS_FILE)) fs.writeFileSync(BANS_FILE, '[]');

function getBans() {
  try { return JSON.parse(fs.readFileSync(BANS_FILE, 'utf8')); }
  catch { return []; }
}

app.get('/api/admin/bans', (req, res) => {
  res.json(getBans());
});

app.post('/api/admin/ban', (req, res) => {
  const { fingerprint, reason } = req.body;
  const bans = getBans();
  if (!bans.find(b => b.fingerprint === fingerprint)) {
    bans.push({ fingerprint, reason, date: new Date().toISOString() });
    fs.writeFileSync(BANS_FILE, JSON.stringify(bans));
  }
  res.json({ success: true });
});

app.post('/api/admin/unban', (req, res) => {
  const { fingerprint } = req.body;
  let bans = getBans();
  bans = bans.filter(b => b.fingerprint !== fingerprint);
  fs.writeFileSync(BANS_FILE, JSON.stringify(bans));
  res.json({ success: true });
});

// ========== INICIALIZAÇÃO ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 StrawField API rodando na porta ${PORT}`);
  await testProviders();
});

// Re-testa providers a cada 5 minutos
setInterval(testProviders, 5 * 60 * 1000);