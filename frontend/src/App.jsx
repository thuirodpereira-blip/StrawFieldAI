import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Trash2, Moon, Sun, Bot, User, AlertCircle, Plus,
  MessageSquare, History, LogOut, LogIn, UserPlus, Ghost,
  ChevronLeft, ChevronRight, Sparkles, X, Menu
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/* ============================================================
   STRAWFIELD v2.0 — Interface Moderna com Auth & Chat History
   ============================================================ */

export default function App() {
  // ===== ESTADOS GLOBAIS =====
  const [token, setToken] = useState(localStorage.getItem('sf_token') || null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('chat'); // 'chat' | 'login' | 'register'
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('sf_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // ===== ESTADOS DE CHAT =====
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const chatEndRef = useRef(null);

  // ===== DETECTA MOBILE =====
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ===== TEMA =====
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) { root.classList.add('dark'); localStorage.setItem('sf_theme', 'dark'); }
    else { root.classList.remove('dark'); localStorage.setItem('sf_theme', 'light'); }
  }, [darkMode]);

  // ===== VERIFICA TOKEN =====
  useEffect(() => {
    if (!token) { setUser(null); return; }
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.success) setUser(data.user);
        else { localStorage.removeItem('sf_token'); setToken(null); setUser(null); }
      })
      .catch(() => { localStorage.removeItem('sf_token'); setToken(null); setUser(null); });
  }, [token]);

  // ===== CARREGA CHATS =====
  const loadChats = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_URL}/api/chats`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      if (data.success) {
        setChats(data.chats);
        if (data.chats.length > 0 && !activeChatId) {
          setActiveChatId(data.chats[0].id);
        }
      }
    } catch (e) { console.error(e); }
  }, [token, activeChatId]);

  useEffect(() => { loadChats(); }, [loadChats]);

  // ===== CARREGA MENSAGENS DO CHAT ATIVO =====
  useEffect(() => {
    if (!activeChatId || !token) { setMessages([]); return; }
    fetch(`${API_URL}/api/chats/${activeChatId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.success) setMessages(data.chat.messages || []);
        else setMessages([]);
      })
      .catch(() => setMessages([]));
  }, [activeChatId, token]);

  // ===== SCROLL AUTOMÁTICO =====
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, error]);

  // ===== CRIAR NOVO CHAT =====
  const createChat = async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_URL}/api/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: 'Nova Conversa' }),
      });
      const data = await r.json();
      if (data.success) {
        setChats(prev => [data.chat, ...prev]);
        setActiveChatId(data.chat.id);
        setMessages([]);
        if (isMobile) setSidebarOpen(false);
      }
    } catch (e) { console.error(e); }
  };

  // ===== DELETAR CHAT =====
  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    if (!token) return;
    if (!confirm('Deletar esta conversa?')) return;
    try {
      await fetch(`${API_URL}/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (activeChatId === chatId) {
        const remaining = chats.filter(c => c.id !== chatId);
        setActiveChatId(remaining[0]?.id || null);
        setMessages([]);
      }
    } catch (err) { console.error(err); }
  };

  // ===== ENVIAR MENSAGEM =====
  const handleSend = async () => {
    if (!input.trim() || loading || !token) return;

    // Se não houver chat ativo, cria um novo automaticamente
    let currentChatId = activeChatId;
    if (!currentChatId) {
      try {
        const r = await fetch(`${API_URL}/api/chats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: 'Nova Conversa' }),
        });
        const data = await r.json();
        if (data.success) {
          currentChatId = data.chat.id;
          setChats(prev => [data.chat, ...prev]);
          setActiveChatId(currentChatId);
          setMessages([]);
        } else {
          setError('Não foi possível criar conversa.');
          return;
        }
      } catch (e) {
        setError('Erro ao criar conversa.');
        return;
      }
    }

    const userMessage = input.trim();
    setInput('');
    setError(null);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const r = await fetch(`${API_URL}/api/chats/${currentChatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) throw new Error(data.error || 'Erro na IA.');
      if (!data.data || typeof data.data !== 'string') throw new Error('Resposta inválida.');

      setMessages(prev => [...prev, { role: 'assistant', content: data.data }]);
      // Atualiza título na lista
      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, title: c.title === 'Nova Conversa' ? userMessage.slice(0, 40) + (userMessage.length > 40 ? '...' : '') : c.title } : c));
      loadChats();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro ao obter resposta.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ===== AUTH HANDLERS =====
  const handleRegister = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd);
    try {
      const r = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (data.success) {
        localStorage.setItem('sf_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setView('chat');
        createChat();
      } else {
        alert(data.error);
      }
    } catch (err) { alert('Erro de conexão.'); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd);
    try {
      const r = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (data.success) {
        localStorage.setItem('sf_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setView('chat');
      } else {
        alert(data.error);
      }
    } catch (err) { alert('Erro de conexão.'); }
  };

  const handleGuest = async () => {
    try {
      const r = await fetch(`${API_URL}/api/auth/guest`, { method: 'POST' });
      const data = await r.json();
      if (data.success) {
        localStorage.setItem('sf_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setView('chat');
        createChat();
      }
    } catch (err) { alert('Erro de conexão.'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('sf_token');
    setToken(null);
    setUser(null);
    setChats([]);
    setActiveChatId(null);
    setMessages([]);
    setView('login');
  };

  // ===== RENDER: LOGIN / REGISTER =====
  if (!token || view === 'login' || view === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-950 dark:to-slate-900 p-4 transition-colors duration-300">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">StrawField</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Sua IA com personalidade</p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8">
            {view === 'login' ? (
              <>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">Entrar</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Username</label>
                    <input name="username" required className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="seu_username" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Senha</label>
                    <input name="password" type="password" required className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="••••••" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2">
                    <LogIn className="w-4 h-4" /> Entrar
                  </button>
                </form>
                <div className="mt-6 space-y-3">
                  <button onClick={handleGuest} className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                    <Ghost className="w-4 h-4" /> Usar como Convidado
                  </button>
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                    Não tem conta?{' '}
                    <button onClick={() => setView('register')} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Criar conta</button>
                  </p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">Criar Conta</h2>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Username</label>
                    <input name="username" required className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="ex: joao_silva" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nome de exibição</label>
                    <input name="displayName" className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="ex: João" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Senha</label>
                    <input name="password" type="password" required minLength={4} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="••••••" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" /> Criar Conta
                  </button>
                </form>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                  Já tem conta?{' '}
                  <button onClick={() => setView('login')} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Entrar</button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== RENDER: CHAT =====
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
      {/* ===== SIDEBAR ===== */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} ${isMobile ? 'absolute z-50 h-full' : 'relative'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-800 dark:text-white truncate">StrawField</h2>
            {user && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.displayName || user.username}</p>}
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Novo Chat */}
        <div className="p-3">
          <button onClick={createChat} className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Nova Conversa
          </button>
        </div>

        {/* Lista de Chats */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">Histórico</p>
          {chats.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Nenhuma conversa ainda</p>
          )}
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => { setActiveChatId(chat.id); if (isMobile) setSidebarOpen(false); }}
              className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${
                activeChatId === chat.id
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
              }`}
            >
              <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeChatId === chat.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${activeChatId === chat.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  {chat.title}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  {new Date(chat.updatedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button
                onClick={(e) => deleteChat(chat.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Deletar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? 'Modo Claro' : 'Modo Escuro'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* ===== ÁREA PRINCIPAL ===== */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-800 dark:text-white truncate">
              {chats.find(c => c.id === activeChatId)?.title || 'StrawField'}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-600 dark:text-slate-300">
                <User className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{user.displayName || user.username}</span>
              </div>
            )}
          </div>
        </header>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-600/10 dark:from-indigo-500/20 dark:to-violet-600/20 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">Comece uma conversa</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                Pergunte algo, peça um código, peça ajuda com um projeto — a StrawField está pronta!
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
              <div className={`flex max-w-[90%] sm:max-w-[75%] md:max-w-[65%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}>
                  {msg.role === 'user'
                    ? <User className="w-4 h-4 text-white" />
                    : <Bot className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  }
                </div>

                {/* Bolha */}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-br-md'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md border border-slate-200 dark:border-slate-700'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {/* Digitando */}
          {loading && (
            <div className="flex justify-start w-full animate-fade-in-up">
              <div className="flex max-w-[65%] gap-3 flex-row">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex gap-1.5 items-center h-5">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="flex justify-center w-full animate-fade-in-up">
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm shadow-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <footer className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mensagem StrawField..."
              rows={1}
              className="flex-1 resize-none max-h-32 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 scrollbar-thin text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-3 bg-gradient-to-br from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">
            StrawField pode errar. Verifique fatos importantes.
          </p>
        </footer>
      </main>
    </div>
  );
}
