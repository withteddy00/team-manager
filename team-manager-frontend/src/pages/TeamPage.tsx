import React, { useState, useEffect } from 'react';
import { teamAPI } from '../services/api';
import { TeamMember } from '../types';
import { useAuth } from '../context/AuthContext';
import { Search, Edit2, Trash2, ToggleLeft, ToggleRight, X, UserPlus } from 'lucide-react';

export default function TeamPage() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({ full_name: '', position: '', phone: '', email: '', status: 'active' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadMembers(); }, [search, statusFilter]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await teamAPI.list(search || undefined, statusFilter || undefined);
      setMembers(res.data);
    } catch {} finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditMember(null);
    setForm({ full_name: '', position: '', phone: '', email: '', status: 'active' });
    setShowModal(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditMember(m);
    setForm({ full_name: m.full_name, position: m.position || '', phone: m.phone || '', email: m.email || '', status: m.status });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editMember) {
        await teamAPI.update(editMember.id, form);
      } else {
        await teamAPI.create(form);
      }
      setShowModal(false);
      loadMembers();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce membre ?')) return;
    await teamAPI.delete(id);
    loadMembers();
  };

  const handleToggle = async (id: number) => {
    await teamAPI.toggleStatus(id);
    loadMembers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion de l'Équipe</h1>
          <p className="text-[#b3b3b3] text-sm mt-1">{members.length} membres</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white px-4 py-2 rounded-full font-medium transition-all">
            <UserPlus size={18} /> Ajouter un membre
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un membre..."
            className="w-full bg-[#282828] border border-[#383838] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-[#1DB954]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#282828] border border-[#383838] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#1DB954]"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#181818] rounded-xl border border-[#282828] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#282828]">
                <th className="text-left py-3 px-4 text-[#b3b3b3] text-sm font-medium">Nom</th>
                <th className="text-left py-3 px-4 text-[#b3b3b3] text-sm font-medium hidden sm:table-cell">Poste</th>
                <th className="text-left py-3 px-4 text-[#b3b3b3] text-sm font-medium hidden md:table-cell">Téléphone</th>
                <th className="text-left py-3 px-4 text-[#b3b3b3] text-sm font-medium hidden md:table-cell">Email</th>
                <th className="text-left py-3 px-4 text-[#b3b3b3] text-sm font-medium">Statut</th>
                {isAdmin && <th className="text-right py-3 px-4 text-[#b3b3b3] text-sm font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-[#282828]/50 hover:bg-[#282828]/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1DB954]/20 flex items-center justify-center text-[#1DB954] font-bold text-sm">
                        {m.full_name.charAt(0)}
                      </div>
                      <span className="font-medium">{m.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#b3b3b3] hidden sm:table-cell">{m.position || '-'}</td>
                  <td className="py-3 px-4 text-[#b3b3b3] hidden md:table-cell">{m.phone || '-'}</td>
                  <td className="py-3 px-4 text-[#b3b3b3] hidden md:table-cell">{m.email || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${m.status === 'active' ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-red-500/20 text-red-400'}`}>
                      {m.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleToggle(m.id)} className="p-2 hover:bg-[#282828] rounded-lg transition-colors" title={m.status === 'active' ? 'Désactiver' : 'Activer'}>
                          {m.status === 'active' ? <ToggleRight size={18} className="text-[#1DB954]" /> : <ToggleLeft size={18} className="text-[#666]" />}
                        </button>
                        <button onClick={() => openEdit(m)} className="p-2 hover:bg-[#282828] rounded-lg transition-colors">
                          <Edit2 size={16} className="text-[#b3b3b3]" />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-2 hover:bg-[#282828] rounded-lg transition-colors">
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {members.length === 0 && !loading && (
                <tr><td colSpan={6} className="py-12 text-center text-[#b3b3b3]">Aucun membre trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#282828] rounded-2xl p-6 w-full max-w-md border border-[#383838]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editMember ? 'Modifier le membre' : 'Nouveau membre'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#b3b3b3] hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1">Nom complet *</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required
                  className="w-full bg-[#181818] border border-[#383838] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#1DB954]" />
              </div>
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1">Poste</label>
                <input type="text" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full bg-[#181818] border border-[#383838] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#1DB954]" />
              </div>
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1">Téléphone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-[#181818] border border-[#383838] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#1DB954]" />
              </div>
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[#181818] border border-[#383838] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#1DB954]" />
              </div>
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1">Statut</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-[#181818] border border-[#383838] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#1DB954]">
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-[#383838] hover:bg-[#444] rounded-full font-medium transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] rounded-full font-medium transition-colors disabled:opacity-50">
                  {saving ? 'Enregistrement...' : editMember ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
