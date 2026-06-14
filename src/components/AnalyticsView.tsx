import React from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, Flame, Dumbbell, Activity, Calendar, Zap, TrendingUp, Sparkles, Scale, Info
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar 
} from 'recharts';
import { WorkoutSession } from '../types';

interface AnalyticsViewProps {
  workouts: WorkoutSession[];
}

export default function AnalyticsView({ workouts }: AnalyticsViewProps) {
  // Prep data for charts
  const getChartData = () => {
    if (workouts.length === 0) return [];
    
    // Sort oldest first
    return [...workouts]
      .reverse()
      .map(w => {
        const d = new Date(w.date);
        return {
          name: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          rawDate: d,
          reps: w.reps,
          calories: w.calories,
          duration: Math.round(w.duration / 60 * 10) / 10, // in minutes
          pace: w.avgPace,
          accuracy: w.formAccuracy
        };
      });
  };

  const chartData = getChartData();

  // Calculation parameters
  const totalReps = workouts.reduce((p, c) => p + c.reps, 0);
  const totalCalories = Math.round(workouts.reduce((p, c) => p + c.calories, 0));
  const maxReps = workouts.length > 0 ? Math.max(...workouts.map(w => w.reps)) : 0;
  const totalMinutes = Math.round(workouts.reduce((p, c) => p + (c.duration / 60), 0));
  const avgAccuracy = workouts.length > 0 
    ? Math.round(workouts.reduce((p, c) => p + c.formAccuracy, 0) / workouts.length) 
    : 0;
  const totalIncorrect = workouts.reduce((p, c) => p + (c.incorrectReps || 0), 0);
  
  // Custom tooltip styles
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/95 p-3 shadow-xl backdrop-blur-md">
          <p className="text-xs font-bold text-zinc-400 mb-1">{label}</p>
          {payload.map((item: any, i: number) => (
            <p key={i} className="text-xs font-black text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}: <span className="text-emerald-400">{item.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl tracking-tight">Performance Analytics</h1>
        <p className="text-zinc-400 text-sm">Visualize your fitness milestones, strength growth cycles, and tracking history.</p>
      </div>

      {workouts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-zinc-500">
            <Activity size={24} />
          </div>
          <p className="text-sm text-zinc-400">Complete at least one fitness session to populate visual graph overlays.</p>
        </div>
      ) : (
        <>
          {/* Quick records cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[10px] font-bold uppercase tracking-wider">Max Session Reps</span>
                <Trophy size={16} className="text-amber-500" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-white">{maxReps}</p>
                <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Highest reps set</p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[10px] font-bold uppercase tracking-wider">Burn Record</span>
                <Zap size={16} className="text-teal-400" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-white">{totalCalories} <span className="text-xs font-normal text-zinc-500">kcal</span></p>
                <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Total energy burned</p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[10px] font-bold uppercase tracking-wider">Exercise Minutes</span>
                <Calendar size={16} className="text-blue-500" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-white">{totalMinutes} <span className="text-xs font-normal text-zinc-500">min</span></p>
                <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Total active tracking</p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[10px] font-bold uppercase tracking-wider">Torso Alignment</span>
                <Activity size={16} className="text-emerald-500" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-emerald-400">{avgAccuracy}%</p>
                <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Good form repetition</p>
              </div>
            </div>
          </div>

          {/* Interactive Charts Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Chart 1: Strength Progression (Reps over time) */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-emerald-500" />
                  Reps Progress History
                </h3>
                <p className="text-[11px] text-zinc-500">Your total push-ups completed per session.</p>
              </div>

              <div className="h-64 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="reps" 
                      name="Reps"
                      stroke="#10b981" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorReps)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Active calories burner trend */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Zap size={16} className="text-teal-400" />
                  Calorie Expenditure
                </h3>
                <p className="text-[11px] text-zinc-500">Calorific load session records based on volume metrics.</p>
              </div>

              <div className="h-64 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="calories" 
                      name="Calories (kcal)"
                      fill="#14b8a6" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Form Breakdown Panel */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Info size={16} className="text-emerald-500" />
              AI Form Insights Checklist
            </h3>

            <div className="grid gap-6 sm:grid-cols-3 text-xs">
              <div className="bg-zinc-950/60 rounded-xl p-4 space-y-2 border border-zinc-800/50">
                <p className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">Alignment Score</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-400">{avgAccuracy}%</span>
                  <span className="text-zinc-500 font-medium">pristine form</span>
                </div>
                <p className="text-zinc-500 leading-relaxed">Your head-to-heel spine alignment stays highly level. Continue maintaining this posture.</p>
              </div>

              <div className="bg-zinc-950/60 rounded-xl p-4 space-y-2 border border-zinc-800/50">
                <p className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">Incomplete Repetitions</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-rose-500">{totalIncorrect}</span>
                  <span className="text-zinc-500 font-medium">reps discarded</span>
                </div>
                <p className="text-zinc-500 leading-relaxed">Reps are discarded when arms don&apos;t lock out fully or when you don&apos;t dip low enough. Prioritize quality over quantity.</p>
              </div>

              <div className="bg-zinc-950/60 rounded-xl p-4 space-y-2 border border-zinc-800/50">
                <p className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">Weekly Velocity</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-teal-400">
                    {Math.round(chartData.length > 0 ? (totalReps / chartData.length) : 0)}
                  </span>
                  <span className="text-zinc-500 font-medium">reps / session</span>
                </div>
                <p className="text-zinc-500 leading-relaxed">Sustained output per tracking interval. Gradual ramp-up (5-10% weekly) secures tissue safety.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
