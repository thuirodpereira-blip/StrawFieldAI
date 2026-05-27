import React from 'react';
import { Bot, Code, BookOpen, Sparkles, Atom, Check } from 'lucide-react';

const AGENTS_LIST = [
  { id: 'strawfield', name: 'StrawField', desc: 'IA amigável, criativa e com personalidade.', icon: Bot, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
  { id: 'coder', name: 'CodeMaster', desc: 'Especialista em código e tecnologia.', icon: Code, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { id: 'teacher', name: 'Professor', desc: 'Explica didaticamente e com paciência.', icon: BookOpen, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  { id: 'creative', name: 'Criativo', desc: 'Brainstorming e ideias ilimitadas.', icon: Sparkles, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  { id: 'scientist', name: 'Cientista', desc: 'Fatos, dados e raciocínio lógico.', icon: Atom, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
];

export default function Agents({ currentAgent, onSelect, darkMode }) {
  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Bot className="w-8 h-8 text-pink-400" />
          Agentes da StrawField
        </h1>
        <p className={`mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Escolha a personalidade da IA para sua conversa.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENTS_LIST.map((agent) => {
            const Icon = agent.icon;
            const isSelected = currentAgent === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => onSelect(agent.id)}
                className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.02] ${
                  isSelected
                    ? `${agent.border} ${agent.bg} ring-2 ring-offset-2 ${darkMode ? 'ring-offset-gray-900' : 'ring-offset-white'} ring-${agent.color.split('-')[1]}-400`
                    : darkMode
                    ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <Check className={`w-5 h-5 ${agent.color}`} />
                  </div>
                )}
                <Icon className={`w-10 h-10 ${agent.color} mb-3`} />
                <h3 className="text-lg font-bold mb-1">{agent.name}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {agent.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}