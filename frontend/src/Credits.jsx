import React from 'react';
import { X, Heart, ExternalLink, Bot, Sword, Brain } from 'lucide-react';

const TEAM = [
  { name: 'StrawField', role: 'Criador & Desenvolvedor', desc: 'A mente brilhante por trás da StrawField AI. Full-stack dev, visionário.', icon: Bot, color: 'text-pink-400', bg: 'bg-pink-500/10', link: 'https://github.com/thuirodpereira-blip' },
  { name: 'Sokka', role: 'Estrategista & Consultor', desc: 'O mestre da estratégia. Sempre presente com ideias geniais.', icon: Sword, color: 'text-blue-400', bg: 'bg-blue-500/10', link: null },
  { name: 'Kimi', role: 'Assistente IA', desc: 'Eu mesma! Ajudei a debugar, deployar, corrigir CORS e sobreviver ao node_modules.', icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10', link: 'https://kimi.com' },
];

export default function Credits({ isOpen, onClose, darkMode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`relative w-full max-w-lg rounded-2xl p-6 shadow-2xl ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <button onClick={onClose} className={`absolute top-4 right-4 p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1 flex items-center justify-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" /> Créditos
          </h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>A aliança que construiu a StrawField AI</p>
        </div>

        <div className="space-y-4">
          {TEAM.map(member => {
            const Icon = member.icon;
            return (
              <div key={member.name} className={`flex items-start gap-4 p-4 rounded-xl ${member.bg} border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                <div className={`p-2 rounded-lg ${member.bg}`}>
                  <Icon className={`w-6 h-6 ${member.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{member.name}</h3>
                    {member.link && (
                      <a href={member.link} target="_blank" rel="noopener noreferrer" className={`${member.color} hover:opacity-80`}>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <p className={`text-xs font-medium mb-1 ${member.color}`}>{member.role}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{member.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`mt-6 text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Feito com 🍓 e muito café · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}