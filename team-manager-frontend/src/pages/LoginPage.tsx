import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#1DB954] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">TM</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Team Manager</h1>
          <p className="text-[#b3b3b3] mt-2">Gestion d'équipe et paiements</p>
        </div>

        <div className="bg-[#181818] rounded-2xl p-8 shadow-xl border border-[#282828]">
          <h2 className="text-xl font-bold text-white mb-6">
            {isRegister ? 'Créer un compte' : 'Connexion'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1">Nom complet</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#282828] border border-[#383838] rounded-lg px-4 py-3 text-white placeholder-[#666] focus:outline-none focus:border-[#1DB954] transition-colors"
                  placeholder="Votre nom"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#282828] border border-[#383838] rounded-lg px-4 py-3 text-white placeholder-[#666] focus:outline-none focus:border-[#1DB954] transition-colors"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#282828] border border-[#383838] rounded-lg px-4 py-3 text-white placeholder-[#666] focus:outline-none focus:border-[#1DB954] transition-colors"
                placeholder="••••••••"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1">Rôle</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#282828] border border-[#383838] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#1DB954] transition-colors"
                >
                  <option value="admin">Administrateur</option>
                  <option value="viewer">Lecteur</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white font-bold py-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Chargement...' : isRegister ? "S'inscrire" : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-[#1DB954] hover:underline text-sm"
            >
              {isRegister ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
