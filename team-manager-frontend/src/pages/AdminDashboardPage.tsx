import { useState, useEffect } from 'react';
import { eventsAPI, teamManagementAPI } from '../services/api';
import { Confirmation, Team, User } from '../types';

export default function AdminDashboardPage() {
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [operators, setOperators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [confirmationsRes, teamsRes, availableOpsRes] = await Promise.all([
        eventsAPI.getConfirmations().catch(() => ({ data: [] })),
        teamManagementAPI.getAllTeams().catch(() => ({ data: [] })),
        teamManagementAPI.getAvailableOperators().catch(() => ({ data: [] }))
      ]);
      
      setConfirmations(confirmationsRes.data || []);
      setTeams(teamsRes.data || []);
      setOperators(availableOpsRes.data || []);
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

  const filteredConfirmations = confirmations.filter(c => c.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tableau de Bord Admin</h1>
          <p className="text-gray-400">Gestion des confirmations et des équipes</p>
        </div>
        <button
          onClick={handleSyncHolidays}
          className="px-4 py-2 bg-[#1DB954] text-white rounded-lg hover:bg-[#1ed760]"
        >
          Synchroniser Jours Fériés
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1E1E1E] p-6 rounded-lg">
          <div className="text-3xl font-bold text-[#1DB954]">{teams.length}</div>
          <div className="text-gray-400">Équipes</div>
        </div>
        <div className="bg-[#1E1E1E] p-6 rounded-lg">
          <div className="text-3xl font-bold text-yellow-500">
            {confirmations.filter(c => c.status === 'pending').length}
          </div>
          <div className="text-gray-400">En attente</div>
        </div>
        <div className="bg-[#1E1E1E] p-6 rounded-lg">
          <div className="text-3xl font-bold text-green-500">
            {confirmations.filter(c => c.status === 'approved').length}
          </div>
          <div className="text-gray-400">Approuvées</div>
        </div>
        <div className="bg-[#1E1E1E] p-6 rounded-lg">
          <div className="text-3xl font-bold text-red-500">
            {confirmations.filter(c => c.status === 'rejected').length}
          </div>
          <div className="text-gray-400">Rejetées</div>
        </div>
      </div>

      {/* Teams */}
      <div className="bg-[#1E1E1E] p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Équipes</h2>
        <div className="space-y-3">
          {teams.map((team: any) => (
            <div key={team._id} className="p-3 bg-[#2A2A2A] rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{team.name}</div>
                  <div className="text-gray-400 text-sm">
                    Superviseur: {team.superviseurId_data?.name || 'N/A'}
                  </div>
                </div>
                <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                  {team.members?.length || 0} membres
                </span>
              </div>
            </div>
          ))}
          {teams.length === 0 && (
            <p className="text-gray-400">Aucune équipe</p>
          )}
        </div>
      </div>

      {/* Operators Available */}
      {operators.length > 0 && (
        <div className="bg-[#1E1E1E] p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Opérateurs Non Assignés</h2>
          <div className="flex flex-wrap gap-2">
            {operators.map((op: any) => (
              <span key={op._id} className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                {op.name} ({op.email})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confirmations */}
      <div className="bg-[#1E1E1E] p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Confirmations</h2>
        
        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(['pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm ${
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
            <div key={conf._id} className="p-4 bg-[#2A2A2A] rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {conf.eventId?.title || 'Événement'}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">
                    Type: {conf.eventId?.type === 'holiday' ? 'Jour férié' : 'Astreinte'}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Soumis par: {conf.submittedBy_data?.name || 'N/A'}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Date: {conf.eventId?.date ? new Date(conf.eventId.date).toLocaleDateString('fr-FR') : 'N/A'}
                  </div>
                  
                  {/* Selected operators */}
                  {conf.selectedOperators_data && conf.selectedOperators_data.length > 0 && (
                    <div className="mt-2">
                      <span className="text-gray-400 text-sm">Opérateurs: </span>
                      <span className="text-white text-sm">
                        {conf.selectedOperators_data.map((op: any) => op.name).join(', ')}
                      </span>
                    </div>
                  )}

                  {conf.status === 'rejected' && conf.rejectionReason && (
                    <div className="mt-2 text-red-400 text-sm">
                      Motif du rejet: {conf.rejectionReason}
                    </div>
                  )}
                </div>
                
                {conf.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(conf._id)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => handleReject(conf._id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredConfirmations.length === 0 && (
            <p className="text-gray-400">Aucune confirmation</p>
          )}
        </div>
      </div>
    </div>
  );
}
