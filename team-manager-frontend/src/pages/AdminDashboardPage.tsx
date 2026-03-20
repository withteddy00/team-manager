import { useState, useEffect } from 'react';
import { eventsAPI, teamManagementAPI, authAPI } from '../services/api';
import { Confirmation, Team, User } from '../types';

export default function AdminDashboardPage() {
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [superviseurs, setSuperviseurs] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', superviseurId: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [confirmationsRes, teamsRes, superviseursRes] = await Promise.all([
        eventsAPI.getConfirmations().catch(() => ({ data: [] })),
        teamManagementAPI.getAllTeams().catch(() => ({ data: [] })),
        authAPI.getSuperviseurs().catch(() => ({ data: [] }))
      ]);
      
      setConfirmations(confirmationsRes.data || []);
      setTeams(teamsRes.data || []);
      
      // Filter superviseurs who don't have a team yet
      const availableSuperviseurs = (superviseursRes.data || []).filter(
        (s: User) => !s.teamId
      );
      setSuperviseurs(availableSuperviseurs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (confirmationId: string) => {
    try {
      await eventsAPI.approveConfirmation(confirmationId);
      loadData();
      alert('Confirmation approuvée!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (confirmationId: string) => {
    const reason = prompt('Motif du rejet (optionnel):');
    try {
      await eventsAPI.rejectConfirmation(confirmationId, reason || undefined);
      loadData();
      alert('Confirmation rejetée!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors du rejet');
    }
  };

  const handleSyncHolidays = async () => {
    try {
      const year = new Date().getFullYear();
      await eventsAPI.syncHolidays(year);
      loadData();
      alert('Jours fériés synchronisés!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la synchronisation');
    }
  };

  const handleValidateOperateur = async (teamId: string, operateurId: string, action: 'approve' | 'reject') => {
    try {
      await teamManagementAPI.validateOperateur(teamId, operateurId, action);
      loadData();
      alert(action === 'approve' ? 'Opérateur approuvé!' : 'Opérateur rejeté!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await teamManagementAPI.createTeam(newTeam.name, newTeam.superviseurId);
      setShowCreateTeam(false);
      setNewTeam({ name: '', superviseurId: '' });
      loadData();
      alert('Équipe créée!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const filteredConfirmations = confirmations.filter(c => c.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingCount = confirmations.filter(c => c.status === 'pending').length;

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Tableau de Bord Admin</h1>
            <p className="text-gray-400">Gestion des équipes et confirmations</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSyncHolidays}
              className="px-4 py-2 bg-[#1DB954] text-white rounded-lg hover:bg-[#1ed760]"
            >
              Synchroniser Jours Fériés
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 relative"
            >
              Confirmations
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Teams Section */}
        <div className="bg-[#1E1E1E] p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Équipes ({teams.length}/4)</h2>
            {teams.length < 4 && (
              <button
                onClick={() => setShowCreateTeam(true)}
                className="px-4 py-2 bg-[#1DB954] text-white rounded-lg hover:bg-[#1ed760]"
              >
                + Créer une équipe
              </button>
            )}
          </div>

          {/* Create Team Form */}
          {showCreateTeam && (
            <form onSubmit={handleCreateTeam} className="mb-6 p-4 bg-[#2A2A2A] rounded-lg">
              <h3 className="text-white font-medium mb-3">Nouvelle Équipe</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Nom de l'équipe"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="flex-1 bg-[#282828] border border-[#383838] rounded-lg px-4 py-2 text-white"
                  required
                />
                <select
                  value={newTeam.superviseurId}
                  onChange={(e) => setNewTeam({ ...newTeam, superviseurId: e.target.value })}
                  className="flex-1 bg-[#282828] border border-[#383838] rounded-lg px-4 py-2 text-white"
                  required
                >
                  <option value="">Sélectionner un superviseur</option>
                  {superviseurs.map((s: any) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
                <button type="submit" className="px-4 py-2 bg-[#1DB954] text-white rounded-lg">
                  Créer
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowCreateTeam(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}

          {/* Team Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team: any) => (
              <div key={team._id} className="bg-[#2A2A2A] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">{team.name}</h3>
                  <span className="text-gray-400 text-sm">
                    {team.operateurs?.length || 0} opérateurs
                  </span>
                </div>
                
                <div className="mb-3">
                  <span className="text-gray-400 text-sm">Superviseur: </span>
                  <span className="text-white text-sm">
                    {team.superviseurId_data?.name || 'N/A'}
                  </span>
                </div>

                {/* Operateurs */}
                <div className="mb-3">
                  <span className="text-gray-400 text-sm">Opérateurs actifs:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(team.operateurs_data || team.operateurs || []).map((op: any) => (
                      <span key={op._id} className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                        {op.name}
                      </span>
                    ))}
                    {(team.operateurs_data || team.operateurs || []).length === 0 && (
                      <span className="text-gray-500 text-xs">Aucun</span>
                    )}
                  </div>
                </div>

                {/* Pending Operateurs */}
                {(team.pendingOperateurs_data || team.pendingOperateurs || []).length > 0 && (
                  <div className="border-t border-gray-700 pt-3">
                    <span className="text-yellow-400 text-sm">En attente de validation:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(team.pendingOperateurs_data || team.pendingOperateurs || []).map((op: any) => (
                        <div key={op._id} className="flex items-center gap-1 bg-yellow-900/30 px-2 py-1 rounded">
                          <span className="text-yellow-300 text-xs">{op.name}</span>
                          <button
                            onClick={() => handleValidateOperateur(team._id, op._id, 'approve')}
                            className="text-green-400 hover:text-green-300 text-xs"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleValidateOperateur(team._id, op._id, 'reject')}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            ✗
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {teams.length === 0 && (
              <div className="col-span-2 text-center py-8 text-gray-400">
                Aucune équipe. Créez votre première équipe.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar - Confirmations */}
      {sidebarOpen && (
        <div className="w-96 bg-[#1E1E1E] border-l border-gray-800 p-4 overflow-y-auto h-screen">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Confirmations</h2>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4">
            {(['pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-lg text-xs ${
                  filter === status
                    ? 'bg-[#1DB954] text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {status === 'pending' ? 'En attente' : 
                 status === 'approved' ? 'Approuvées' : 'Rejetées'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredConfirmations.map((conf: any) => (
              <div key={conf._id} className="p-3 bg-[#2A2A2A] rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-white font-medium text-sm">
                      {conf.eventId?.title || 'Événement'}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      Type: {conf.eventId?.type === 'holiday' ? 'Jour férié' : 'Astreinte'}
                    </div>
                    <div className="text-gray-400 text-xs">
                      Par: {conf.submittedBy_data?.name || 'N/A'}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {conf.eventId?.date ? new Date(conf.eventId.date).toLocaleDateString('fr-FR') : ''}
                    </div>
                    
                    {conf.selectedOperators_data && conf.selectedOperators_data.length > 0 && (
                      <div className="mt-2">
                        <span className="text-gray-500 text-xs">Opérateurs: </span>
                        <span className="text-white text-xs">
                          {conf.selectedOperators_data.map((op: any) => op.name).join(', ')}
                        </span>
                      </div>
                    )}

                    {conf.status === 'rejected' && conf.rejectionReason && (
                      <div className="mt-1 text-red-400 text-xs">
                        Motif: {conf.rejectionReason}
                      </div>
                    )}
                  </div>
                  
                  {conf.status === 'pending' && (
                    <div className="flex flex-col gap-1 ml-2">
                      <button
                        onClick={() => handleApprove(conf._id)}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleReject(conf._id)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        ✗
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredConfirmations.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">Aucune confirmation</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
