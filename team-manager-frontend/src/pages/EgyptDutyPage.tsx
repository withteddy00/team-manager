import { useState, useEffect } from 'react';
import { egyptDutyAPI, teamAPI } from '../services/api';
import { EgyptDuty, TeamMember } from '../types';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Edit2, Trash2, Pyramid, Users, MessageSquare, AlertCircle } from 'lucide-react';

export default function EgyptDutyPage() {
  const { isAdmin } = useAuth();
  const [duties, setDuties] = useState<EgyptDuty[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDuty, setEditDuty] = useState<EgyptDuty | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [dutyDate, setDutyDate] = useState('');
  const [dutyComment, setDutyComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, [year, month]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dutiesRes, membersRes] = await Promise.all([
        egyptDutyAPI.list({ year, month }),
        teamAPI.list(undefined, 'active'),
      ]);
      setDuties(dutiesRes.data);
      setMembers(membersRes.data);
    } catch {} finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditDuty(null);
    setSelectedMembers([]);
    setDutyComment('');
    setError('');
    // Find next Sunday
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7;
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
    setDutyDate(nextSunday.toISOString().split('T')[0]);
    setShowModal(true);
  };

  const openEdit = (duty: EgyptDuty) => {
    setEditDuty(duty);
    setSelectedMembers(duty.beneficiaries.map(b => b.member_id));
    setDutyDate(duty.date);
    setDutyComment(duty.comment || '');
    setError('');
    setShowModal(true);
  };

  const toggleMember = (id: number) => {
    setError('');
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter(m => m !== id));
    } else {
      if (selectedMembers.length >= 3) {
        setError('Vous ne pouvez sélectionner que 3 personnes');
        return;
      }
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const handleSubmit = async () => {
    if (selectedMembers.length !== 3) {
      setError('Vous devez sélectionner exactement 3 personnes');
      return;
    }
    try {
      if (editDuty) {
        await egyptDutyAPI.update(editDuty.id, { member_ids: selectedMembers, comment: dutyComment });
      } else {
        await egyptDutyAPI.create({ date: dutyDate, member_ids: selectedMembers, comment: dutyComment });
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Annuler cette astreinte ?')) return;
    try {
      await egyptDutyAPI.delete(id);
      loadData();
    } catch {}
  };

  const monthNames = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Astreinte Égypte</h1>
          <p className="text-[#b3b3b3] text-sm mt-1">Gestion des astreintes du dimanche</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-[#282828] border border-[#383838] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#1DB954]">
            {monthNames.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="bg-[#282828] border border-[#383838] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#1DB954]">
            {Array.from({ length: 7 }, (_, i) => 2024 + i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {isAdmin && (
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white px-4 py-2 rounded-full font-medium transition-all">
              <Plus size={16} /> Nouvelle Astreinte
            </button>
          )}
        </div>
      </div>

      {/* Duties List */}
      <div className="space-y-3">
        {duties.map((d) => (
          <div key={d.id} className="bg-[#181818] rounded-xl p-5 border border-[#282828] hover:border-[#383838] transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Pyramid size={24} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Astreinte Égypte</h3>
                  <p className="text-[#b3b3b3] text-sm">
                    {new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-[#1DB954]/20 text-[#1DB954]">
                  Validé - {d.beneficiaries.length * 1000} DH
                </span>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(d)} className="p-2 hover:bg-[#282828] rounded-lg transition-colors">
                      <Edit2 size={16} className="text-[#b3b3b3]" />
                    </button>
                    <button onClick={() => handleDelete(d.id)} className="p-2 hover:bg-[#282828] rounded-lg transition-colors">
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#282828]">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-[#b3b3b3]" />
                <span className="text-sm text-[#b3b3b3]">Bénéficiaires (3 personnes)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {d.beneficiaries.map(b => (
                  <span key={b.id} className="bg-purple-500/10 text-purple-300 px-3 py-1.5 rounded-full text-sm border border-purple-500/20">
                    {b.member_name} - {b.amount} DH
                  </span>
                ))}
              </div>
            </div>

            {d.comment && (
              <div className="mt-3 flex items-start gap-2 text-sm text-[#b3b3b3]">
                <MessageSquare size={14} className="mt-0.5 flex-shrink-0" />
                <span>{d.comment}</span>
              </div>
            )}
          </div>
        ))}

        {duties.length === 0 && !loading && (
          <div className="bg-[#181818] rounded-xl p-12 border border-[#282828] text-center">
            <Pyramid size={48} className="mx-auto text-[#383838] mb-4" />
            <p className="text-[#b3b3b3]">Aucune astreinte pour {monthNames[month]} {year}</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#282828] rounded-2xl p-6 w-full max-w-lg border border-[#383838]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editDuty ? 'Modifier l\'astreinte' : 'Nouvelle Astreinte Égypte'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#b3b3b3] hover:text-white"><X size={20} /></button>
            </div>

            {!editDuty && (
              <div className="mb-4">
                <label className="block text-sm text-[#b3b3b3] mb-1">Date (dimanche) *</label>
                <input type="date" value={dutyDate} onChange={(e) => setDutyDate(e.target.value)}
                  className="w-full bg-[#181818] border border-[#383838] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#1DB954]" />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-[#b3b3b3] mb-2">
                Sélectionner exactement 3 personnes ({selectedMembers.length}/3)
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {members.map(m => (
                  <button
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                      selectedMembers.includes(m.id)
                        ? 'bg-[#1DB954]/20 border border-[#1DB954]/50'
                        : 'bg-[#181818] border border-[#383838] hover:border-[#1DB954]/30'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      selectedMembers.includes(m.id) ? 'bg-[#1DB954] text-white' : 'bg-[#383838] text-[#b3b3b3]'
                    }`}>
                      {m.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{m.full_name}</p>
                      <p className="text-xs text-[#b3b3b3]">{m.position || 'Pas de poste'}</p>
                    </div>
                    {selectedMembers.includes(m.id) && (
                      <span className="ml-auto text-[#1DB954] text-sm font-medium">1000 DH</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <AlertCircle size={16} className="text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-[#b3b3b3] mb-1">Commentaire</label>
              <textarea value={dutyComment} onChange={(e) => setDutyComment(e.target.value)}
                className="w-full bg-[#181818] border border-[#383838] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#1DB954] resize-none" rows={2}
                placeholder="Ajouter un commentaire (optionnel)" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-[#383838] hover:bg-[#444] rounded-full font-medium transition-colors">
                Annuler
              </button>
              <button onClick={handleSubmit}
                disabled={selectedMembers.length !== 3}
                className="flex-1 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {editDuty ? 'Modifier' : 'Valider'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
