import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Award, Trash2, Download, Search, AlertTriangle, ChevronDown, ChevronUp, CheckCircle, Scale } from 'lucide-react';
import { WorkoutSession } from '../types';

interface HistoryViewProps {
  workouts: WorkoutSession[];
  onDeleteSession: (id: string) => void;
}

export default function HistoryView({ workouts, onDeleteSession }: HistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter workouts
  const filteredWorkouts = workouts.filter(w => {
    const dateStr = new Date(w.date).toLocaleDateString();
    const repsStr = w.reps.toString();
    return dateStr.includes(searchTerm) || repsStr.includes(searchTerm);
  });

  // Calculate averages
  const totalReps = workouts.reduce((acc, curr) => acc + curr.reps, 0);
  const avgAccuracy = workouts.length > 0 
    ? Math.round(workouts.reduce((acc, curr) => acc + curr.formAccuracy, 0) / workouts.length) 
    : 0;
  const avgPace = workouts.length > 0 
    ? Math.round((workouts.reduce((acc, curr) => acc + curr.avgPace, 0) / workouts.length) * 10) / 10 
    : 0;

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const exportToCSV = () => {
    if (workouts.length === 0) return;
    
    // Headers
    const headers = ['Date', 'Reps Completed', 'Incorrect Reps', 'Duration (Seconds)', 'Calories (kcal)', 'Pace (Reps/Min)', 'Form Accuracy (%)'];
    
    // Rows
    const rows = workouts.map(w => [
      new Date(w.date).toISOString().replace('T', ' ').substring(0, 19),
      w.reps,
      w.incorrectReps || 0,
      w.duration,
      w.calories,
      w.avgPace,
      w.formAccuracy
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = `pushup_tracker_ai_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header and CSV Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl tracking-tight">Workout History</h1>
          <p className="text-zinc-400 text-sm">Review logs of your completed workouts, review warnings details and export data.</p>
        </div>

        {workouts.length > 0 && (
          <button
            onClick={exportToCSV}
            id="btn-export-csv"
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-4.5 py-3 text-xs font-bold text-white transition-all active:scale-98 cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Download size={15} />
            Export to CSV
          </button>
        )}
      </div>

      {workouts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-zinc-500">
            <Calendar size={24} />
          </div>
          <p className="text-sm text-zinc-400">No workout records found. Place your camera and do some push-ups!</p>
        </div>
      ) : (
        <>
          {/* Metrics Summary banner */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-zinc-950/40 border border-zinc-800 p-4 text-center">
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Reps</p>
              <p className="text-lg font-black text-white mt-0.5">{totalReps}</p>
            </div>
            <div className="border-x border-zinc-800/80">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Avg Accuracy</p>
              <p className="text-lg font-black text-emerald-400 mt-0.5">{avgAccuracy}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Avg Pace</p>
              <p className="text-lg font-black text-teal-400 mt-0.5">{avgPace} RPM</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
            <input
              type="text"
              id="search-history-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by date or repetition count..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-11 py-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Workout Logs List */}
          <div className="space-y-3">
            {filteredWorkouts.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-4">No results match your search keywords.</p>
            ) : (
              filteredWorkouts.map((workout) => {
                const isExpanded = expandedId === workout.id;
                
                return (
                  <div 
                    key={workout.id} 
                    className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors"
                  >
                    {/* Header bar / Main info */}
                    <div 
                      onClick={() => toggleExpand(workout.id)}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                          <span className="text-sm font-black">{workout.reps}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{formatDate(workout.date)}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 font-medium">
                            <span className="flex items-center gap-1"><Clock size={13} /> {formatDuration(workout.duration)}</span>
                            <span>•</span>
                            <span>{workout.calories} kcal</span>
                            <span>•</span>
                            <span className={workout.formAccuracy >= 80 ? 'text-emerald-500' : 'text-amber-500'}>
                              {workout.formAccuracy}% accuracy
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Delete button (prevent expanding when clicking delete) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(workout.id);
                          }}
                          id={`btn-delete-session-${workout.id}`}
                          className="rounded-lg p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer"
                          title="Delete workout"
                        >
                          <Trash2 size={16} />
                        </button>
                        
                        {/* Chevron Trigger */}
                        <div className="text-zinc-400">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable details panel */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-zinc-800/80 bg-zinc-950/40 px-5 py-4"
                        >
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
                            <div className="space-y-1">
                              <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Average Pace</p>
                              <p className="text-sm font-bold text-white">{workout.avgPace} reps/min</p>
                            </div>
                            
                            <div className="space-y-1">
                              <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Wrong Form Reps</p>
                              <p className="text-sm font-bold text-red-400">{workout.incorrectReps || 0} reps</p>
                            </div>

                            <div className="space-y-1">
                              <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Successful Reps</p>
                              <p className="text-sm font-bold text-emerald-400">{workout.reps} reps</p>
                            </div>

                            <div className="space-y-1">
                              <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Pristine form ratio</p>
                              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-1.5 rounded-full" 
                                  style={{ width: `${workout.formAccuracy}%` }} 
                                />
                              </div>
                            </div>
                          </div>

                          {/* Warning triggers list */}
                          {workout.warningsCount && Object.keys(workout.warningsCount).length > 0 && (
                            <div className="mt-4 border-t border-zinc-800/50 pt-3">
                              <h4 className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 mb-2">
                                <AlertTriangle size={13} className="text-amber-500" />
                                Form issues Flagged during workout:
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(workout.warningsCount).map(([warning, count]) => (
                                  <div 
                                    key={warning} 
                                    className="flex items-center gap-1.5 rounded-full bg-amber-500/5 border border-amber-500/10 px-3 py-1 text-xs text-amber-300"
                                  >
                                    <span className="font-semibold">{warning}</span>
                                    <span className="rounded-full bg-amber-500/25 px-1.5 py-0.2 text-[10px] font-black text-white">{count}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
