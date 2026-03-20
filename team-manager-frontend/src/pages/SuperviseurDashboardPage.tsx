import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { eventsAPI, teamManagementAPI, notificationsAPI } from '../services/api';
import { Event, Team, Confirmation } from '../types';

export default function SuperviseurDashboardPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [astreintes, setAstreintes] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAstreinte, setSelectedAstreinte] = useState<string | null>(null);
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teamRes, eventsRes, confirmationsRes] = await Promise.all([
        teamManagementAPI.getMyTeam().catch(() => ({ data: null })),
        eventsAPI.getMyEvents().catch(() => ({ data: [] })),
        eventsAPI.getMyConfirmations().catch(() => ({ data: [] }))
      ]);
      
      setTeam(teamRes.data);
      setEvents(eventsRes.data || []);
      setConfirmations(confirmationsRes.data || []);
      
      // Filter astreintes
      const astreinteEvents = (eventsRes.data || []).filter((e: Event) => e.type === 'astreinte');
      setAstreintes(astreinteEvents);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAstreinte = async (eventId: string, operatorIds: string[]) => {
    try {
      await eventsAPI.assignOperators(eventId, operatorIds);
      loadData();
      setSelectedAstreinte(null);
      setSelectedOperators([]);
      alert('Opérateurs assignés avec succès!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'assignation');
    }
  };

  const handleConfirmHoliday = async (eventId: string) => {
    try {
      await eventsAPI.submitHolidayConfirmation(eventId);
      loadData();
      alert('Confirmation soumise avec succès!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la confirmation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const holidays = events.filter(e => e.type === 'holiday');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Bienvenue, {user?.name}
          </h1>
          <p className="text-gray-400">Tableau de bord Superviseur</p>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1E1E1E] p-6 rounded-lg">
          <div className="text-3xl font-bold text-[#1DB954]">{team?.members?.length || 0}</div>
          <div className="text-gray-400">Membres de l'équipe</div>
        </div>
        <div className="bg-[#1E1E1E] p-6 rounded-lg">
          <div className="text-3xl font-bold text-[#1DB954]">{holidays.length}</div>
          <div className="text-gray-400">Jours fériés</div>
        </div>
        <div className="bg-[#1E1E1E] p-6 rounded-lg">
          <div className="text-3xl font-bold text-[#1DB954]">{astreintes.length}</div>
          <div className="text-gray-400">Astreintes</div>
        </div>
      </div>

      {/* Team Members */}
      {team && (
        <div className="bg-[#1E1E1E] p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Mon Équipe</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-3">Nom</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Salaire Total</th>
                </tr>
              </thead>
              <tbody>
                {team.members?.map((member: any) => (
                  <tr key={member._id} className="border-b border-gray-800">
                    <td className="py-3 text-white">{member.name}</td>
                    <td className="py-3 text-gray-400">{member.email}</td>
                    <td className="py-3 text-[#1DB954]">{member.totalSalary || 0} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Holidays */}
      <div className="bg-[#1E1E1E] p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Jours Fériés</h2>
        <div className="space-y-3">
          {holidays.map((holiday: any) => (
            <div key={holiday._id} className="flex items-center justify-between p-3 bg-[#2A2A2A] rounded-lg">
              <div>
                <div className="text-white font-medium">{holiday.title}</div>
                <div className="text-gray-400 text-sm">
                  {new Date(holiday.date).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <button
                onClick={() => handleConfirmHoliday(holiday._id)}
                className="px-4 py-2 bg-[#1DB954] text-white rounded-lg hover:bg-[#1ed760]"
              >
                Confirmer
              </button>
            </div>
          ))}
          {holidays.length === 0 && (
            <p className="text-gray-400">Aucun jour férié</p>
          )}
        </div>
      </div>

      {/* Astreintes */}
      <div className="bg-[#1E1E1E] p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Astreintes (Sélectionner 3 opérateurs)</h2>
        <div className="space-y-3">
          {astreintes.map((astreinte: any) => {
            const isAssigned = astreinte.assignedOperators?.length > 0;
            return (
              <div key={astreinte._id} className="p-3 bg-[#2A2A2A] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-white font-medium">{astreinte.title}</div>
                    <div className="text-gray-400 text-sm">
                      {new Date(astreinte.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${isAssigned ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                    {isAssigned ? 'Assigné' : 'En attente'}
                  </span>
                </div>
                
                {!isAssigned && team?.members && team.members.length >= 3 && (
                  <div className="mt-3">
                    <p className="text-gray-400 text-sm mb-2">Sélectionnez 3 opérateurs:</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {team.members.map((member: any) => (
                        <button
                          key={member._id}
                          onClick={() => {
                            if (selectedOperators.includes(member._id)) {
                              setSelectedOperators(selectedOperators.filter(id => id !== member._id));
                            } else if (selectedOperators.length < 3) {
                              setSelectedOperators([...selectedOperators, member._id]);
                            }
                          }}
                          className={`px-3 py-1 rounded text-sm ${
                            selectedOperators.includes(member._id)
                              ? 'bg-[#1DB954] text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {member.name}
                        </button>
                      ))}
                    </div>
                    {selectedOperators.length === 3 && (
                      <button
                        onClick={() => handleSelectAstreinte(astreinte._id, selectedOperators)}
                        className="w-full py-2 bg-[#1DB954] text-white rounded-lg hover:bg-[#1ed760]"
                      >
                        Confirmer l'assignation
                      </button>
                    )}
                  </div>
                )}
                
                {isAssigned && astreinte.assignedOperators_data && (
                  <div className="mt-2">
                    <p className="text-gray-400 text-sm">Opérateurs assignés:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {astreinte.assignedOperators_data.map((op: any) => (
                        <span key={op._id} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                          {op.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {astreintes.length === 0 && (
            <p className="text-gray-400">Aucune astreinte prévue</p>
          )}
        </div>
      </div>

      {/* My Confirmations */}
      <div className="bg-[#1E1E1E] p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Mes Confirmations</h2>
        <div className="space-y-3">
          {confirmations.map((conf: any) => (
            <div key={conf._id} className="p-3 bg-[#2A2A2A] rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{conf.eventId?.title}</div>
                  <div className="text-gray-400 text-sm">
                    Soumis le {new Date(conf.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  conf.status === 'approved' ? 'bg-green-900 text-green-300' :
                  conf.status === 'rejected' ? 'bg-red-900 text-red-300' :
                  'bg-yellow-900 text-yellow-300'
                }`}>
                  {conf.status === 'approved' ? 'Approuvé' :
                   conf.status === 'rejected' ? 'Rejeté' : 'En attente'}
                </span>
              </div>
              {conf.status === 'rejected' && conf.rejectionReason && (
                <div className="mt-2 text-red-400 text-sm">Raison: {conf.rejectionReason}</div>
              )}
            </div>
          ))}
          {confirmations.length === 0 && (
            <p className="text-gray-400">Aucune confirmation</p>
          )}
        </div>
      </div>
    </div>
  );
}
