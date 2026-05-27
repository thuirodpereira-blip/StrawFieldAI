import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Trash2, Moon, Sun, Bot, User, AlertCircle, Plus,
  MessageSquare, History, LogOut, LogIn, UserPlus, Ghost,
  ChevronLeft, Sparkles, X, Menu, Settings as SettingsIcon, Heart,
  Volume2, VolumeX, Paperclip, Shield, Ban, FileText, Image as ImageIcon
} from 'lucide-react';
import Agents from './Agents';
import Settings from './Settings';
import Credits from './Credits';

// ===== FINGERPRINT DO DISPOSITIVO =====
function getFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('StrawField FP v1', 2, 2);
  const canvasData = canvas.toDataURL();

  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    canvasData.slice(-50)
  ].join('::');

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'fp_' + Math.abs(hash).toString(16);
}

const DEVICE_FP = getFingerprint();

// ===== TRADUÇÕES =====
const TRANSLATIONS = {
  pt: {
    title: 'StrawField', subtitle: 'Sua IA com personalidade',
    login: 'Entrar', register: 'Criar Conta', username: 'Username', password: 'Senha',
    displayName: 'Nome de exibição', guest: 'Usar como Convidado',
    noAccount: 'Não tem conta?', hasAccount: 'Já tem conta?', createAccount: 'Criar conta',
    newChat: 'Nova Conversa', history: 'Histórico', noChats: 'Nenhuma conversa ainda',
    startConversation: 'Comece uma conversa', placeholder: 'Mensagem StrawField...',
    disclaimer: 'StrawField pode errar. Verifique fatos importantes.',
    agent: 'Agente', settings: 'Configurações', credits: 'Créditos',
    lightMode: 'Modo Claro', darkMode: 'Modo Escuro', logout: 'Sair',
    deleteConfirm: 'Deletar esta conversa?', clearConfirm: 'Isso vai apagar TODAS as conversas. Continuar?',
    connectionError: 'Erro de conexão.', invalidResponse: 'Resposta inválida.',
    createChatError: 'Não foi possível criar conversa.', createChatError2: 'Erro ao criar conversa.',
    aiError: 'Erro na IA.', responseError: 'Erro ao obter resposta.',
    admin: 'Admin', banDevice: 'Banir Dispositivo', unbanDevice: 'Desbanir',
    bannedDevices: 'Dispositivos Banidos', reason: 'Motivo', noBans: 'Nenhum dispositivo banido',
    uploadFile: 'Anexar arquivo', uploadError: 'Erro no upload.',
    streaming: 'Streaming', fileTooBig: 'Arquivo muito grande (max 10MB)',
  },
  en: {
    title: 'StrawField', subtitle: 'Your AI with personality',
    login: 'Login', register: 'Create Account', username: 'Username', password: 'Password',
    displayName: 'Display Name', guest: 'Use as Guest',
    noAccount: "Don't have an account?", hasAccount: 'Already have an account?', createAccount: 'Create account',
    newChat: 'New Chat', history: 'History', noChats: 'No conversations yet',
    startConversation: 'Start a conversation', placeholder: 'Message StrawField...',
    disclaimer: 'StrawField may make mistakes. Verify important facts.',
    agent: 'Agent', settings: 'Settings', credits: 'Credits',
    lightMode: 'Light Mode', darkMode: 'Dark Mode', logout: 'Logout',
    deleteConfirm: 'Delete this conversation?', clearConfirm: 'This will delete ALL conversations. Continue?',
    connectionError: 'Connection error.', invalidResponse: 'Invalid response.',
    createChatError: 'Could not create conversation.', createChatError2: 'Error creating conversation.',
    aiError: 'AI error.', responseError: 'Error getting response.',
    admin: 'Admin', banDevice: 'Ban Device', unbanDevice: 'Unban',
    bannedDevices: 'Banned Devices', reason: 'Reason', noBans: 'No banned devices',
    uploadFile: 'Attach file', uploadError: 'Upload error.',
    streaming: 'Streaming', fileTooBig: 'File too large (max 10MB)',
  },
  es: {
    title: 'StrawField', subtitle: 'Tu IA con personalidad',
    login: 'Entrar', register: 'Crear Cuenta', username: 'Usuario', password: 'Contraseña',
    displayName: 'Nombre para mostrar', guest: 'Usar como Invitado',
    noAccount: '¿No tienes cuenta?', hasAccount: '¿Ya tienes cuenta?', createAccount: 'Crear cuenta',
    newChat: 'Nueva Conversación', history: 'Historial', noChats: 'Aún no hay conversaciones',
    startConversation: 'Inicia una conversación', placeholder: 'Mensaje StrawField...',
    disclaimer: 'StrawField puede cometer errores. Verifica hechos importantes.',
    agent: 'Agente', settings: 'Configuración', credits: 'Créditos',
    lightMode: 'Modo Claro', darkMode: 'Modo Oscuro', logout: 'Salir',
    deleteConfirm: '¿Eliminar esta conversación?', clearConfirm: 'Esto eliminará TODAS las conversaciones. ¿Continuar?',
    connectionError: 'Error de conexión.', invalidResponse: 'Respuesta inválida.',
    createChatError: 'No se pudo crear la conversación.', createChatError2: 'Error al crear la conversación.',
    aiError: 'Error de IA.', responseError: 'Error al obtener respuesta.',
    admin: 'Admin', banDevice: 'Banear Dispositivo', unbanDevice: 'Desbanear',
    bannedDevices: 'Dispositivos Baneados', reason: 'Razón', noBans: 'Ningún dispositivo baneado',
    uploadFile: 'Adjuntar archivo', uploadError: 'Error de subida.',
    streaming: 'Streaming', fileTooBig: 'Archivo muy grande (max 10MB)',
  }
};

const THEME_COLORS = {
  indigo: { primary: 'indigo', gradient: 'from-indigo-500 to-violet-600', text: 'text-indigo-600', bg: 'bg-indigo-600', ring: 'ring-indigo-500' },
  rose: { primary: 'rose', gradient: 'from-rose-500 to-pink-600', text: 'text-rose-600', bg: 'bg-rose-600', ring: 'ring-rose-500' },
  emerald: { primary: 'emerald', gradient: 'from-emerald-500 to-teal-600', text: 'text-emerald-600', bg: 'bg-emerald-600', ring: 'ring-emerald-500' },
  amber: { primary: 'amber', gradient: 'from-amber-500 to-orange-600', text: 'text-amber-600', bg: 'bg-amber-600', ring: 'ring-amber-500' },
  cyan: { primary: 'cyan', gradient: 'from-cyan-500 to-blue-600', text: 'text-cyan-600', bg: 'bg-cyan-600', ring: 'ring-cyan-500' },
};

const API_URL = 'https://strawfieldapi.onrender.com';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('sf_token') || null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('chat');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('sf_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingText, setStreamingText] = useState('');

  const [currentView, setCurrentView] = useState('chat');
  const [currentAgent, setCurrentAgent] = useState('strawfield');
  const [currentModel, setCurrentModel] = useState('groq');
  const [showCredits, setShowCredits] = useState(false);

  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('sf_theme_color') || 'indigo');
  const [currentLang, setCurrentLang] = useState(localStorage.getItem('sf_lang') || 'pt');
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('sf_notifications');
    return saved ? saved === 'true' : false;
  });
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    const saved = localStorage.getItem('sf_tts');
    return saved ? saved === 'true' : false;
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [useStreaming, setUseStreaming] = useState(() => {
    const saved = localStorage.getItem('sf_streaming');
    return saved ? saved === 'true' : true;
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [bans, setBans] = useState({});
  const [uploadedFile, setUploadedFile] = useState(null);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.pt;
  const theme = THEME_COLORS[currentTheme] || THEME_COLORS.indigo;

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

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) { root.classList.add('dark'); localStorage.setItem('sf_theme', 'dark'); }
    else { root.classList.remove('dark'); localStorage.setItem('sf_theme', 'light'); }
  }, [darkMode]);

  useEffect(() => { localStorage.setItem('sf_theme_color', currentTheme); }, [currentTheme]);
  useEffect(() => { localStorage.setItem('sf_lang', currentLang); }, [currentLang]);
  useEffect(() => { localStorage.setItem('sf_notifications', notifications.toString()); }, [notifications]);
  useEffect(() => { localStorage.setItem('sf_tts', ttsEnabled.toString()); }, [ttsEnabled]);
  useEffect(() => { localStorage.setItem('sf_streaming', useStreaming.toString()); }, [useStreaming]);

  useEffect(() => {
    if (notifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [notifications]);

  useEffect(() => {
    if (!token) { setUser(null); setIsAdmin(false); return; }
    fetch(`${API_URL}/api/auth/me`, { 
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Device-Fingerprint': DEVICE_FP
      } 
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
          setIsAdmin(data.user.isAdmin);
        } else {
          localStorage.removeItem('sf_token');
          setToken(null);
          setUser(null);
          setIsAdmin(false);
        }
      })
      .catch(() => {
        localStorage.removeItem('sf_token');
        setToken(null);
        setUser(null);
        setIsAdmin(false);
      });
  }, [token]);

  const loadChats = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_URL}/api/chats`, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Device-Fingerprint': DEVICE_FP
        } 
      });
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

  useEffect(() => {
    if (!activeChatId || !token) { setMessages([]); return; }
    fetch(`${API_URL}/api/chats/${activeChatId}`, { 
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Device-Fingerprint': DEVICE_FP
      } 
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setMessages(data.chat.messages || []);
        else setMessages([]);
      })
      .catch(() => setMessages([]));
  }, [activeChatId, token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, error, streamingText]);

  const speak = useCallback((text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang === 'pt' ? 'pt-BR' : currentLang === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled, currentLang]);

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const sendNotification = useCallback((title, body) => {
    if (notifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, [notifications]);

  const createChat = async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_URL}/api/chats`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}`,
          'X-Device-Fingerprint': DEVICE_FP
        },
        body: JSON.stringify({ title: t.newChat }),
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

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    if (!token) return;
    if (!confirm(t.deleteConfirm)) return;
    try {
      await fetch(`${API_URL}/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Device-Fingerprint': DEVICE_FP
        },
      });
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (activeChatId === chatId) {
        const remaining = chats.filter(c => c.id !== chatId);
        setActiveChatId(remaining[0]?.id || null);
        setMessages([]);
      }
    } catch (err) { console.error(err); }
  };

  const handleClearHistory = async () => {
    if (!token) return;
    if (!confirm(t.clearConfirm)) return;
    try {
      for (const chat of chats) {
        await fetch(`${API_URL}/api/chats/${chat.id}`, {
          method: 'DELETE',
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Device-Fingerprint': DEVICE_FP
          },
        });
      }
      setChats([]);
      setActiveChatId(null);
      setMessages([]);
    } catch (err) { console.error(err); }
  };

  const handleExportChat = () => {
    if (!messages.length) return;
    const chat = chats.find(c => c.id === activeChatId);
    const title = chat?.title || 'StrawField Chat';
    const date = new Date().toLocaleDateString();
    let content = `=== ${title} ===\nData: ${date}\nAgente: ${currentAgent}\n\n`;
    messages.forEach((msg) => {
      const role = msg.role === 'user' ? 'Você' : 'StrawField';
      content += `[${role}]\n${msg.content}\n\n`;
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_${date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ===== UPLOAD DE ARQUIVO =====
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert(t.fileTooBig);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const r = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Device-Fingerprint': DEVICE_FP
        },
        body: formData,
      });
      const data = await r.json();
      if (data.success) {
        setUploadedFile(data.file);
        // Adiciona mensagem com o arquivo
        const isImage = data.file.type.startsWith('image/');
        const fileMsg = isImage 
          ? `[Imagem: ${data.file.name}]\n${data.file.url}`
          : `[Arquivo: ${data.file.name}]`;
        setInput(prev => prev ? prev + '\n' + fileMsg : fileMsg);
      } else {
        alert(t.uploadError);
      }
    } catch (err) {
      alert(t.uploadError);
    }
    e.target.value = '';
  };

  // ===== STREAMING =====
  const handleSendStream = async (currentChatId, userMessage) => {
    setStreamingText('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chats/${currentChatId}/message/stream`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}`,
          'X-Device-Fingerprint': DEVICE_FP
        },
        body: JSON.stringify({ message: userMessage, agent: currentAgent }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                fullText += data.chunk;
                setStreamingText(fullText);
              }
              if (data.done) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.data }]);
                setStreamingText('');
                speak(data.data);
                sendNotification('StrawField respondeu!', data.data.slice(0, 100) + '...');
              }
              if (data.error) {
                setError(data.error);
              }
            } catch (e) {}
          }
        }
      }

      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, title: c.title === t.newChat ? userMessage.slice(0, 40) + (userMessage.length > 40 ? '...' : '') : c.title } : c));
      loadChats();
    } catch (err) {
      console.error(err);
      setError(err.message || t.responseError);
    } finally {
      setLoading(false);
      setStreamingText('');
    }
  };

  // ===== MENSAGEM NORMAL =====
  const handleSendNormal = async (currentChatId, userMessage) => {
    try {
      const r = await fetch(`${API_URL}/api/chats/${currentChatId}/message`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}`,
          'X-Device-Fingerprint': DEVICE_FP
        },
        body: JSON.stringify({ message: userMessage, agent: currentAgent }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) throw new Error(data.error || t.aiError);
      if (!data.data || typeof data.data !== 'string') throw new Error(t.invalidResponse);

      setMessages(prev => [...prev, { role: 'assistant', content: data.data }]);
      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, title: c.title === t.newChat ? userMessage.slice(0, 40) + (userMessage.length > 40 ? '...' : '') : c.title } : c));
      loadChats();
      speak(data.data);
      sendNotification('StrawField respondeu!', data.data.slice(0, 100) + '...');
    } catch (err) {
      console.error(err);
      setError(err.message || t.responseError);
    } finally {
      setLoading(false);
    }
  };

  // ===== ENVIAR MENSAGEM (ESCOLHE STREAM OU NORMAL) =====
  const handleSend = async () => {
    if (!input.trim() || loading || !token) return;

    let currentChatId = activeChatId;
    if (!currentChatId) {
      try {
        const r = await fetch(`${API_URL}/api/chats`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            Authorization: `Bearer ${token}`,
            'X-Device-Fingerprint': DEVICE_FP
          },
          body: JSON.stringify({ title: t.newChat }),
        });
        const data = await r.json();
        if (data.success) {
          currentChatId = data.chat.id;
          setChats(prev => [data.chat, ...prev]);
          setActiveChatId(currentChatId);
          setMessages([]);
        } else {
          setError(t.createChatError);
          return;
        }
      } catch (e) {
        setError(t.createChatError2);
        return;
      }
    }

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setUploadedFile(null);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    if (useStreaming) {
      await handleSendStream(currentChatId, userMessage);
    } else {
      await handleSendNormal(currentChatId, userMessage);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ===== ADMIN: CARREGAR BANS =====
  const loadBans = async () => {
    if (!isAdmin) return;
    try {
      const r = await fetch(`${API_URL}/api/admin/bans`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Device-Fingerprint': DEVICE_FP
        }
      });
      const data = await r.json();
      if (data.success) setBans(data.bans);
    } catch (err) { console.error(err); }
  };

  // ===== ADMIN: BANIR =====
  const handleBan = async (fingerprint, reason = '') => {
    try {
      const r = await fetch(`${API_URL}/api/admin/ban`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Device-Fingerprint': DEVICE_FP
        },
        body: JSON.stringify({ fingerprint, reason }),
      });
      const data = await r.json();
      if (data.success) loadBans();
      alert(data.message || data.error);
    } catch (err) { alert('Erro ao banir.'); }
  };

  // ===== ADMIN: DESBANIR =====
  const handleUnban = async (fingerprint) => {
    try {
      const r = await fetch(`${API_URL}/api/admin/unban`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Device-Fingerprint': DEVICE_FP
        },
        body: JSON.stringify({ fingerprint }),
      });
      const data = await r.json();
      if (data.success) loadBans();
      alert(data.message || data.error);
    } catch (err) { alert('Erro ao desbanir.'); }
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
    } catch (err) { alert(t.connectionError); }
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
    } catch (err) { alert(t.connectionError); }
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
    } catch (err) { alert(t.connectionError); }
  };

  const handleLogout = () => {
    localStorage.removeItem('sf_token');
    setToken(null);
    setUser(null);
    setChats([]);
    setActiveChatId(null);
    setMessages([]);
    setView('login');
    setCurrentView('chat');
    setIsAdmin(false);
    stopSpeaking();
  };

  // ===== RENDER: LOGIN / REGISTER =====
  if (!token || view === 'login' || view === 'register') {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${darkMode ? 'from-slate-950 to-slate-900' : 'from-slate-50 to-slate-200'} p-4 transition-colors duration-300`}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${theme.gradient} shadow-lg mb-4`}>
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t.title}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{t.subtitle}</p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8">
            {view === 'login' ? (
              <>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">{t.login}</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t.username}</label>
                    <input name="username" required className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="seu_username" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t.password}</label>
                    <input name="password" type="password" required className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="••••••" />
                  </div>
                  <button type="submit" className={`w-full py-3 bg-gradient-to-br ${theme.gradient} hover:opacity-90 text-white rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2`}>
                    <LogIn className="w-4 h-4" /> {t.login}
                  </button>
                </form>
                <div className="mt-6 space-y-3">
                  <button onClick={handleGuest} className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                    <Ghost className="w-4 h-4" /> {t.guest}
                  </button>
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                    {t.noAccount}{' '}
                    <button onClick={() => setView('register')} className={`${theme.text} font-medium hover:underline`}>{t.createAccount}</button>
                  </p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">{t.register}</h2>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t.username}</label>
                    <input name="username" required className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="ex: joao_silva" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t.displayName}</label>
                    <input name="displayName" className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="ex: João" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t.password}</label>
                    <input name="password" type="password" required minLength={4} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="••••••" />
                  </div>
                  <button type="submit" className={`w-full py-3 bg-gradient-to-br ${theme.gradient} hover:opacity-90 text-white rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2`}>
                    <UserPlus className="w-4 h-4" /> {t.register}
                  </button>
                </form>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                  {t.hasAccount}{' '}
                  <button onClick={() => setView('login')} className={`${theme.text} font-medium hover:underline`}>{t.login}</button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== RENDER: ADMIN PANEL =====
  if (showAdmin && isAdmin) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'} p-6`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => { setShowAdmin(false); setCurrentView('chat'); }} className={`p-2 ${darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'} rounded-xl transition-all`}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-500" />
              Painel Admin
            </h1>
          </div>

          <div className={`p-6 rounded-xl mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-400" />
              {t.bannedDevices}
            </h2>

            <div className="mb-4 flex gap-2">
              <input 
                id="ban-fp" 
                placeholder="Fingerprint do dispositivo" 
                className={`flex-1 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'} outline-none`}
              />
              <input 
                id="ban-reason" 
                placeholder={t.reason} 
                className={`flex-1 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'} outline-none`}
              />
              <button 
                onClick={() => {
                  const fp = document.getElementById('ban-fp').value;
                  const reason = document.getElementById('ban-reason').value;
                  if (fp) handleBan(fp, reason);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {t.banDevice}
              </button>
            </div>

            <button onClick={loadBans} className={`mb-4 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}>
              Atualizar lista
            </button>

            {Object.keys(bans).length === 0 ? (
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.noBans}</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(bans).map(([fp, info]) => (
                  <div key={fp} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div>
                      <p className="font-mono text-sm">{fp}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t.reason}: {info.reason || 'N/A'} | {new Date(info.bannedAt).toLocaleString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleUnban(fp)}
                      className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      {t.unbanDevice}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
            <h2 className="text-xl font-bold mb-4">Seu Fingerprint</h2>
            <p className="font-mono text-sm break-all p-3 rounded-lg bg-black/10">{DEVICE_FP}</p>
            <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Use este fingerprint para banir seu próprio dispositivo (teste) ou peça o fingerprint do usuário problemático.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===== RENDER: VIEWS =====
  if (currentView === 'agents') {
    return (
      <div className={`h-screen ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className={`flex items-center gap-3 px-4 py-3 ${darkMode ? 'bg-slate-900/80' : 'bg-white/80'} backdrop-blur-md border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <button onClick={() => setCurrentView('chat')} className={`p-2 ${darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'} rounded-xl transition-all`}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Voltar ao Chat</h1>
        </div>
        <Agents currentAgent={currentAgent} onSelect={(id) => { setCurrentAgent(id); setCurrentView('chat'); }} darkMode={darkMode} />
      </div>
    );
  }

  if (currentView === 'settings') {
    return (
      <div className={`h-screen ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <Settings
          darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)}
          currentModel={currentModel} onChangeModel={setCurrentModel}
          onClearHistory={handleClearHistory} onExportChat={handleExportChat}
          onBack={() => setCurrentView('chat')}
          currentAgent={currentAgent} onGoToAgents={() => setCurrentView('agents')}
          currentTheme={currentTheme} onChangeTheme={setCurrentTheme}
          notifications={notifications} onToggleNotifications={() => setNotifications(!notifications)}
          currentLang={currentLang} onChangeLang={setCurrentLang}
          useStreaming={useStreaming} onToggleStreaming={() => setUseStreaming(!useStreaming)}
        />
      </div>
    );
  }

  // ===== RENDER: CHAT =====
  return (
    <div className={`flex h-screen ${darkMode ? 'bg-slate-950' : 'bg-slate-50'} transition-colors duration-300 overflow-hidden`}>
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} ${isMobile ? 'absolute z-50 h-full' : 'relative'} ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-r flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className={`p-4 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'} flex items-center gap-3`}>
          <div className={`p-2 bg-gradient-to-br ${theme.gradient} rounded-xl shadow-sm`}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-800'} truncate`}>{t.title}</h2>
            {user && <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} truncate`}>{user.displayName || user.username}</p>}
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className={`p-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-400'} rounded-lg`}>
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-3">
          <button onClick={createChat} className={`w-full py-2.5 px-4 bg-gradient-to-br ${theme.gradient} hover:opacity-90 text-white rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 text-sm`}>
            <Plus className="w-4 h-4" /> {t.newChat}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          <p className={`text-xs font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-wider px-2 mb-2`}>{t.history}</p>
          {chats.length === 0 && (
            <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'} text-center py-4`}>{t.noChats}</p>
          )}
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => { setActiveChatId(chat.id); if (isMobile) setSidebarOpen(false); }}
              className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${
                activeChatId === chat.id
                  ? `${darkMode ? 'bg-indigo-900/30 border-indigo-800' : 'bg-indigo-50 border-indigo-200'} border`
                  : `${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} border border-transparent`
              }`}
            >
              <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeChatId === chat.id ? `${theme.text} dark:text-indigo-400` : `${darkMode ? 'text-slate-500' : 'text-slate-400'}`}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${activeChatId === chat.id ? `${theme.text} dark:text-indigo-300` : `${darkMode ? 'text-slate-300' : 'text-slate-700'}`}`}>
                  {chat.title}
                </p>
                <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'} truncate`}>
                  {new Date(chat.updatedAt).toLocaleDateString(currentLang === 'pt' ? 'pt-BR' : currentLang === 'es' ? 'es-ES' : 'en-US')}
                </p>
              </div>
              <button
                onClick={(e) => deleteChat(chat.id, e)}
                className={`opacity-0 group-hover:opacity-100 p-1.5 ${darkMode ? 'text-slate-400 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'} rounded-lg transition-all`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className={`p-3 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'} space-y-2`}>
          {isAdmin && (
            <button
              onClick={() => { setShowAdmin(true); loadBans(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all`}
            >
              <Shield className="w-4 h-4" />
              {t.admin}
            </button>
          )}
          <button
            onClick={() => setCurrentView('agents')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm ${darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'} rounded-xl transition-all`}
          >
            <Bot className="w-4 h-4" />
            {t.agent}: <span className="font-medium text-pink-400 capitalize">{currentAgent}</span>
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm ${darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'} rounded-xl transition-all`}
          >
            <SettingsIcon className="w-4 h-4" />
            {t.settings}
          </button>
          <button
            onClick={() => setShowCredits(true)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm ${darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'} rounded-xl transition-all`}
          >
            <Heart className="w-4 h-4" />
            {t.credits}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm ${darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'} rounded-xl transition-all`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? t.lightMode : t.darkMode}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 ${darkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'} rounded-xl transition-all`}
          >
            <LogOut className="w-4 h-4" /> {t.logout}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className={`flex-1 flex flex-col min-w-0 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <header className={`flex items-center gap-3 px-4 py-3 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-md border-b z-10`}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className={`p-2 ${darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'} rounded-xl transition-all`}>
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'} truncate`}>
              {chats.find(c => c.id === activeChatId)?.title || t.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {useStreaming && (
              <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'}`}>
                ⚡
              </span>
            )}
            <button
              onClick={() => ttsEnabled ? stopSpeaking() : setTtsEnabled(!ttsEnabled)}
              className={`p-2 rounded-xl transition-all ${ttsEnabled ? `${theme.text} ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}` : `${darkMode ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}`}
            >
              {isSpeaking ? <Volume2 className="w-4 h-4 animate-pulse" /> : ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {user && (
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'} rounded-full text-xs`}>
                <User className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{user.displayName || user.username}</span>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {messages.length === 0 && !streamingText && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${theme.gradient} opacity-20 flex items-center justify-center mb-4`}>
                <Bot className={`w-8 h-8 ${theme.text}`} />
              </div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'} mb-1`}>{t.startConversation}</h3>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'} max-w-sm`}>
                {t.agent}: <span className="font-bold text-pink-400 capitalize">{currentAgent}</span>
                {useStreaming && <span className="ml-2">⚡ {t.streaming}</span>}
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
              <div className={`flex max-w-[90%] sm:max-w-[75%] md:max-w-[65%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === 'user' ? `bg-gradient-to-br ${theme.gradient}` : `${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className={`w-4 h-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />}
                </div>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? `bg-gradient-to-br ${theme.gradient} text-white rounded-br-md`
                    : `${darkMode ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-white text-slate-800 border-slate-200'} rounded-bl-md border`
                }`}>
                  {msg.content}
                  {msg.role === 'assistant' && (
                    <button onClick={() => speak(msg.content)} className={`ml-2 p-1 rounded-lg ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-400'} transition-colors inline-flex`}>
                      <Volume2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* STREAMING */}
          {streamingText && (
            <div className="flex justify-start w-full animate-fade-in-up">
              <div className="flex max-w-[65%] gap-3 flex-row">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} flex items-center justify-center`}>
                  <Bot className={`w-4 h-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
                </div>
                <div className={`px-4 py-3 ${darkMode ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-white text-slate-800 border-slate-200'} border rounded-2xl rounded-bl-md shadow-sm`}>
                  <span>{streamingText}</span>
                  <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />
                </div>
              </div>
            </div>
          )}

          {loading && !streamingText && (
            <div className="flex justify-start w-full animate-fade-in-up">
              <div className="flex max-w-[65%] gap-3 flex-row">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} flex items-center justify-center`}>
                  <Bot className={`w-4 h-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
                </div>
                <div className={`px-4 py-3 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-2xl rounded-bl-md shadow-sm`}>
                  <div className="flex gap-1.5 items-center h-5">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center w-full animate-fade-in-up">
              <div className={`flex items-center gap-2 px-4 py-3 ${darkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'} border rounded-xl text-sm shadow-sm`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* INPUT */}
        <footer className={`p-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-md border-t`}>
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.txt,.js,.jsx,.ts,.tsx,.py,.html,.css,.json,.md"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 ${darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100'} rounded-xl transition-all`}
              title={t.uploadFile}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`${t.placeholder} (${currentAgent})...`}
              rows={1}
              className={`flex-1 resize-none max-h-32 px-4 py-3 ${darkMode ? 'bg-slate-800 text-slate-100 placeholder-slate-400' : 'bg-slate-100 text-slate-900 placeholder-slate-400'} rounded-xl border-0 focus:ring-2 ${theme.ring} outline-none transition-all scrollbar-thin text-sm`}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={`p-3 bg-gradient-to-br ${theme.gradient} hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {uploadedFile && (
            <div className={`max-w-4xl mx-auto mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              {uploadedFile.type.startsWith('image/') ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              <span>{uploadedFile.name}</span>
              <button onClick={() => setUploadedFile(null)} className="ml-auto text-red-400 hover:text-red-500">×</button>
            </div>
          )}
          <p className={`text-center text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'} mt-2`}>
            {t.disclaimer}
          </p>
        </footer>
      </main>

      <Credits isOpen={showCredits} onClose={() => setShowCredits(false)} darkMode={darkMode} />
    </div>
  );
}
