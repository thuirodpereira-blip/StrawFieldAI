import React, { useState, useEffect } from 'react';
import { X, Shield, Ban, Unlock, AlertTriangle, Copy, Check } from 'lucide-react';

export default function AdminPanel({ isOpen, onClose, darkMode, token, apiUrl, deviceFingerprint }) {
  const [bans, setBans] = useState({});
  const [newBan, setNewBan] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) fetchBans();
  }, [isOpen]);

  const fetchBans = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/bans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setBans(data.bans || {});
    } catch {
      setMessage('Erro ao carregar bans.');
    }
  };

  const handleBan = async () => {
    if (!newBan.trim()) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fingerprint: newBan.trim() }),
      });
      const data = await res.json();
      setMessage(data.success ? 'Dispositivo banido!' : data.error);
      if (data.success) { setNewBan(''); fetchBans(); }
    } catch {
      setMessage('Erro ao banir.');
    }
  };

  const handleUnban = async (fp) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/unban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fingerprint: fp }),
      });
      const data = await res.json();
      setMessage(data.success ? 'Dispositivo desbanido!' : data.error);
      if (data.success) fetchBans();
    } catch {
      setMessage('Erro ao desbanir.');
    }
  };

  const copyFingerprint = () => {
    navigator.clipboard.writeText(deviceFingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`relative w-full max-w-lg rounded-2xl p-6 shadow-2xl ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <button onClick={onClose} className={`absolute top-4 right-4 p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1 flex items-center justify-center gap-2">
            <Shield className="w-6 h-6 text-red-500" /> Painel Admin
          </h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gerenciar dispositivos banidos</p>
        </div>

        {/* Seu fingerprint */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <p className="text-sm font-medium mb-2">Seu fingerprint:</p>
          <div className="flex items-center gap-2">
            <code className={`flex-1 p-2 rounded-lg text-xs break-all ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>{deviceFingerprint}</code>
            <button onClick={copyFingerprint} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Banir novo */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <p className="text-sm font-medium mb-2">Banir dispositivo:</p>
          <div className="flex gap-2">
            <input
              value={newBan}
              onChange={e => setNewBan(e.target.value)}
              placeholder="Cole o fingerprint aqui..."
              className={`flex-1 px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-red-500`}
            />
            <button onClick={handleBan} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors flex items-center gap-1">
              <Ban className="w-4 h-4" /> Banir
            </button>
          </div>
        </div>

        {/* Lista de bans */}
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <p className="text-sm font-medium mb-2">Dispositivos banidos ({Object.keys(bans).length}):</p>
          {Object.keys(bans).length === 0 ? (
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Nenhum dispositivo banido.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(bans).map(([fp, info]) => (
                <div key={fp} className={`flex items-center justify-between p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <code className="text-xs truncate max-w-[200px]">{fp}</code>
                  <button onClick={() => handleUnban(fp)} className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                    <Unlock className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.includes('Erro') || message.includes('não pode') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
            <AlertTriangle className="w-4 h-4" /> {message}
          </div>
        )}
      </div>
    </div>
  );
}