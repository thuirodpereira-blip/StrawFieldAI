import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Moon, Sun, Bot, User, AlertCircle, Plus, MessageSquare, LogOut, Ghost, Sparkles, Menu, X, Volume2, VolumeX, Download, Bell, BellOff, Settings as SettingsIcon, Heart, Code, BookOpen, Atom, Palette, Globe, Cpu, Check, ArrowLeft, Shield, Zap, Edit3, RefreshCw, Search, Copy, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import Agents from './Agents';
import Settings from './Settings';
import Credits from './Credits';
import AdminPanel from './AdminPanel';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const THEMES = {
  indigo: { primary: 'indigo', accent: 'text-indigo-400', bg: 'bg-indigo-500', ring: 'ring-indigo-400', border: 'border-indigo-500/30', bgSoft: 'bg-indigo-500/10' },
  rose: { primary: 'rose', accent: 'text-rose-400', bg: 'bg-rose-500', ring: 'ring-rose-400', border: 'border-rose-500/30', bgSoft: 'bg-rose-500/10' },
  emerald: { primary: 'emerald', accent: 'text-emerald-400', bg: 'bg-emerald-500', ring: 'ring-emerald-400', border: 'border-emerald-500/30', bgSoft: 'bg-emerald-500/10' },
  amber: { primary: 'amber', accent: 'text-amber-400', bg: 'bg-amber-500', ring: 'ring-amber-400', border: 'border-amber-500/30', bgSoft: 'bg-amber-500/10' },
  cyan: { primary: 'cyan', accent: 'text-cyan-400', bg: 'bg-cyan-500', ring: 'ring-cyan-400', border: 'border-cyan-500/30', bgSoft: 'bg-cyan-500/10' },
};

const TRANSLATIONS = {
  pt: {
    welcome: 'Bem-vindo à StrawField AI',
    subtitle: 'Sua IA parceira. Escolha como começar:',
    register: 'Criar Conta',
    login: 'Entrar',
    guest: 'Usar como Convidado',
    username: 'Nome de usuário',
    password: 'Senha',
    displayName: 'Como quer ser chamado?',
    createAccount: 'Criar',
    enter: 'Entrar',
    back: 'Voltar',
    newChat: 'Nova Conversa',
    logout: 'Sair',
    typeMessage: 'Digite sua mensagem...',
    thinking: 'StrawField está pensando...',
    settings: 'Configurações',
    agents: 'Agentes',
    credits: 'Créditos',
    admin: 'Admin',
    noChats: 'Nenhuma conversa ainda',
    startChat: 'Inicie uma conversa!',
    errorConnection: 'Erro de conexão',
    retry: 'Tentar novamente',
    thinkingLabel: '💭 Pensamento',
    modelLabel: 'Modelo',
    copy: 'Copiar',
    copied: 'Copiado!',
    edit: 'Editar',
    regenerate: 'Refazer',
    dropFile: 'Solte o arquivo aqui',
    searchWeb: 'Buscar na web',
  },
  en: {
    welcome: 'Welcome to StrawField AI',
    subtitle: 'Your AI partner. Choose how to start:',
    register: 'Create Account',
    login: 'Login',
    guest: 'Use as Guest',
    username: 'Username',
    password: 'Password',
    displayName: 'What should we call you?',
    createAccount: 'Create',
    enter: 'Enter',
    back: 'Back',
    newChat: 'New Chat',
    logout: 'Logout',
    typeMessage: 'Type your message...',
    thinking: 'StrawField is thinking...',
    settings: 'Settings',
    agents: 'Agents',
    credits: 'Credits',
    admin: 'Admin',
    noChats: 'No chats yet',
    startChat: 'Start a conversation!',
    errorConnection: 'Connection error',
    retry: 'Retry',
    thinkingLabel: '💭 Thinking',
    modelLabel: 'Model',
    copy: 'Copy',
    copied: 'Copied!',
    edit: 'Edit',
    regenerate: 'Regenerate',
    dropFile: 'Drop file here',
    searchWeb: 'Search web',
  },
  es: {
    welcome: 'Bienvenido a StrawField AI',
    subtitle: 'Tu IA compañera. Elige cómo empezar:',
    register: 'Crear Cuenta',
    login: 'Iniciar Sesión',
    guest: 'Usar como Invitado',
    username: 'Nombre de usuario',
    password: 'Contraseña',
    displayName: '¿Cómo quieres que te llamemos?',
    createAccount: 'Crear',
    enter: 'Entrar',
    back: 'Volver',
    newChat: 'Nueva Conversación',
    logout: 'Salir',
    typeMessage: 'Escribe tu mensaje...',
    thinking: 'StrawField está pensando...',
    settings: 'Configuraciones',
    agents: 'Agentes',
    credits: 'Créditos',
    admin: 'Admin',
    noChats: 'Aún no hay conversaciones',
    startChat: '¡Inicia una conversación!',
    errorConnection: 'Error de conexión',
    retry: 'Reintentar',
    thinkingLabel: '💭 Pensamiento',
    modelLabel: 'Modelo',
    copy: 'Copiar',
    copied: '¡Copiado!',
    edit: 'Editar',
    regenerate: 'Rehacer',
    dropFile: 'Suelta el archivo aquí',
    searchWeb: 'Buscar en la web',
  },
};

const PROMPT_TEMPLATES = [
  { id: 'code', icon: Code, label: 'Código', prompt: 'Escreva um código em [linguagem] que [faça o quê]. Explique cada parte.' },
  { id: 'explain', icon: BookOpen, label: 'Explicar', prompt: 'Explique [tópico] como se eu tivesse 10 anos. Use analogias simples.' },
  { id: 'debug', icon: Zap, label: 'Debugar', prompt: 'Analise este código e encontre o erro:\n\n```\n[cole o código aqui]\n```' },
  { id: 'creative', icon: Sparkles, label: 'Criar', prompt: 'Crie uma [história/roteiro/ideia] sobre [tema]. Seja criativo!' },
  { id: 'study', icon: Atom, label: 'Estudar', prompt: 'Crie um resumo completo sobre [tema] com tópicos e exemplos.' },
];

function generateFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('StrawField FP', 2, 2);
  const canvasData = canvas.toDataURL();
  const raw = navigator.userAgent + screen.width + screen.height + canvasData;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'fp_' + Math.abs(hash).toString(16);
}

function playSound(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'send') {
      osc.frequency.value = 600;
      gain.gain.value = 0.03;
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'receive') {
      osc.frequency.value = 450;
      gain.gain.value = 0.03;
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'error') {
      osc.frequency.value = 150;
      gain.gain.value = 0.05;
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {}
}

function toSafeString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(toSafeString).join('');
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
}

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    const text = toSafeString(children);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayText = toSafeString(children);

  return (
    <div className="relative group my-2">
      <div className="flex items-center justify-between px-3 py-1 bg-gray-800 rounded-t-lg border-b border-gray-700">
        <span className="text-xs text-gray-400">{language || 'code'}</span>
        <button 
          onClick={handleCopy}
          className="p-1 rounded hover:bg-gray-700 transition-colors text-gray-400"
        >
          {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="bg-gray-900 p-3 rounded-b-lg overflow-x-auto">
        <code className="text-sm">{displayText}</code>
      </pre>
    </div>
  );
}

function MarkdownRenderer({ content, darkMode }) {
  const safeContent = toSafeString(content);
  
  if (!safeContent) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = toSafeString(children);
          
          return !inline && match ? (
            <CodeBlock language={match[1]}>{codeString}</CodeBlock>
          ) : (
            <code className={`px-1.5 py-0.5 rounded text-sm ${darkMode ? 'bg-gray-700 text-pink-300' : 'bg-gray-200 text-pink-600'}`} {...props}>
              {children}
            </code>
          );
        },
        pre({ children }) {
          return <>{children}</>;
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>;
        },
        ul({ children }) {
          return <ul className="list-disc ml-4 mb-2">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal ml-4 mb-2">{children}</ol>;
        },
        li({ children }) {
          return <li className="mb-0.5">{children}</li>;
        },
        h1({ children }) {
          return <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-base font-bold mb-2 mt-2">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3>;
        },
        blockquote({ children }) {
          return <blockquote className={`border-l-4 pl-3 italic my-2 ${darkMode ? 'border-pink-500 text-gray-300' : 'border-pink-400 text-gray-600'}`}>{children}</blockquote>;
        },
        table({ children }) {
          return <table className="w-full text-sm border-collapse my-2">{children}</table>;
        },
        th({ children }) {
          return <th className={`border px-2 py-1 text-left ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100'}`}>{children}</th>;
        },
        td({ children }) {
          return <td className={`border px-2 py-1 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{children}</td>;
        },
      }}
    >
      {safeContent}
    </ReactMarkdown>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('sf_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [currentView, setCurrentView] = useState('chat');
  const [currentAgent, setCurrentAgent] = useState(() => localStorage.getItem('sf_agent') || 'strawfield');
  const [currentModel, setCurrentModel] = useState(() => localStorage.getItem('sf_model') || 'deepseek');
  const [showCredits, setShowCredits] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('sf_token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sf_user')); } catch { return null; }
  });
  const [authMode, setAuthMode] = useState('welcome');
  const [authForm, setAuthForm] = useState({ username: '', password: '', displayName: '' });
  const [authError, setAuthError] = useState('');
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('sf_color') || 'indigo');
  const [notifications, setNotifications] = useState(() => localStorage.getItem('sf_notif') === 'true');
  const [currentLang, setCurrentLang] = useState(() => localStorage.getItem('sf_lang') || 'pt');
  const [ttsEnabled, setTtsEnabled] = useState(() => localStorage.getItem('sf_tts') === 'true');
  const [streamingEnabled, setStreamingEnabled] = useState(() => localStorage.getItem('sf_stream') !== 'false');
  const [showPrompts, setShowPrompts] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [deviceFingerprint] = useState(() => generateFingerprint());
  const [dragOver, setDragOver] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.pt;
  const theme = THEMES[currentTheme] || THEMES.indigo;

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) { root.classList.add('dark'); localStorage.setItem('sf_theme', 'dark'); }
    else { root.classList.remove('dark'); localStorage.setItem('sf_theme', 'light'); }
  }, [darkMode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, error]);

  useEffect(() => {
    localStorage.setItem('sf_agent', currentAgent);
  }, [currentAgent]);

  useEffect(() => {
    localStorage.setItem('sf_model', currentModel);
  }, [currentModel]);

  useEffect(() => {
    localStorage.setItem('sf_color', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem('sf_notif', notifications);
    if (notifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('sf_lang', currentLang);
  }, [currentLang]);

  useEffect(() => {
    localStorage.setItem('sf_tts', ttsEnabled);
  }, [ttsEnabled]);

  useEffect(() => {
    localStorage.setItem('sf_stream', streamingEnabled);
  }, [streamingEnabled]);

  useEffect(() => {
    if (token) { fetchChats(); fetchUser(); }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetch(`${API_URL}/api/health`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  // ❌ APAGA O ANTIGO E COLE ISSO:
useEffect(() => {
  const handleVisibility = () => {
    if (document.hidden) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } else {
      // Wake backend quando volta
      fetch(`${API_URL}/api/health`).catch(() => {});
      // Limpa loading travado
      setLoading(prev => {
        if (prev) {
          setError('Conexão perdida. Tente enviar novamente.');
          return false;
        }
        return prev;
      });
      // Força re-render
      setMessages(prev => [...prev]);
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, []);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setUser(data.user);
    } catch {}
  };

  const fetchChats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chats`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setChats(data.chats);
    } catch { setError(t.errorConnection); }
  };

  // Detecta qual agente usar baseado na mensagem
function detectAgent(message) {
  const lower = message.toLowerCase();
  
  if (lower.includes('código') || lower.includes('code') || lower.includes('programar') || 
      lower.includes('javascript') || lower.includes('python') || lower.includes('html') ||
      lower.includes('css') || lower.includes('bug') || lower.includes('erro no código') ||
      lower.includes('function') || lower.includes('const') || lower.includes('let')) {
    return 'coder';
  }
  
  if (lower.includes('explicar') || lower.includes('como funciona') || lower.includes('o que é') ||
      lower.includes('definição') || lower.includes('conceito') || lower.includes('aula') ||
      lower.includes('estudar') || lower.includes('aprender') || lower.includes('ensina')) {
    return 'teacher';
  }
  
  if (lower.includes('criar') || lower.includes('história') || lower.includes('roteiro') ||
      lower.includes('poema') || lower.includes('música') || lower.includes('ideia') ||
      lower.includes('inventar') || lower.includes('imagina') || lower.includes('criativo')) {
    return 'creative';
  }
  
  if (lower.includes('ciência') || lower.includes('física') || lower.includes('química') ||
      lower.includes('biologia') || lower.includes('matemática') || lower.includes('cálculo') ||
      lower.includes('teorema') || lower.includes('pesquisa') || lower.includes('estudo científico')) {
    return 'scientist';
  }
  
  return 'strawfield'; // Padrão
}

  const createChat = async (autoAgent = null) => {
  try {
    const res = await fetch(`${API_URL}/api/chats`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Nova Conversa' }),
    });
    const data = await res.json();
    if (data.success) {
      setChats(prev => [data.chat, ...prev]);
      setActiveChatId(data.chat.id);
      setMessages([]);
      // Se passou agente automático, usa ele
      if (autoAgent) {
        setCurrentAgent(autoAgent);
        localStorage.setItem('sf_agent', autoAgent);
      }
      return data.chat.id;
    }
  } catch { setError(t.errorConnection); }
  return null;
};

  const selectChat = async (chatId) => {
    try {
      const res = await fetch(`${API_URL}/api/chats/${chatId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setActiveChatId(chatId);
        setMessages(data.chat.messages || []);
        setCurrentView('chat');
      }
    } catch { setError(t.errorConnection); }
  };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_URL}/api/chats/${chatId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (activeChatId === chatId) { 
          setActiveChatId(null); 
          setMessages([]); 
          setCurrentAgent('strawfield');
          localStorage.setItem('sf_agent', 'strawfield');
        }
      }
    } catch { setError(t.errorConnection); }
  };

  const handleAuth = async (mode) => {
    setAuthError('');
    const { username, password, displayName } = authForm;
    if (!username || !password) { setAuthError('Preencha todos os campos.'); return; }
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = mode === 'register' ? { username, password, displayName } : { username, password };
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('sf_token', data.token);
        localStorage.setItem('sf_user', JSON.stringify(data.user));
        setToken(data.token); setUser(data.user); setAuthMode('welcome'); setAuthForm({ username: '', password: '', displayName: '' });
        fetchChats();
      } else { setAuthError(data.error || 'Erro na autenticação.'); }
    } catch { setAuthError(t.errorConnection); }
  };

  const handleGuest = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/guest`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('sf_token', data.token);
        localStorage.setItem('sf_user', JSON.stringify(data.user));
        setToken(data.token); setUser(data.user); setAuthMode('welcome');
        fetchChats();
      }
    } catch { setError(t.errorConnection); }
  };

  const handleLogout = () => {
    localStorage.removeItem('sf_token'); localStorage.removeItem('sf_user');
    setToken(null); setUser(null); setChats([]); setActiveChatId(null); setMessages([]); setCurrentView('chat');
  };

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = currentLang === 'pt' ? 'pt-BR' : currentLang === 'es' ? 'es-ES' : 'en-US';
    utter.rate = 1; utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const exportChat = () => {
    if (!messages.length) return;
    const text = messages.map(m => `${m.role === 'user' ? 'Você' : 'StrawField'}: ${toSafeString(m.content)}`).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `strawfield-chat-${new Date().toISOString().slice(0,10)}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const startEdit = (index) => {
    if (messages[index]?.role !== 'user') return;
    setEditingIndex(index);
    setEditText(toSafeString(messages[index].content));
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
  };

  const saveEdit = async () => {
    if (!editText.trim() || editingIndex === null || !activeChatId) return;
    
    try {
      const res = await fetch(`${API_URL}/api/chats/${activeChatId}/messages/${editingIndex}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setMessages(data.messages);
      setEditingIndex(null);
      setEditText('');
      
      await sendMessage(editText.trim(), data.messages);
    } catch (err) {
      setError(err.message || t.errorConnection);
    }
  };

  const regenerate = async (assistantIndex) => {
    let userIndex = -1;
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user') {
        userIndex = i;
        break;
      }
    }
    if (userIndex === -1) return;

    const userMsg = toSafeString(messages[userIndex].content);
    
    try {
      const res = await fetch(`${API_URL}/api/chats/${activeChatId}/messages/${assistantIndex}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setMessages(data.messages);
      await sendMessage(userMsg, data.messages, true);
    } catch (err) {
      setError(err.message || t.errorConnection);
    }
  };

  const searchWeb = async () => {
  if (!input.trim()) return;
  const query = input.trim();
  
  let chatId = activeChatId;
  if (!chatId) {
    chatId = await createChat();
    if (!chatId) return;
  }

  setMessages(prev => [...prev, { role: 'user', content: `🔍 Buscar na web: ${query}` }]);
  setInput('');
  setLoading(true);
  setError(null);

  try {
    const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    
    if (!data.success) throw new Error(data.error || 'Erro na busca.');

    const searchResults = data.results || [];
    
    // Se não achou nada, avisa
    if (searchResults.length === 0) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Não encontrei resultados para "${query}". Tente reformular sua pergunta com outros termos.`,
        model: 'Web Search'
      }]);
      playSound('receive');
      setLoading(false);
      return;
    }

    // Monta o contexto pra IA explicar
    let searchContext = `O usuário pesquisou: "${query}"\n\nAqui estão os resultados que encontrei na web:\n\n`;
    
    searchResults.forEach((r, i) => {
      searchContext += `[${i + 1}] ${r.title}\n${r.snippet || 'Sem descrição'}\nURL: ${r.url}\n\n`;
    });
    
    searchContext += `\nCom base nesses resultados, explique de forma clara e completa sobre "${query}". 
Inclua os links relevantes no final da resposta.
Responda em português brasileiro.`;

    // Envia pra IA explicar
    const explainRes = await fetch(`${API_URL}/api/chats/${chatId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        message: searchContext,
        agent: 'strawfield' // Usa o agente padrão pra explicar
      }),
    });
    
    const explainData = await explainRes.json();
    if (!explainData.success) throw new Error(explainData.error);

    // Monta resposta final com explicação + links
    let finalContent = explainData.data || 'Não consegui gerar uma explicação.';
    
    // Adiciona links no final
    finalContent += `\n\n---\n\n**📚 Fontes consultadas:**\n`;
    searchResults.forEach((r, i) => {
      finalContent += `${i + 1}. [${r.title}](${r.url})\n`;
    });

    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: finalContent,
      model: 'Web Search + IA'
    }]);
    
    playSound('receive');
    fetchChats();
  } catch (err) {
    setError(err.message || 'Busca indisponível no momento.');
    playSound('error');
  } finally {
    setLoading(false);
  }
};

  const sendMessage = async (text, customMessages = null, skipAddUser = false) => {
    const currentMessages = customMessages || messages;
    const chatId = activeChatId;
    if (!chatId) return;

    if (!skipAddUser) {
      setMessages(prev => [...prev, { role: 'user', content: text }]);
    }
    setLoading(true);

    try {
      if (streamingEnabled) {
        await handleStream(chatId, text, currentMessages);
      } else {
        await handleNormal(chatId, text, currentMessages);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || t.errorConnection);
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
  if (!input.trim() || loading) return;
  const text = input.trim();
  
  // Detecta agente automático
  const detectedAgent = detectAgent(text);
  if (detectedAgent !== currentAgent) {
    setCurrentAgent(detectedAgent);
    localStorage.setItem('sf_agent', detectedAgent);
  }
  
  setInput(''); 
  setError(null); 
  setShowPrompts(false);

  let chatId = activeChatId;
  if (!chatId) {
    chatId = await createChat(detectedAgent);
    if (!chatId) return;
  }

  playSound('send');
  await sendMessage(text);
};

  const handleStream = async (chatId, text, currentMessages) => {
    const res = await fetch(`${API_URL}/api/chats/${chatId}/message/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Device-Fingerprint': deviceFingerprint,
      },
      body: JSON.stringify({ message: text, agent: currentAgent }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let fullThinking = '';
    let buffer = '';
    let hasAddedMessage = false;
    let currentModel = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.thinking) {
              fullThinking += parsed.thinking;
              setMessages(prev => {
                if (!hasAddedMessage) return prev;
                const newMessages = [...prev];
                const last = newMessages[newMessages.length - 1];
                if (last?.role === 'assistant') {
                  newMessages[newMessages.length - 1] = { ...last, thinking: fullThinking };
                }
                return newMessages;
              });
            }
            
            if (parsed.content) {
              fullText += parsed.content;
              if (!hasAddedMessage) {
                hasAddedMessage = true;
                setMessages(prev => [...prev, { role: 'assistant', content: fullText, thinking: fullThinking || undefined }]);
              } else {
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { 
                    ...newMessages[newMessages.length - 1], 
                    content: fullText,
                    thinking: fullThinking || undefined
                  };
                  return newMessages;
                });
              }
            }
            
            if (parsed.model) {
              currentModel = parsed.model;
              setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
                  newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], model: parsed.model };
                }
                return newMessages;
              });
            }
            
            if (parsed.error) throw new Error(parsed.error);
          } catch (e) {
            // Ignora erros de parse
          }
        }
      }
    }

    if (notifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('StrawField AI', { body: 'Nova resposta recebida!', icon: '/favicon.ico' });
    }
    if (ttsEnabled && fullText) speak(fullText);
    playSound('receive');
    fetchChats();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.ctrlKey && e.key === 'n') { e.preventDefault(); createChat(); }
  };

  const applyPrompt = (prompt) => {
    setInput(prompt);
    setShowPrompts(false);
    inputRef.current?.focus();
  };

  const handleClearHistory = async () => {
    if (!confirm('Apagar TODAS as conversas? Isso não pode ser desfeito.')) return;
    try {
      for (const chat of chats) {
        await fetch(`${API_URL}/api/chats/${chat.id}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
        });
      }
      setChats([]); setActiveChatId(null); setMessages([]);
    } catch { setError(t.errorConnection); }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setInput(prev => prev + (prev ? '\n' : '') + `[Arquivo: ${data.filename}](${API_URL}${data.path})`);
      }
    } catch {
      setError('Erro ao fazer upload do arquivo.');
    }
  };

  if (!token) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`w-full max-w-md rounded-2xl shadow-2xl p-8 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          {authMode === 'welcome' ? (
            <>
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.welcome}</h1>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{t.subtitle}</p>
              </div>
              <div className="space-y-3">
                <button onClick={() => setAuthMode('register')} className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" /> {t.register}
                </button>
                <button onClick={() => setAuthMode('login')} className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <User className="w-5 h-5" /> {t.login}
                </button>
                <button onClick={handleGuest} className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${darkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                  <Ghost className="w-5 h-5" /> {t.guest}
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setAuthMode('welcome')} className={`flex items-center gap-2 mb-6 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                <ArrowLeft className="w-5 h-5" /> {t.back}
              </button>
              <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {authMode === 'register' ? t.register : t.login}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t.username}</label>
                  <input type="text" value={authForm.username} onChange={e => setAuthForm(p => ({ ...p, username: e.target.value }))} className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-pink-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-pink-500'}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t.password}</label>
                  <input type="password" value={authForm.password} onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-pink-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-pink-500'}`} />
                </div>
                {authMode === 'register' && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t.displayName}</label>
                    <input type="text" value={authForm.displayName} onChange={e => setAuthForm(p => ({ ...p, displayName: e.target.value }))} className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-pink-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-pink-500'}`} />
                  </div>
                )}
                {authError && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {authError}</div>}
                <button onClick={() => handleAuth(authMode)} className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity">
                  {authMode === 'register' ? t.createAccount : t.enter}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'agents') {
    return <Agents currentAgent={currentAgent} onSelect={(id) => { setCurrentAgent(id); setCurrentView('chat'); }} darkMode={darkMode} />;
  }

  if (currentView === 'settings') {
    return (
      <Settings
        darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)}
        currentModel={currentModel} onChangeModel={setCurrentModel}
        onClearHistory={handleClearHistory} onBack={() => setCurrentView('chat')}
        currentAgent={currentAgent} onGoToAgents={() => setCurrentView('agents')}
        currentTheme={currentTheme} onChangeTheme={setCurrentTheme}
        notifications={notifications} onToggleNotifications={() => setNotifications(!notifications)}
        currentLang={currentLang} onChangeLang={setCurrentLang}
        ttsEnabled={ttsEnabled} onToggleTts={() => setTtsEnabled(!ttsEnabled)}
        streamingEnabled={streamingEnabled} onToggleStreaming={() => setStreamingEnabled(!streamingEnabled)}
        onExportChat={exportChat}
      />
    );
  }

  return (
    <div 
      className={`flex h-screen w-full overflow-hidden ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} ${dragOver ? 'ring-4 ring-pink-500 ring-inset' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-gray-800 border-2 border-dashed border-pink-500 rounded-2xl p-8 text-center">
            <Search className="w-12 h-12 text-pink-400 mx-auto mb-2" />
            <p className="text-white font-bold text-lg">{t.dropFile}</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:static md:translate-x-0 z-30 w-72 h-full ${darkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-200'} flex flex-col transition-transform duration-300`}>
        <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">StrawField</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded-lg hover:bg-gray-700/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3">
          <button onClick={createChat} className={`w-full py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <Plus className="w-4 h-4" /> {t.newChat}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {chats.length === 0 ? (
            <div className={`text-center py-8 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              {t.noChats}
            </div>
          ) : (
            chats.map(chat => (
              <button key={chat.id} onClick={() => selectChat(chat.id)} className={`w-full text-left p-3 rounded-xl transition-colors group relative ${activeChatId === chat.id ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : 'hover:bg-gray-700/30'}`}>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 opacity-50 flex-shrink-0" />
                  <span className="truncate text-sm font-medium">{chat.title}</span>
                </div>
                <div className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {new Date(chat.updatedAt).toLocaleDateString(currentLang === 'pt' ? 'pt-BR' : currentLang === 'es' ? 'es-ES' : 'en-US')}
                </div>
                <button onClick={(e) => deleteChat(chat.id, e)} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-700/50 space-y-1">
          {user?.username === 'StrawField' && (
            <button onClick={() => setShowAdmin(true)} className={`w-full py-2 px-3 rounded-lg text-sm flex items-center gap-2 transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
              <Shield className="w-4 h-4" /> {t.admin}
            </button>
          )}
          <button onClick={() => setCurrentView('agents')} className={`w-full py-2 px-3 rounded-lg text-sm flex items-center gap-2 transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
            <Sparkles className="w-4 h-4" /> {t.agents}
          </button>
          <button onClick={() => setCurrentView('settings')} className={`w-full py-2 px-3 rounded-lg text-sm flex items-center gap-2 transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
            <SettingsIcon className="w-4 h-4" /> {t.settings}
          </button>
          <button onClick={() => setShowCredits(true)} className={`w-full py-2 px-3 rounded-lg text-sm flex items-center gap-2 transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
            <Heart className="w-4 h-4" /> {t.credits}
          </button>
          <button onClick={handleLogout} className={`w-full py-2 px-3 rounded-lg text-sm flex items-center gap-2 transition-colors text-red-400 ${darkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
            <LogOut className="w-4 h-4" /> {t.logout}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className={`h-14 flex items-center justify-between px-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'} backdrop-blur-sm`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-700/30">
              <Menu className="w-5 h-5" />
            </button>
            <div className={`w-8 h-8 rounded-lg ${theme.bgSoft} flex items-center justify-center`}>
              <Bot className={`w-5 h-5 ${theme.accent}`} />
            </div>
            <div>
              <h1 className="font-semibold text-sm">StrawField AI</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {currentAgent === 'strawfield' ? 'IA Parceira' : currentAgent === 'coder' ? 'CodeMaster' : currentAgent === 'teacher' ? 'Professor' : currentAgent === 'creative' ? 'Criativo' : 'Cientista'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ttsEnabled && (
              <button onClick={stopSpeaking} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`} title="Parar voz">
                <VolumeX className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setShowPrompts(!showPrompts)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`} title="Prompts rápidos">
              <Zap className="w-4 h-4" />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Prompts rápidos */}
        {showPrompts && (
          <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'} flex gap-2 overflow-x-auto`}>
            {PROMPT_TEMPLATES.map(p => {
              const Icon = p.icon;
              return (
                <button key={p.id} onClick={() => applyPrompt(p.prompt)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'}`}>
                  <Icon className="w-3.5 h-3.5" /> {p.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className={`w-24 h-24 rounded-3xl ${theme.bgSoft} flex items-center justify-center mb-6`}>
                <Bot className={`w-12 h-12 ${theme.accent}`} />
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.startChat}</h2>
              <p className={`max-w-md ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Escolha um agente na sidebar ou comece a digitar. A StrawField está pronta para ajudar!
              </p>
              <div className={`mt-4 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                💡 Dica: Use <span className="font-mono bg-gray-700 px-1 rounded">/buscar</span> para pesquisar na web
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} group`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? (darkMode ? 'bg-gray-700' : 'bg-gray-200') : theme.bgSoft}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className={`w-4 h-4 ${theme.accent}`} />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 relative ${msg.role === 'user' ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white') : (darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200')}`}>
                  {/* Badge do modelo */}
                  {msg.model && (
                    <div className={`text-[10px] mb-1 opacity-60 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {t.modelLabel}: {msg.model}
                    </div>
                  )}
                  
                  {/* Thinking box */}
                  {msg.thinking && (
                    <div className={`mb-2 rounded-lg p-2 text-xs ${darkMode ? 'bg-gray-900/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                      <details>
                        <summary className={`cursor-pointer font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.thinkingLabel}</summary>
                        <div className={`mt-1 whitespace-pre-wrap ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{msg.thinking}</div>
                      </details>
                    </div>
                  )}
                  
                  {/* Content - SAFE RENDER */}
                  {editingIndex === i ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        className={`w-full p-2 rounded-lg text-sm ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                        rows={3}
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelEdit} className="px-2 py-1 rounded text-xs bg-gray-600 text-white">Cancelar</button>
                        <button onClick={saveEdit} className="px-2 py-1 rounded text-xs bg-pink-500 text-white">Salvar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed">
                      {typeof msg.content === 'string' ? (
                        <MarkdownRenderer content={msg.content} darkMode={darkMode} />
                      ) : (
                        <span className="text-red-400">[Erro: conteúdo inválido]</span>
                      )}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className={`flex items-center gap-1 mt-2 ${msg.role === 'user' ? 'justify-start' : 'justify-end'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {msg.role === 'user' && editingIndex !== i && (
                      <button onClick={() => startEdit(i)} className={`p-1 rounded ${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`} title={t.edit}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {msg.role === 'assistant' && (
                      <>
                        <button onClick={() => speak(toSafeString(msg.content))} className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`} title="TTS">
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => regenerate(i)} className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`} title={t.regenerate}>
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className={`w-8 h-8 rounded-xl ${theme.bgSoft} flex items-center justify-center`}>
                <Bot className={`w-4 h-4 ${theme.accent} animate-bounce`} />
              </div>
              <div className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                  {t.thinking}
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" /> {error}
                <button onClick={() => setError(null)} className="underline ml-1">{t.retry}</button>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'} backdrop-blur-sm`}>
          <div className={`flex items-end gap-2 max-w-4xl mx-auto rounded-2xl border-2 p-2 ${darkMode ? 'bg-gray-800 border-gray-600 focus-within:border-pink-500' : 'bg-white border-gray-200 focus-within:border-pink-500'} transition-colors`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.typeMessage}
              rows={1}
              className={`flex-1 resize-none bg-transparent px-3 py-2 text-sm focus:outline-none max-h-32 ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
              style={{ minHeight: '40px' }}
            />
            <div className="flex items-center gap-1">
              <button
                onClick={searchWeb}
                disabled={!input.trim() || loading}
                className={`p-2 rounded-lg transition-colors ${input.trim() && !loading ? 'text-blue-400 hover:bg-blue-500/10' : 'text-gray-400 cursor-not-allowed'}`}
                title={t.searchWeb}
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className={`p-2.5 rounded-xl transition-all ${input.trim() && !loading ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className={`text-center text-xs mt-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            Pressione Ctrl+Enter para enviar · Ctrl+N para novo chat · Arraste arquivos para upload
          </div>
        </div>
      </div>

      {/* Modais */}
      <Credits isOpen={showCredits} onClose={() => setShowCredits(false)} darkMode={darkMode} />
      <AdminPanel isOpen={showAdmin} onClose={() => setShowAdmin(false)} darkMode={darkMode} token={token} apiUrl={API_URL} deviceFingerprint={deviceFingerprint} />
    </div>
  );
}