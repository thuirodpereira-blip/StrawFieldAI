import React from 'react';
import { Moon, Sun, Trash2, Globe, Cpu, ArrowLeft, Download, Bell, BellOff, Palette, Volume2, VolumeX, Zap, Keyboard } from 'lucide-react';

const THEMES = [
  { id: 'indigo', name: 'Índigo', color: 'bg-indigo-500', text: 'text-indigo-400' },
  { id: 'rose', name: 'Rosa', color: 'bg-rose-500', text: 'text-rose-400' },
  { id: 'emerald', name: 'Esmeralda', color: 'bg-emerald-500', text: 'text-emerald-400' },
  { id: 'amber', name: 'Âmbar', color: 'bg-amber-500', text: 'text-amber-400' },
  { id: 'cyan', name: 'Ciano', color: 'bg-cyan-500', text: 'text-cyan-400' },
];

const LANGUAGES = [
  { id: 'pt', name: 'Português', flag: '🇧🇷' },
  { id: 'en', name: 'English', flag: '🇺🇸' },
  { id: 'es', name: 'Español', flag: '🇪🇸' },
];

const MODELS = [
  { id: 'deepseek', name: 'DeepSeek V3', desc: 'Mais inteligente para código' },
  { id: 'openrouter', name: 'OpenRouter', desc: 'Qwen Coder, vários modelos' },
  { id: 'groq', name: 'Groq', desc: 'Mais rápido' },
  { id: 'gemini', name: 'Gemini', desc: 'Google AI' },
];

export default function Settings({
  darkMode, onToggleTheme,
  currentModel, onChangeModel,
  onClearHistory, onBack,
  currentAgent, onGoToAgents,
  currentTheme, onChangeTheme,
  notifications, onToggleNotifications,
  currentLang, onChangeLang,
  ttsEnabled, onToggleTts,
  streamingEnabled, onToggleStreaming,
  onExportChat,
}) {
  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
          <ArrowLeft className="w-5 h-5" /> Voltar
        </button>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Cpu className="w-8 h-8 text-blue-400" /> Configurações
        </h1>

        {/* TEMA */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-semibold">Tema</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{darkMode ? 'Modo Escuro' : 'Modo Claro'}</p>
              </div>
            </div>
            <button onClick={onToggleTheme} className={`relative w-14 h-8 rounded-full transition-colors ${darkMode ? 'bg-purple-600' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => onChangeTheme(t.id)} className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${currentTheme === t.id ? 'border-pink-500' : 'border-transparent'} ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <div className={`w-6 h-6 rounded-full ${t.color}`} />
                <span className="text-xs">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* IDIOMA */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-green-400" />
            <div>
              <h3 className="font-semibold">Idioma</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Interface do aplicativo</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map(l => (
              <button key={l.id} onClick={() => onChangeLang(l.id)} className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${currentLang === l.id ? 'border-blue-500 bg-blue-500/10' : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}`}>
                <span className="text-lg">{l.flag}</span>
                <span className="text-sm font-medium">{l.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* MODELO DE IA */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-semibold">Modelo de IA</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Provedor preferido</p>
            </div>
          </div>
          <div className="space-y-2">
            {MODELS.map(m => (
              <button key={m.id} onClick={() => onChangeModel(m.id)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${currentModel === m.id ? 'border-blue-500 bg-blue-500/10' : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="text-left">
                  <div className="font-medium">{m.name}</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{m.desc}</div>
                </div>
                {currentModel === m.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* AGENTE */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <h3 className="font-semibold mb-2">Agente Atual</h3>
          <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Personalidade: <span className="font-bold text-pink-400 capitalize">{currentAgent}</span>
          </p>
          <button onClick={onGoToAgents} className="px-4 py-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/30 hover:bg-pink-500/20 transition-colors">
            Trocar Agente
          </button>
        </div>

        {/* STREAMING */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className={`w-5 h-5 ${streamingEnabled ? 'text-yellow-400' : 'text-gray-400'}`} />
              <div>
                <h3 className="font-semibold">Streaming</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{streamingEnabled ? 'Resposta em tempo real' : 'Resposta completa'}</p>
              </div>
            </div>
            <button onClick={onToggleStreaming} className={`relative w-14 h-8 rounded-full transition-colors ${streamingEnabled ? 'bg-yellow-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${streamingEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* TTS */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {ttsEnabled ? <Volume2 className="w-5 h-5 text-green-400" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
              <div>
                <h3 className="font-semibold">Voz (TTS)</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{ttsEnabled ? 'Ativado' : 'Desativado'}</p>
              </div>
            </div>
            <button onClick={onToggleTts} className={`relative w-14 h-8 rounded-full transition-colors ${ttsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${ttsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* NOTIFICAÇÕES */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {notifications ? <Bell className="w-5 h-5 text-yellow-400" /> : <BellOff className="w-5 h-5 text-gray-400" />}
              <div>
                <h3 className="font-semibold">Notificações</h3>
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
                <h3 className="font-semibold">Exportar Conversa</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Baixar chat como TXT</p>
              </div>
            </div>
            <button onClick={onExportChat} className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors">
              Exportar
            </button>
          </div>
        </div>

        {/* LIMPAR HISTÓRICO */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-400" />
              <div>
                <h3 className="font-semibold text-red-400">Limpar Histórico</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Apaga todas as conversas (irreversível)</p>
              </div>
            </div>
            <button onClick={onClearHistory} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors">
              Limpar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}