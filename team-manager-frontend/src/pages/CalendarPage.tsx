import { useState, useEffect } from 'react';
import { holidaysAPI, egyptDutyAPI } from '../services/api';
import { Holiday, MoroccanHolidayInfo, EgyptDuty } from '../types';
import { ChevronLeft, ChevronRight, Sun, Pyramid } from 'lucide-react';

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function CalendarPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [moroccanHolidays, setMoroccanHolidays] = useState<MoroccanHolidayInfo[]>([]);
  const [declaredHolidays, setDeclaredHolidays] = useState<Holiday[]>([]);
  const [egyptDuties, setEgyptDuties] = useState<EgyptDuty[]>([]);

  useEffect(() => { loadData(); }, [year, month]);

  const loadData = async () => {
    try {
      const [mh, dh, ed] = await Promise.all([
        holidaysAPI.getMoroccan(year),
        holidaysAPI.list({ year, month }),
        egyptDutyAPI.list({ year, month }),
      ]);
      setMoroccanHolidays(mh.data);
      setDeclaredHolidays(dh.data);
      setEgyptDuties(ed.data);
    } catch {}
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => {
    const day = new Date(y, m - 1, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const getDateStr = (day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getHolidayInfo = (day: number) => {
    const dateStr = getDateStr(day);
    return moroccanHolidays.find(h => h.date === dateStr);
  };

  const getDeclaredHoliday = (day: number) => {
    const dateStr = getDateStr(day);
    return declaredHolidays.find(h => h.date === dateStr);
  };

  const getEgyptDuty = (day: number) => {
    const dateStr = getDateStr(day);
    return egyptDuties.find(d => d.date === dateStr);
  };

  const isSunday = (day: number) => {
    return new Date(year, month - 1, day).getDay() === 0;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendrier</h1>
        <p className="text-[#b3b3b3] text-sm mt-1">Jours fériés marocains et astreintes Égypte</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between bg-[#181818] rounded-xl p-4 border border-[#282828]">
        <button onClick={prevMonth} className="p-2 hover:bg-[#282828] rounded-lg transition-colors"><ChevronLeft size={20} /></button>
        <h2 className="text-xl font-bold">{MONTH_NAMES[month - 1]} {year}</h2>
        <button onClick={nextMonth} className="p-2 hover:bg-[#282828] rounded-lg transition-colors"><ChevronRight size={20} /></button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#1DB954]" /> Jour Férié (Travaillé)</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> Jour Férié (Non Travaillé)</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Jour Férié (En Attente)</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" /> Astreinte Égypte</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500/30" /> Dimanche</div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#181818] rounded-xl border border-[#282828] overflow-hidden">
        <div className="grid grid-cols-7">
          {DAY_NAMES.map(d => (
            <div key={d} className="py-3 text-center text-sm font-medium text-[#b3b3b3] border-b border-[#282828]">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-[#282828]/30" />;

            const holiday = getHolidayInfo(day);
            const declared = getDeclaredHoliday(day);
            const duty = getEgyptDuty(day);
            const sunday = isSunday(day);
            const today = isToday(day);

            let bgClass = '';
            if (declared) {
              if (declared.worked === true) bgClass = 'bg-[#1DB954]/10 border-[#1DB954]/30';
              else if (declared.worked === false) bgClass = 'bg-red-500/10 border-red-500/30';
              else bgClass = 'bg-yellow-500/10 border-yellow-500/30';
            } else if (holiday) {
              bgClass = 'bg-yellow-500/5';
            } else if (duty) {
              bgClass = 'bg-purple-500/10';
            } else if (sunday) {
              bgClass = 'bg-blue-500/5';
            }

            return (
              <div key={day} className={`min-h-[100px] p-2 border-b border-r border-[#282828]/30 ${bgClass} transition-colors hover:bg-[#282828]/20`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${today ? 'bg-[#1DB954] text-white w-7 h-7 rounded-full flex items-center justify-center' : sunday ? 'text-blue-400' : 'text-[#b3b3b3]'}`}>
                    {day}
                  </span>
                </div>
                <div className="mt-1 space-y-1">
                  {(holiday || declared) && (
                    <div className="flex items-center gap-1">
                      <Sun size={12} className="text-yellow-500 flex-shrink-0" />
                      <span className="text-xs text-yellow-500 truncate">{declared?.holiday_name || holiday?.name}</span>
                    </div>
                  )}
                  {declared && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full inline-block ${
                      declared.worked === true ? 'bg-[#1DB954]/20 text-[#1DB954]' :
                      declared.worked === false ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {declared.worked === true ? 'Travaillé' : declared.worked === false ? 'Non travaillé' : 'En attente'}
                    </span>
                  )}
                  {duty && (
                    <div className="flex items-center gap-1">
                      <Pyramid size={12} className="text-purple-400 flex-shrink-0" />
                      <span className="text-xs text-purple-400">Égypte</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
