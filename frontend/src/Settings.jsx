import React from 'react';
import { Moon, Sun, Trash2, Globe, Cpu, ArrowLeft } from 'lucide-react';

export default function Settings({ 
  darkMode, 
  onToggleTheme, 
  currentModel, 
  onChangeModel, 
  onClearHistory, 
  onBack,
  currentAgent,
  onGoToAgents
}) {
  const models = [
    { id: 'groq', name: 'Groq (Llama 3.1)', desc: 'Rápido e eficiente' },
    { id: 'gemini', name: 'Gemini Flash', desc: 'Google AI' },
    { id: 'openai', name: 'OpenAI GPT', desc: 'GPT-4o Mini' },
    { id: 'ollama', name: 'Ollama (Local)', desc: 'Rodando localmente' },
  ];

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-lg transition-colors ${
            darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Cpu className="w-8 h-8 text-blue-400" />
          Configurações
        </h1>

        {/* TEMA */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
              <div>
                <h3 className="font-semibold">Tema</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {darkMode ? 'Modo Escuro' : 'Modo Claro'}
                </p>
              </div>
            </div>
            <button
              onClick={onToggleTheme}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                darkMode ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* MODELO DE IA */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-semibold">Modelo de IA</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Provedor preferido para respostas
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => onChangeModel(model.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                  currentModel === model.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : darkMode
                    ? 'border-gray-700 hover:border-gray-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium">{model.name}</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{model.desc}</div>
                </div>
                {currentModel === model.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* AGENTE ATUAL */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <h3 className="font-semibold mb-2">Agente Atual</h3>
          <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Personalidade selecionada: <span className="font-bold text-pink-400 capitalize">{currentAgent}</span>
          </p>
          <button
            onClick={onGoToAgents}
            className="px-4 py-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/30 hover:bg-pink-500/20 transition-colors"
          >
            Trocar Agente
          </button>
        </div>

        {/* LIMPAR HISTÓRICO */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-400" />
              <div>
                <h3 className="font-semibold text-red-400">Limpar Histórico</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Apaga todas as conversas (irreversível)
                </p>
              </div>
            </div>
            <button
              onClick={onClearHistory}
              className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}