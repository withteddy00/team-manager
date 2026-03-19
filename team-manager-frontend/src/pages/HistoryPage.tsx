import { useState, useEffect } from 'react';
import { historyAPI, teamAPI } from '../services/api';
import { HistoryItem, TeamMember } from '../types';
import { Filter } from 'lucide-react';

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    event_type: '',
    member_id: '',
    date_from: '',
    date_to: '',
    month: '',
    year: String(new Date().getFullYear()),
    status: '',
  });

  useEffect(() => { loadMembers(); }, []);
  useEffect(() => { loadHistory(); }, [filters]);

  const loadMembers = async () => {
    try {
      const res = await teamAPI.list();
      setMembers(res.data);
    } catch {}
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.event_type) params.event_type = filters.event_type;
      if (filters.member_id) params.member_id = Number(filters.member_id);
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.month) params.month = Number(filters.month);
      if (filters.year) params.year = Number(filters.year);
      if (filters.status) params.status = filters.status;
      const res = await historyAPI.list(params);
      setItems(res.data);
    } catch {} finally { setLoading(false); }
  };

  const resetFilters = () => {
    setFilters({ event_type: '', member_id: '', date_from: '', date_to: '', month: '', year: String(new Date().getFullYear()), status: '' });
  };

  const monthNames = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historique</h1>
        <p className="text-[#b3b3b3] text-sm mt-1">Historique complet des événements et paiements</p>
      </div>

      {/* Filters */}
      <div className="bg-[#181818] rounded-xl p-5 border border-[#282828]">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-[#1DB954]" />
          <h3 className="font-semibold">Filtres</h3>
          <button onClick={resetFilters} className="ml-auto text-sm text-[#1DB954] hover:underline">Réinitialiser</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select value={filters.event_type} onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
            className="bg-[#282828] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#1DB954]">
            <option value="">Tous les types</option>
            <option value="holiday">Jour Férié</option>
            <option value="egypt_duty">Astreinte Égypte</option>
          </select>
          <select value={filters.member_id} onChange={(e) => setFilters({ ...filters, member_id: e.target.value })}
            className="bg-[#282828] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#1DB954]">
            <option value="">Tous les membres</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
          <select value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            className="bg-[#282828] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#1DB954]">
            <option value="">Tous les mois</option>
            {monthNames.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            className="bg-[#282828] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#1DB954]">
            <option value="">Toutes les années</option>
            {Array.from({ length: 7 }, (_, i) => 2024 + i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            className="bg-[#282828] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#1DB954]"
            placeholder="Date début" />
          <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            className="bg-[#282828] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#1DB954]"
            placeholder="Date fin" />
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-[#282828] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#1DB954]">
            <option value="">Tous les statuts</option>
            <option value="validated">Validé</option>
            <option value="pending">En attente</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-[#181818] rounded-xl border border-[#282828] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#282828]">
                <th className="text-left py-3 px-4 text-[#b3b3b3] text-sm font-medium">Date</th>
                <th className="text-left py-3 px-4 text-[#b3b3b3] text-sm font-medium">Type</th>
                <th className="text-left py-3 px-4 text-[#b3b3b3] text-sm font-medium">Événement</th>
                <th className="text-left py-3 px-4 text-[#b3b3b3] text-sm font-medium hidden lg:table-cell">Membres</th>
                <th className="text-right py-3 px-4 text-[#b3b3b3] text-sm font-medium">Montant/pers</th>
                <th className="text-right py-3 px-4 text-[#b3b3b3] text-sm font-medium">Total</th>
                <th className="text-left py-3 px-4 text-[#b3b3b3] text-sm font-medium">Statut</th>
                <th className="text-left py-3 px-4 text-[#b3b3b3] text-sm font-medium hidden md:table-cell">Commentaire</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={`${item.event_type}-${item.id}-${i}`} className="border-b border-[#282828]/50 hover:bg-[#282828]/30 transition-colors">
                  <td className="py-3 px-4 text-sm">
                    {new Date(item.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.event_type === 'holiday' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {item.event_type === 'holiday' ? 'Jour Férié' : 'Astreinte'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">{item.event_name}</td>
                  <td className="py-3 px-4 text-sm text-[#b3b3b3] hidden lg:table-cell">
                    {item.members.length > 0 ? item.members.join(', ') : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-right">{item.amount_per_person > 0 ? `${item.amount_per_person} DH` : '-'}</td>
                  <td className="py-3 px-4 text-sm text-right font-bold text-[#1DB954]">{item.total_amount > 0 ? `${item.total_amount.toLocaleString()} DH` : '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.validation_status === 'Travaillé' || item.validation_status === 'Validé' ? 'bg-[#1DB954]/20 text-[#1DB954]' :
                      item.validation_status === 'Non travaillé' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {item.validation_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#b3b3b3] hidden md:table-cell max-w-[200px] truncate">
                    {item.comment || '-'}
                  </td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr><td colSpan={8} className="py-12 text-center text-[#b3b3b3]">Aucun résultat trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
