import { useState, useEffect } from 'react';
import { teamAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, Check, X, Shield, User } from 'lucide-react';

interface Team {
  _id: string;
  name: string;
  superviseurId: { _id: string; name: string; email: string };
  operateurs: Array<{ _id: string; name: string; email: string }>;
  pendingOperateurs: Array<{ _id: string; name: string; email: string }>;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function TeamsPage() {
  const { user, isAdmin, isSuperviseur } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showOperateurModal, setShowOperateurModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [form, setForm] = useState({ name: '', superviseurId: '' });
  const [operateurEmail, setOperateurEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [availableSuperviseurs, setAvailableSuperviseurs] = useState<User[]>([]);

  useEffect(() => { loadTeams(); }, []);
  
  useEffect(() => {
    if (isAdmin) {
      loadSuperviseurs();
    }
  }, [isAdmin]);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const res = await teamAPI.list();
      setTeams(res.data);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSuperviseurs = async () => {
    try {
      const res = await authAPI.getSuperviseurs();
      setAvailableSuperviseurs(res.data);
    } catch (err) {
      console.error('Failed to load superviseurs:', err);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await teamAPI.create(form);
      setShowModal(false);
      setForm({ name: '', superviseurId: '' });
      loadTeams();
    } catch (err) {
      console.error('Failed to create team:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Supprimer cette équipe ?')) return;
    try {
      await teamAPI.delete(teamId);
      loadTeams();
    } catch (err) {
      console.error('Failed to delete team:', err);
    }
  };

  const handleAddOperateur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !operateurEmail) return;
    
    setSaving(true);
    try {
      // Find user by email
      const usersRes = await authAPI.getAllUsers();
      const operateur = usersRes.data.find((u: User) => u.email === operateurEmail);
      
      if (operateur) {
        await teamAPI.addOperateur(selectedTeam._id, operateur._id);
        setShowOperateurModal(false);
        setOperateurEmail('');
        setSelectedTeam(null);
        loadTeams();
      } else {
        alert('Utilisateur non trouvé');
      }
    } catch (err) {
      console.error('Failed to add operateur:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveOperateur = async (teamId: string, operateurId: string) => {
    try {
      await teamAPI.approveOperateur(teamId, operateurId);
      loadTeams();
    } catch (err) {
      console.error('Failed to approve operateur:', err);
    }
  };

  const handleRejectOperateur = async (teamId: string, operateurId: string) => {
    try {
      await teamAPI.rejectOperateur(teamId, operateurId);
      loadTeams();
    } catch (err) {
      console.error('Failed to reject operateur:', err);
    }
  };

  // Filter teams for superviseur
  const displayTeams = isSuperviseur 
    ? teams.filter(t => t.superviseurId?._id === user?._id)
    : teams;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Équipes</h1>
          <p className="text-[#b3b3b3] text-sm mt-1">
            {isSuperviseur ? 'Votre équipe' : `${displayTeams.length} équipes`}
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white px-4 py-2 rounded-full font-medium transition-all"
          >
            <Users size={18} /> Nouvelle équipe
          </button>
        )}
      </div>

      {/* Team Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1DB954]"></div>
        </div>
      ) : displayTeams.length === 0 ? (
        <div className="bg-[#181818] rounded-xl border border-[#282828] p-12 text-center">
          <Users size={48} className="mx-auto text-[#444] mb-4" />
          <p className="text-[#b3b3b3]">Aucune équipe trouvée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTeams.map((team) => (
            <div key={team._id} className="bg-[#181818] rounded-xl border border-[#282828] overflow-hidden hover:border-[#1DB954]/50 transition-colors">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#1DB954]/20 to-transparent p-4 border-b border-[#282828]">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{team.name}</h3>
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteTeam(team._id)}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Superviseur */}
              <div className="p-4 border-b border-[#282828]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1DB954]/20 flex items-center justify-center">
                    <Shield size={18} className="text-[#1DB954]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#b3b3b3]">Superviseur</p>
                    <p className="font-medium text-white">{team.superviseurId?.name || 'Non assigné'}</p>
                  </div>
                </div>
              </div>

              {/* Operateurs */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-[#b3b3b3]">Opérateurs ({team.operateurs?.length || 0})</p>
                  {isSuperviseur && team.superviseurId?._id === user?._id && (
                    <button 
                      onClick={() => { setSelectedTeam(team); setShowOperateurModal(true); }}
                      className="flex items-center gap-1 text-xs text-[#1DB954] hover:text-[#1ed760]"
                    >
                      <UserPlus size={14} /> Ajouter
                    </button>
                  )}
                </div>
                
                {team.operateurs?.length > 0 ? (
                  <div className="space-y-2">
                    {team.operateurs.map((op) => (
                      <div key={op._id} className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 rounded-full bg-[#282828] flex items-center justify-center">
                          <User size={12} className="text-[#b3b3b3]" />
                        </div>
                        <span className="text-white">{op.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#666] italic">Aucun opérateur</p>
                )}

                {/* Pending Operateurs (Admin only) */}
                {isAdmin && team.pendingOperateurs?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#282828]">
                    <p className="text-xs text-yellow-500 mb-2">En attente d'approbation ({team.pendingOperateurs.length})</p>
                    <div className="space-y-2">
                      {team.pendingOperateurs.map((op) => (
                        <div key={op._id} className="flex items-center justify-between bg-[#282828] rounded-lg p-2">
                          <span className="text-sm text-white">{op.name}</span>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleApproveOperateur(team._id, op._id)}
                              className="p-1 hover:bg-[#1DB954]/20 rounded text-[#1DB954]"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => handleRejectOperateur(team._id, op._id)}
                              className="p-1 hover:bg-red-500/20 rounded text-red-400"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#282828] rounded-2xl p-6 w-full max-w-md border border-[#383838]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Nouvelle équipe</h2>
              <button onClick={() => setShowModal(false)} className="text-[#b3b3b3] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1">Nom de l'équipe *</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  required
                  className="w-full bg-[#181818] border border-[#383838] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#1DB954]" 
                />
              </div>
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1">Superviseur *</label>
                <select 
                  value={form.superviseurId} 
                  onChange={(e) => setForm({ ...form, superviseurId: e.target.value })} 
                  required
                  className="w-full bg-[#181818] border border-[#383838] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#1DB954]"
                >
                  <option value="">Sélectionner un superviseur</option>
                  {availableSuperviseurs.map((sup) => (
                    <option key={sup._id} value={sup._id}>{sup.name} ({sup.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-2.5 bg-[#383838] hover:bg-[#444] rounded-full font-medium transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] rounded-full font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Operateur Modal */}
      {showOperateurModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#282828] rounded-2xl p-6 w-full max-w-md border border-[#383838]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Ajouter un opérateur</h2>
              <button onClick={() => { setShowOperateurModal(false); setSelectedTeam(null); }} className="text-[#b3b3b3] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-[#b3b3b3] mb-4">Équipe: {selectedTeam.name}</p>
            <form onSubmit={handleAddOperateur} className="space-y-4">
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1">Email de l'opérateur *</label>
                <input 
                  type="email" 
                  value={operateurEmail} 
                  onChange={(e) => setOperateurEmail(e.target.value)} 
                  required
                  placeholder="operateur@email.com"
                  className="w-full bg-[#181818] border border-[#383838] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#1DB954]" 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setShowOperateurModal(false); setSelectedTeam(null); }} 
                  className="flex-1 py-2.5 bg-[#383838] hover:bg-[#444] rounded-full font-medium transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] rounded-full font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
