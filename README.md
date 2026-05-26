# 🤖 IA Chat — 100% Gratuito

Chat completo com IA que não custa nada para usar. Rode local com Ollama ou use APIs gratuitas online (Groq, Gemini).

---

## 📁 Estrutura

```
ia-chat-fullstack/
├── backend/          # API Node.js + Express
│   ├── .env          # SUAS CONFIGURAÇÕES (criar do .env.example)
│   ├── .env.example  # Modelo com todas as opções
│   ├── package.json
│   └── server.js     # Lógica da IA (Ollama → Groq → Gemini → OpenAI)
└── frontend/         # React + Vite + Tailwind
    ├── .env
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        └── index.css
```

---

## 🚀 COMO RODAR (escolha UMA opção)

### ✅ OPÇÃO A: OLLAMA — 100% Grátis, Privado, Local
**Não precisa de internet rápida nem cartão de crédito.**

1. **Instale o Ollama**: https://ollama.com
2. **Baixe um modelo** (no terminal):
   ```bash
   ollama pull llama3.2
   ```
3. **Verifique se está rodando**:
   ```bash
   ollama list
   ```
4. **Configure o backend**:
   ```bash
   cd backend
   cp .env.example .env
   # Deixe OLLAMA_URL e OLLAMA_MODEL descomentados (já vem assim)
   # NÃO precisa preencher nenhuma chave de API!
   ```
5. **Instale e rode o backend**:
   ```bash
   npm install
   npm run dev
   ```
6. **Rode o frontend** (outro terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
7. **Acesse**: http://localhost:5173

> 💡 **Dica**: Modelos leves para PC modesto: `llama3.2`, `phi3`, `gemma2:2b`
> Modelos melhores (precisam de mais RAM): `llama3.1`, `mistral`, `qwen2.5`

---

### ✅ OPÇÃO B: GROQ — Gratuito, Online, Ultra-rápido
**Não precisa instalar nada pesado no PC.**

1. **Cadastre-se**: https://console.groq.com
2. **Copie sua API Key** (é grátis, sem cartão)
3. **Configure o backend**:
   ```bash
   cd backend
   cp .env.example .env
   ```
   No `.env`, preencha:
   ```bash
   GROQ_API_KEY=sua-chave-aqui
   GROQ_MODEL=llama3-8b-8192
   ```
   Comente ou apague as linhas do Ollama se não quiser usar local.
4. **Instale e rode** (mesmos comandos da Opção A, passos 5 e 6)

---

### ✅ OPÇÃO C: GOOGLE GEMINI — Gratuito, Online
1. **Pegue a key**: https://aistudio.google.com/app/apikey
2. No `.env` do backend:
   ```bash
   GEMINI_API_KEY=sua-chave-aqui
   GEMINI_MODEL=gemini-1.5-flash
   ```
3. Rode normalmente.

---

## 🔄 Como funciona a ordem de fallback?

O backend tenta automaticamente na seguinte ordem:

```
1. Ollama (local, grátis)
2. Groq (online, grátis)
3. Gemini (online, grátis)
4. OpenAI (pago, só se você configurar)
```

Se um falhar, passa para o próximo **automaticamente**. Você pode ter vários configurados ao mesmo tempo para redundância!

---

## 🛡️ Segurança — "Nunca xingar o usuário"

- **System Prompt fixo**: toda conversa começa com a regra absoluta de respeito
- **Moderação Regex**: lista de palavrões em português é verificada na resposta da IA
- **Fallback automático**: se a IA soltar algo ofensivo, é trocado por mensagem educada

---

## ❓ Problemas comuns

| Erro | Solução |
|------|---------|
| `Ollama: fetch failed` | Ollama não está rodando. Abra o terminal e rode `ollama serve` |
| `Ollama: model not found` | Rode `ollama pull llama3.2` para baixar o modelo |
| `Groq: 401` | Sua chave Groq está errada ou expirada |
| `Gemini: 403` | Sua chave Gemini não está ativa. Gere outra no AI Studio |
| `Nenhum provedor disponível` | Você não configurou nenhuma IA. Edite o `.env` |
| `Failed to fetch` | Backend está offline. Verifique se `npm run dev` está rodando na porta 3001 |

---

Feito com ❤️ para ser acessível a todos.
