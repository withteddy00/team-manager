import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { eventsAPI } from '../services/api';
import { Confirmation, Event } from '../types';

export default function OperateurDashboardPage() {
  const { user } = useAuth();
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const confirmationsRes = await eventsAPI.getMyConfirmations().catch(() => ({ data: [] }));
      setConfirmations(confirmationsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get events where this operator was assigned
  const myAssignments = confirmations.filter((conf: any) => {
    const operatorIds = conf.selectedOperators_data?.map((op: any) => op._id) || [];
    return operatorIds.includes(user?.id);
  });

  const totalEarned = confirmations
    .filter((conf: any) => conf.status === 'approved')
    .reduce((sum: number, conf: any) => {
      const operatorIds = conf.selectedOperators_data?.map((op: any) => op._id) || [];
      if (operatorIds.includes(user?.id)) {
        return sum + (conf.eventId?.amount || 1000);
      }
      return sum;
    }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Bienvenue, {user?.name}
        </h1>
        <p className="text-gray-400">Tableau de bord Opérateur</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1E1E1E] p-6 rounded-lg">
          <div className="text-3xl font-bold text-[#1DB954]">{totalEarned} MAD</div>
          <div className="text-gray-400">Total Gagné</div>
        </div>
        <div className="bg-[#1E1E1E] p-6 rounded-lg">
          <div className="text-3xl font-bold text-yellow-500">
            {myAssignments.filter((c: any) => c.status === 'pending').length}
          </div>
          <div className="text-gray-400">En attente</div>
        </div>
        <div className="bg-[#1E1E1E] p-6 rounded-lg">
          <div className="text-3xl font-bold text-green-500">
            {myAssignments.filter((c: any) => c.status === 'approved').length}
          </div>
          <div className="text-gray-400">Approuvées</div>
        </div>
      </div>

      {/* Total Salary from User */}
      <div className="bg-[#1E1E1E] p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-2">Mon Salaire Total</h2>
        <div className="text-4xl font-bold text-[#1DB954]">{user?.totalSalary || 0} MAD</div>
      </div>

      {/* My History */}
      <div className="bg-[#1E1E1E] p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Mon Historique</h2>
        <div className="space-y-3">
          {myAssignments.map((conf: any) => (
            <div key={conf._id} className="p-4 bg-[#2A2A2A] rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{conf.eventId?.title}</div>
                  <div className="text-gray-400 text-sm">
                    {conf.eventId?.type === 'holiday' ? 'Jour férié' : 'Astreinte'} - {' '}
                    {conf.eventId?.date ? new Date(conf.eventId.date).toLocaleDateString('fr-FR') : 'N/A'}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Montant: {conf.eventId?.amount || 1000} MAD
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    conf.status === 'approved' ? 'bg-green-900 text-green-300' :
                    conf.status === 'rejected' ? 'bg-red-900 text-red-300' :
                    'bg-yellow-900 text-yellow-300'
                  }`}>
                    {conf.status === 'approved' ? 'Approuvé' :
                     conf.status === 'rejected' ? 'Rejeté' : 'En attente'}
                  </span>
                  {conf.status === 'approved' && (
                    <div className="text-[#1DB954] text-sm mt-1">+{conf.eventId?.amount || 1000} MAD</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {myAssignments.length === 0 && (
            <p className="text-gray-400">Aucune assignation</p>
          )}
        </div>
      </div>
    </div>
  );
}
