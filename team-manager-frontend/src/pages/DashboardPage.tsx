import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { DashboardStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Calendar, Pyramid, DollarSign, TrendingUp, Award } from 'lucide-react';

const COLORS = ['#1DB954', '#1ed760', '#169c46', '#0f7a35', '#b3b3b3', '#666', '#444', '#333'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [year]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.stats(year);
      setStats(res.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Jours Fériés Déclarés', value: stats.total_holidays_declared, icon: Calendar, color: '#1DB954' },
    { label: 'Jours Travaillés', value: stats.worked_holidays, icon: Award, color: '#1ed760' },
    { label: 'Astreintes Égypte', value: stats.total_egypt_duties, icon: Pyramid, color: '#f59e0b' },
    { label: 'Total Paiements', value: `${stats.total_payments.toLocaleString()} DH`, icon: DollarSign, color: '#ef4444' },
    { label: 'Membres Actifs', value: `${stats.active_members}/${stats.total_members}`, icon: Users, color: '#8b5cf6' },
    { label: 'Paiements Fériés', value: `${stats.total_holiday_payments.toLocaleString()} DH`, icon: TrendingUp, color: '#06b6d4' },
  ];

  const pieData = [
    { name: 'Jours Fériés', value: stats.total_holiday_payments },
    { name: 'Astreinte Égypte', value: stats.total_egypt_payments },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tableau de Bord</h1>
          <p className="text-[#b3b3b3] text-sm mt-1">Vue d'ensemble des activités</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-[#282828] border border-[#383838] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#1DB954]"
        >
          {Array.from({ length: 7 }, (_, i) => 2024 + i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-[#181818] rounded-xl p-5 border border-[#282828] hover:border-[#383838] transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#b3b3b3] text-sm">{card.label}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.color + '20' }}>
                  <Icon size={24} style={{ color: card.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly bar chart */}
        <div className="bg-[#181818] rounded-xl p-5 border border-[#282828]">
          <h3 className="text-lg font-semibold mb-4">Paiements Mensuels ({year})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthly_totals}>
              <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
              <XAxis dataKey="month_name" stroke="#b3b3b3" fontSize={12} />
              <YAxis stroke="#b3b3b3" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#282828', border: '1px solid #383838', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="holiday_total" name="Jours Fériés" fill="#1DB954" radius={[4, 4, 0, 0]} />
              <Bar dataKey="egypt_total" name="Astreinte Égypte" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-[#181818] rounded-xl p-5 border border-[#282828]">
          <h3 className="text-lg font-semibold mb-4">Répartition des Paiements</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value.toLocaleString()} DH`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#282828', border: '1px solid #383838', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-[#b3b3b3]">Aucune donnée</div>
          )}
        </div>
      </div>

      {/* Member totals */}
      <div className="bg-[#181818] rounded-xl p-5 border border-[#282828]">
        <h3 className="text-lg font-semibold mb-4">Totaux par Membre</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#282828]">
                <th className="text-left py-3 px-4 text-[#b3b3b3] text-sm font-medium">Membre</th>
                <th className="text-left py-3 px-4 text-[#b3b3b3] text-sm font-medium">Statut</th>
                <th className="text-right py-3 px-4 text-[#b3b3b3] text-sm font-medium">Jours Fériés</th>
                <th className="text-right py-3 px-4 text-[#b3b3b3] text-sm font-medium">Astreinte Égypte</th>
                <th className="text-right py-3 px-4 text-[#b3b3b3] text-sm font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.member_totals.map((m) => (
                <tr key={m.member_id} className="border-b border-[#282828]/50 hover:bg-[#282828]/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{m.member_name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.status === 'active' ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-red-500/20 text-red-400'}`}>
                      {m.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">{m.holiday_total.toLocaleString()} DH</td>
                  <td className="py-3 px-4 text-right">{m.egypt_total.toLocaleString()} DH</td>
                  <td className="py-3 px-4 text-right font-bold text-[#1DB954]">{m.total.toLocaleString()} DH</td>
                </tr>
              ))}
              {stats.member_totals.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-[#b3b3b3]">Aucun membre</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
