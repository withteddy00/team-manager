import { useState } from 'react';
import { exportsAPI } from '../services/api';
import { Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';

export default function ExportsPage() {
  const [filters, setFilters] = useState({
    event_type: '',
    date_from: '',
    date_to: '',
    month: '',
    year: String(new Date().getFullYear()),
  });
  const [exporting, setExporting] = useState('');

  const buildParams = () => {
    const params: any = {};
    if (filters.event_type) params.event_type = filters.event_type;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.month) params.month = Number(filters.month);
    if (filters.year) params.year = Number(filters.year);
    return params;
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportExcel = async () => {
    setExporting('excel');
    try {
      const res = await exportsAPI.excel(buildParams());
      downloadFile(res.data, 'historique.xlsx');
    } catch {} finally { setExporting(''); }
  };

  const exportPDF = async () => {
    setExporting('pdf');
    try {
      const res = await exportsAPI.pdf(buildParams());
      downloadFile(res.data, 'historique.pdf');
    } catch {} finally { setExporting(''); }
  };

  const monthNames = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exports</h1>
        <p className="text-[#b3b3b3] text-sm mt-1">Exportez l'historique en PDF ou Excel</p>
      </div>

      {/* Filters */}
      <div className="bg-[#181818] rounded-xl p-5 border border-[#282828]">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-[#1DB954]" />
          <h3 className="font-semibold">Filtres d'export</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-[#b3b3b3] mb-1">Type d'événement</label>
            <select value={filters.event_type} onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
              className="w-full bg-[#282828] border border-[#383838] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#1DB954]">
              <option value="">Tous les types</option>
              <option value="holiday">Jours Fériés</option>
              <option value="egypt_duty">Astreinte Égypte</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#b3b3b3] mb-1">Mois</label>
            <select value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="w-full bg-[#282828] border border-[#383838] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#1DB954]">
              <option value="">Tous les mois</option>
              {monthNames.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#b3b3b3] mb-1">Année</label>
            <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full bg-[#282828] border border-[#383838] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#1DB954]">
              <option value="">Toutes les années</option>
              {Array.from({ length: 7 }, (_, i) => 2024 + i).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#b3b3b3] mb-1">Date début</label>
            <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="w-full bg-[#282828] border border-[#383838] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#1DB954]" />
          </div>
          <div>
            <label className="block text-sm text-[#b3b3b3] mb-1">Date fin</label>
            <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="w-full bg-[#282828] border border-[#383838] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#1DB954]" />
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={exportExcel}
          disabled={exporting === 'excel'}
          className="bg-[#181818] rounded-xl p-8 border border-[#282828] hover:border-[#1DB954] transition-all duration-200 text-left group disabled:opacity-50"
        >
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileSpreadsheet size={32} className="text-green-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Export Excel</h3>
          <p className="text-[#b3b3b3] text-sm mb-4">Télécharger l'historique au format Excel (.xlsx)</p>
          <div className="flex items-center gap-2 text-[#1DB954] font-medium">
            <Download size={16} />
            <span>{exporting === 'excel' ? 'Génération en cours...' : 'Télécharger'}</span>
          </div>
        </button>

        <button
          onClick={exportPDF}
          disabled={exporting === 'pdf'}
          className="bg-[#181818] rounded-xl p-8 border border-[#282828] hover:border-[#1DB954] transition-all duration-200 text-left group disabled:opacity-50"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText size={32} className="text-red-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Export PDF</h3>
          <p className="text-[#b3b3b3] text-sm mb-4">Télécharger l'historique au format PDF</p>
          <div className="flex items-center gap-2 text-[#1DB954] font-medium">
            <Download size={16} />
            <span>{exporting === 'pdf' ? 'Génération en cours...' : 'Télécharger'}</span>
          </div>
        </button>
      </div>
    </div>
  );
}
