import React, { useState, useEffect } from 'react';
import { holidaysAPI } from '../services/api';
import { Holiday } from '../types';
import { useAuth } from '../context/AuthContext';
import { Plus, Check, X, Edit2, Trash2, RefreshCw, Sun, MessageSquare } from 'lucide-react';

export default function HolidaysPage() {
  const { isAdmin } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [createForm, setCreateForm] = useState({ date: '', holiday_name: '', comment: '' });
  const [validateComment, setValidateComment] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { loadHolidays(); }, [year]);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const res = await holidaysAPI.list({ year });
      setHolidays(res.data);
    } catch {} finally { setLoading(false); }
  };

  const syncHolidays = async () => {
    setSyncing(true);
    try {
      await holidaysAPI.sync(year);
      loadHolidays();
    } catch {} finally { setSyncing(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await holidaysAPI.create(createForm);
      setShowCreateModal(false);
      setCreateForm({ date: '', holiday_name: '', comment: '' });
      loadHolidays();
    } catch {}
  };

  const handleValidate = async (worked: boolean) => {
    if (!selectedHoliday) return;
    try {
      await holidaysAPI.validate(selectedHoliday.id, { worked, comment: validateComment });
      setShowValidateModal(false);
      setSelectedHoliday(null);
      setValidateComment('');
      loadHolidays();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce jour férié ?')) return;
    try {
      await holidaysAPI.delete(id);
      loadHolidays();
    } catch {}
  };

  const openValidate = (h: Holiday) => {
    setSelectedHoliday(h);
    setValidateComment(h.comment || '');
    setShowValidateModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Jours Fériés</h1>
          <p className="text-[#b3b3b3] text-sm mt-1">Gestion des jours fériés marocains</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="bg-[#282828] border border-[#383838] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#1DB954]">
            {Array.from({ length: 7 }, (_, i) => 2024 + i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {isAdmin && (
            <>
              <button onClick={syncHolidays} disabled={syncing}
                className="flex items-center gap-2 bg-[#282828] hover:bg-[#383838] text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50">
                <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> Synchroniser
              </button>
              <button onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white px-4 py-2 rounded-full font-medium transition-all">
                <Plus size={16} /> Ajouter
              </button>
            </>
          )}
        </div>
      </div>

      {/* Holidays List */}
      <div className="space-y-3">
        {holidays.map((h) => (
          <div key={h.id} className="bg-[#181818] rounded-xl p-5 border border-[#282828] hover:border-[#383838] transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  h.worked === true ? 'bg-[#1DB954]/20' : h.worked === false ? 'bg-red-500/20' : 'bg-yellow-500/20'
                }`}>
                  <Sun size={24} className={
                    h.worked === true ? 'text-[#1DB954]' : h.worked === false ? 'text-red-400' : 'text-yellow-500'
                  } />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{h.holiday_name}</h3>
                  <p className="text-[#b3b3b3] text-sm">{new Date(h.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  {h.auto_detected && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Auto-détecté</span>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  h.worked === true ? 'bg-[#1DB954]/20 text-[#1DB954]' :
                  h.worked === false ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {h.worked === true ? 'Travaillé' : h.worked === false ? 'Non travaillé' : 'En attente de validation'}
                </span>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => openValidate(h)} className="p-2 hover:bg-[#282828] rounded-lg transition-colors" title="Valider">
                      <Edit2 size={16} className="text-[#b3b3b3]" />
                    </button>
                    <button onClick={() => handleDelete(h.id)} className="p-2 hover:bg-[#282828] rounded-lg transition-colors" title="Supprimer">
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {h.worked === true && h.payments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#282828]">
                <p className="text-sm text-[#b3b3b3] mb-2">Bénéficiaires ({h.payments.length} membres) - {h.payments.length * 1000} DH total</p>
                <div className="flex flex-wrap gap-2">
                  {h.payments.map(p => (
                    <span key={p.id} className="bg-[#282828] px-3 py-1 rounded-full text-sm">
                      {p.member_name} - {p.amount} DH
                    </span>
                  ))}
                </div>
              </div>
            )}

            {h.comment && (
              <div className="mt-3 flex items-start gap-2 text-sm text-[#b3b3b3]">
                <MessageSquare size={14} className="mt-0.5 flex-shrink-0" />
                <span>{h.comment}</span>
              </div>
            )}
          </div>
        ))}

        {holidays.length === 0 && !loading && (
          <div className="bg-[#181818] rounded-xl p-12 border border-[#282828] text-center">
            <Sun size={48} className="mx-auto text-[#383838] mb-4" />
            <p className="text-[#b3b3b3]">Aucun jour férié pour {year}</p>
            <p className="text-sm text-[#666] mt-1">Cliquez sur "Synchroniser" pour détecter automatiquement les jours fériés</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#282828] rounded-2xl p-6 w-full max-w-md border border-[#383838]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Ajouter un jour férié</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-[#b3b3b3] hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1">Date *</label>
                <input type="date" value={createForm.date} onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })} required
                  className="w-full bg-[#181818] border border-[#383838] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#1DB954]" />
              </div>
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1">Nom du jour férié *</label>
                <input type="text" value={createForm.holiday_name} onChange={(e) => setCreateForm({ ...createForm, holiday_name: e.target.value })} required
                  className="w-full bg-[#181818] border border-[#383838] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#1DB954]" />
              </div>
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1">Commentaire</label>
                <textarea value={createForm.comment} onChange={(e) => setCreateForm({ ...createForm, comment: e.target.value })}
                  className="w-full bg-[#181818] border border-[#383838] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#1DB954] resize-none" rows={3} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 bg-[#383838] hover:bg-[#444] rounded-full font-medium transition-colors">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] rounded-full font-medium transition-colors">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Validate Modal */}
      {showValidateModal && selectedHoliday && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#282828] rounded-2xl p-6 w-full max-w-md border border-[#383838]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Validation du jour férié</h2>
              <button onClick={() => setShowValidateModal(false)} className="text-[#b3b3b3] hover:text-white"><X size={20} /></button>
            </div>
            <div className="bg-[#181818] rounded-xl p-4 mb-6 border border-[#383838]">
              <h3 className="font-semibold">{selectedHoliday.holiday_name}</h3>
              <p className="text-sm text-[#b3b3b3] mt-1">
                {new Date(selectedHoliday.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <p className="text-lg font-medium mb-4 text-center">L'équipe a travaillé ?</p>
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1">Commentaire</label>
              <textarea value={validateComment} onChange={(e) => setValidateComment(e.target.value)}
                className="w-full bg-[#181818] border border-[#383838] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#1DB954] resize-none mb-4" rows={2}
                placeholder="Ajouter un commentaire (optionnel)" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleValidate(false)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full font-medium transition-colors">
                <X size={18} /> Non
              </button>
              <button onClick={() => handleValidate(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1DB954]/20 hover:bg-[#1DB954]/30 text-[#1DB954] rounded-full font-medium transition-colors">
                <Check size={18} /> Oui
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
