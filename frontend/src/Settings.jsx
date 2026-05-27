import React from 'react';
import { Moon, Sun, Trash2, Globe, Cpu, ArrowLeft, Download, Bell, BellOff, Palette, Zap } from 'lucide-react';

const THEMES = [
  { id: 'indigo', name: 'Índigo', color: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  { id: 'rose', name: 'Rosa', color: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30' },
  { id: 'emerald', name: 'Esmeralda', color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { id: 'amber', name: 'Âmbar', color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' },
  { id: 'cyan', name: 'Ciano', color: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500/30' },
];

const LANGUAGES = [
  { id: 'pt', name: 'Português', flag: '🇧🇷' },
  { id: 'en', name: 'English', flag: '🇺🇸' },
  { id: 'es', name: 'Español', flag: '🇪🇸' },
];

export default function Settings({ 
  darkMode, onToggleTheme, currentModel, onChangeModel, onClearHistory, onExportChat,
  onBack, currentAgent, onGoToAgents, currentTheme, onChangeTheme,
  notifications, onToggleNotifications, currentLang, onChangeLang, useStreaming, onToggleStreaming
}) {
  const models = [
    { id: 'groq', name: 'Groq (Llama 3.1)', desc: 'Rápido e eficiente' },
    { id: 'gemini', name: 'Gemini Flash', desc: 'Google AI' },
    { id: 'openai', name: 'OpenAI GPT', desc: 'GPT-4o Mini' },
    { id: 'ollama', name: 'Ollama (Local)', desc: 'Rodando localmente' },
  ];

  const t = {
    pt: {
      back: 'Voltar', settings: 'Configurações', theme: 'Tema', dark: 'Modo Escuro', light: 'Modo Claro',
      language: 'Idioma', interfaceLang: 'Interface do aplicativo',
      model: 'Modelo de IA', preferredProvider: 'Provedor preferido para respostas',
      currentAgent: 'Agente Atual', selectedPersonality: 'Personalidade selecionada', changeAgent: 'Trocar Agente',
      notifications: 'Notificações', streaming: 'Streaming', streamingDesc: 'Respostas em tempo real (Groq)',
      exportChat: 'Exportar Conversa', downloadTxt: 'Baixar chat atual como arquivo TXT',
      export: 'Exportar', clearHistory: 'Limpar Histórico', clearDesc: 'Apaga todas as conversas (irreversível)', clear: 'Limpar'
    },
    en: {
      back: 'Back', settings: 'Settings', theme: 'Theme', dark: 'Dark Mode', light: 'Light Mode',
      language: 'Language', interfaceLang: 'Application interface',
      model: 'AI Model', preferredProvider: 'Preferred provider for responses',
      currentAgent: 'Current Agent', selectedPersonality: 'Selected personality', changeAgent: 'Change Agent',
      notifications: 'Notifications', streaming: 'Streaming', streamingDesc: 'Real-time responses (Groq)',
      exportChat: 'Export Conversation', downloadTxt: 'Download current chat as TXT file',
      export: 'Export', clearHistory: 'Clear History', clearDesc: 'Deletes all conversations (irreversible)', clear: 'Clear'
    },
    es: {
      back: 'Volver', settings: 'Configuración', theme: 'Tema', dark: 'Modo Oscuro', light: 'Modo Claro',
      language: 'Idioma', interfaceLang: 'Interfaz de la aplicación',
      model: 'Modelo de IA', preferredProvider: 'Proveedor preferido para respuestas',
      currentAgent: 'Agente Actual', selectedPersonality: 'Personalidad seleccionada', changeAgent: 'Cambiar Agente',
      notifications: 'Notificaciones', streaming: 'Streaming', streamingDesc: 'Respuestas en tiempo real (Groq)',
      exportChat: 'Exportar Conversación', downloadTxt: 'Descargar chat actual como archivo TXT',
      export: 'Exportar', clearHistory: 'Limpiar Historial', clearDesc: 'Elimina todas las conversaciones (irreversible)', clear: 'Limpiar'
    }
  }[currentLang || 'pt'];

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
          <ArrowLeft className="w-5 h-5" /> {t.back}
        </button>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Cpu className="w-8 h-8 text-blue-400" /> {t.settings}
        </h1>

        {/* TEMA */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-semibold">{t.theme}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{darkMode ? t.dark : t.light}</p>
              </div>
            </div>
            <button onClick={onToggleTheme} className={`relative w-14 h-8 rounded-full transition-colors ${darkMode ? 'bg-purple-600' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {THEMES.map((theme) => (
              <button key={theme.id} onClick={() => onChangeTheme(theme.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${currentTheme === theme.id ? theme.border : 'border-transparent'} ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <div className={`w-6 h-6 rounded-full ${theme.color}`} />
                <span className="text-xs">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* IDIOMA */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-green-400" />
            <div>
              <h3 className="font-semibold">{t.language}</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.interfaceLang}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((lang) => (
              <button key={lang.id} onClick={() => onChangeLang(lang.id)}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${currentLang === lang.id ? 'border-blue-500 bg-blue-500/10' : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}`}>
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* MODELO */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-semibold">{t.model}</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.preferredProvider}</p>
            </div>
          </div>
          <div className="space-y-2">
            {models.map((model) => (
              <button key={model.id} onClick={() => onChangeModel(model.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${currentModel === model.id ? 'border-blue-500 bg-blue-500/10' : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="text-left">
                  <div className="font-medium">{model.name}</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{model.desc}</div>
                </div>
                {currentModel === model.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* AGENTE */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <h3 className="font-semibold mb-2">{t.currentAgent}</h3>
          <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t.selectedPersonality}: <span className="font-bold text-pink-400 capitalize">{currentAgent}</span>
          </p>
          <button onClick={onGoToAgents} className="px-4 py-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/30 hover:bg-pink-500/20 transition-colors">
            {t.changeAgent}
          </button>
        </div>

        {/* STREAMING */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              <div>
                <h3 className="font-semibold">{t.streaming}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.streamingDesc}</p>
              </div>
            </div>
            <button onClick={onToggleStreaming} className={`relative w-14 h-8 rounded-full transition-colors ${useStreaming ? 'bg-yellow-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${useStreaming ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* NOTIFICAÇÕES */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {notifications ? <Bell className="w-5 h-5 text-yellow-400" /> : <BellOff className="w-5 h-5 text-gray-400" />}
              <div>
                <h3 className="font-semibold">{t.notifications}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notifications ? 'Ativadas' : 'Desativadas'}</p>
              </div>
            </div>
            <button onClick={onToggleNotifications} className={`relative w-14 h-8 rounded-full transition-colors ${notifications ? 'bg-yellow-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${notifications ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* EXPORTAR */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-green-400" />
              <div>
                <h3 className="font-semibold">{t.exportChat}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.downloadTxt}</p>
              </div>
            </div>
            <button onClick={onExportChat} className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors">
              {t.export}
            </button>
          </div>
        </div>

        {/* LIMPAR */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-400" />
              <div>
                <h3 className="font-semibold text-red-400">{t.clearHistory}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.clearDesc}</p>
              </div>
            </div>
            <button onClick={onClearHistory} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors">
              {t.clear}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}