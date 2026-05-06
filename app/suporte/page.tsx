'use client';

import { useState } from 'react';

export default function SuportePage() {
  const [key, setKey] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(
        'https://edusaas-api-tbig.onrender.com/support/access',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            masterKey: key,
            schoolId: Number(schoolId),
            supportEmail: email,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md p-6 space-y-4">
        <div className="text-center">
          <h1 className="text-white font-bold text-lg">Painel de Suporte</h1>
          <p className="text-gray-400 text-xs mt-1">Acesso restrito — Walladm</p>
        </div>
        <input type="password" placeholder="Chave master" value={key}
          onChange={e => setKey(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <input type="number" placeholder="ID da escola (ex: 1)" value={schoolId}
          onChange={e => setSchoolId(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <input type="email" placeholder="Seu e-mail de suporte" value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button onClick={handleSubmit} disabled={loading || !key || !schoolId || !email}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm disabled:opacity-50 transition-colors">
          {loading ? 'Criando acesso...' : 'Criar acesso temporário'}
        </button>
        {error && (
          <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
        )}
        {result && (
          <div className="bg-green-950 border border-green-800 rounded-xl px-4 py-4 space-y-2">
            <p className="text-green-400 font-semibold text-sm">✅ Acesso criado!</p>
            <div className="bg-gray-900 rounded-lg p-3 space-y-1">
              <p className="text-xs text-gray-400">E-mail</p>
              <p className="text-white text-sm font-mono">{result.email}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 space-y-1">
              <p className="text-xs text-gray-400">Senha temporária</p>
              <p className="text-white text-lg font-mono font-bold tracking-wider">{result.password}</p>
            </div>
            <p className="text-yellow-500 text-xs">⚠️ {result.expiresIn}</p>
          </div>
        )}
      </div>
    </div>
  );
}
