import { useState, useEffect } from 'react';
import { authAPI, teamManagementAPI } from '../services/api';
import { User, Team } from '../types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateSuperviseur, setShowCreateSuperviseur] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [filter, setFilter] = useState<'all' | 'superviseur' | 'operateur'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, teamsRes] = await Promise.all([
        authAPI.getAllUsers().catch(() => ({ data: [] })),
        teamManagementAPI.getAllTeams().catch(() => ({ data: [] }))
      ]);
      setUsers(usersRes.data || []);
      setTeams(teamsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPending = async () => {
    try {
      const res = await authAPI.getPendingOperateurs().catch(() => ({ data: [] }));
      setPendingUsers(res.data || []);
      setShowPending(true);
    } catch (error) {
      console.error('Error loading pending:', error);
    }
  };

  const handleCreateSuperviseur = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authAPI.createUser(newUser.name, newUser.email, newUser.password, 'superviseur');
      setShowCreateSuperviseur(false);
      setNewUser({ name: '', email: '', password: '' });
      loadData();
      alert('Superviseur créé!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleValidateOperateur = async (userId: string, action: 'approve' | 'reject') => {
    try {
      await authAPI.validateOperateur(userId, action);
      loadData();
      setShowPending(false);
      alert(action === 'approve' ? 'Opérateur approuvé!' : 'Opérateur rejeté!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cet utilisateur?')) return;
    try {
      await authAPI.deleteUser(userId);
      loadData();
      alert('Utilisateur supprimé!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const filteredUsers = users.filter(u => {
    if (filter === 'all') return true;
    if (filter === 'superviseur') return u.role === 'superviseur';
    if (filter === 'operateur') return u.role === 'operateur';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingCount = pendingUsers.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion des Utilisateurs</h1>
          <p className="text-gray-400">Créer et gérer les comptes utilisateurs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadPending}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 relative"
          >
            En attente
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowCreateSuperviseur(true)}
            className="px-4 py-2 bg-[#1DB954] text-white rounded-lg hover:bg-[#1ed760]"
          >
            + Créer Superviseur
          </button>
        </div>
      </div>

      {/* Create Superviseur Form */}
      {showCreateSuperviseur && (
        <div className="bg-[#1E1E1E] p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Nouveau Superviseur</h2>
          <form onSubmit={handleCreateSuperviseur} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nom</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-[#282828] border border-[#383838] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-[#282828] border border-[#383838] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-[#282828] border border-[#383838] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-[#1DB954] text-white rounded-lg">
                Créer
              </button>
              <button 
                type="button" 
                onClick={() => setShowCreateSuperviseur(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending Users Modal */}
      {showPending && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1E1E1E] p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Opérateurs en Attente</h2>
              <button onClick={() => setShowPending(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            
            {pendingUsers.length === 0 ? (
              <p className="text-gray-400">Aucun opérateur en attente</p>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((user: any) => (
                  <div key={user._id} className="p-4 bg-[#2A2A2A] rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{user.name}</div>
                      <div className="text-gray-400 text-sm">{user.email}</div>
                      <div className="text-gray-500 text-xs">
                        Équipe: {user.teamId_data?.name || 'N/A'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleValidateOperateur(user._id, 'approve')}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => handleValidateOperateur(user._id, 'reject')}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'superviseur', 'operateur'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm ${
              filter === f ? 'bg-[#1DB954] text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {f === 'all' ? 'Tous' : f === 'superviseur' ? 'Superviseurs' : 'Opérateurs'}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-[#1E1E1E] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#2A2A2A]">
            <tr className="text-left text-gray-400">
              <th className="p-4">Nom</th>
              <th className="p-4">Email</th>
              <th className="p-4">Rôle</th>
              <th className="p-4">Équipe</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user: any) => (
              <tr key={user._id} className="border-t border-gray-800">
                <td className="p-4 text-white">{user.name}</td>
                <td className="p-4 text-gray-400">{user.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.role === 'admin' ? 'bg-purple-900 text-purple-300' :
                    user.role === 'superviseur' ? 'bg-blue-900 text-blue-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : 
                     user.role === 'superviseur' ? 'Superviseur' : 'Opérateur'}
                  </span>
                </td>
                <td className="p-4 text-gray-400">
                  {user.teamId_data?.name || '-'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.validationStatus === 'approved' ? 'bg-green-900 text-green-300' :
                    user.validationStatus === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {user.validationStatus === 'approved' ? 'Actif' : 
                     user.validationStatus === 'pending' ? 'En attente' : 'Rejeté'}
                  </span>
                </td>
                <td className="p-4">
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
