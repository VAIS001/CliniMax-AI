import { useState, useEffect } from 'react';

interface Metric {
  label: string;
  value: number;
  change: string;
  isPositive: boolean;
  icon: string;
  color: string;
}

interface AnalyticsEvent {
  id: string;
  name: string;
  timestamp: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'primary';
}

interface AnalyticsDashboardProps {
  onBack: () => void;
}

export function AnalyticsDashboard({ onBack }: AnalyticsDashboardProps) {
  // Setup metrics state with realistic mock data
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      label: 'Total Users',
      value: 142,
      change: '+12% this week',
      isPositive: true,
      icon: 'group',
      color: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30',
    },
    {
      label: 'Consultations Completed',
      value: 840,
      change: '+28% since last week',
      isPositive: true,
      icon: 'forum',
      color: 'from-[#FF7A00]/20 to-[#FF7A00]/5 text-[#FF7A00] border-[#FF7A00]/30',
    },
    {
      label: 'Templates Uploaded',
      value: 18,
      change: '4 clinical domains active',
      isPositive: true,
      icon: 'article',
      color: 'from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/30',
    },
    {
      label: 'Notes Generated',
      value: 612,
      change: '98.4% AI acceptance rate',
      isPositive: true,
      icon: 'psychology',
      color: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30',
    },
  ]);

  // Setup recent events state representing the analytics_events table
  const [events, setEvents] = useState<AnalyticsEvent[]>([
    {
      id: 'evt-1',
      name: 'consultation_completed',
      timestamp: 'Just now',
      details: 'Consultation completed for Eleanor Vance (triage: URGENT)',
      type: 'success',
    },
    {
      id: 'evt-2',
      name: 'ai_note_generated',
      timestamp: '2 mins ago',
      details: 'Clinical summary generated using Gemini 3.5 Flash',
      type: 'primary',
    },
    {
      id: 'evt-3',
      name: 'template_accessed',
      timestamp: '15 mins ago',
      details: 'Cardiology Intake Template loaded by practitioner',
      type: 'info',
    },
    {
      id: 'evt-4',
      name: 'user_login',
      timestamp: '45 mins ago',
      details: 'Dr. Harper authorized via Secure PIN 7788',
      type: 'info',
    },
    {
      id: 'evt-5',
      name: 'feedback_submitted',
      timestamp: '1 hour ago',
      details: 'Practitioner rated consultation comp-892B: 5/5 stars',
      type: 'success',
    },
  ]);

  // Simulate real-time metric updates/fluctuations to make the dashboard feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly increment some values
      setMetrics((prev) =>
        prev.map((metric) => {
          if (metric.label === 'Consultations Completed' && Math.random() > 0.6) {
            return { ...metric, value: metric.value + 1 };
          }
          if (metric.label === 'Notes Generated' && Math.random() > 0.7) {
            return { ...metric, value: metric.value + 1 };
          }
          return metric;
        })
      );

      // Randomly push a new live event
      if (Math.random() > 0.8) {
        const liveEvents: Array<{ name: string; details: string; type: 'info' | 'success' | 'warning' | 'primary' }> = [
          { name: 'consultation_initiated', details: 'New patient session started in welcome kiosk', type: 'info' },
          { name: 'ai_triage_compiled', details: 'FastAPI clinical model generated triage classification', type: 'primary' },
          { name: 'session_heartbeat', details: 'Supabase connection check active', type: 'info' },
        ];
        const randomEvent = liveEvents[Math.floor(Math.random() * liveEvents.length)];
        
        setEvents((prev) => [
          {
            id: `evt-${Date.now()}`,
            name: randomEvent.name,
            timestamp: 'Just now',
            details: randomEvent.details,
            type: randomEvent.type,
          },
          ...prev.slice(0, 5), // Keep top 6 items
        ]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full text-slate-100 font-sans space-y-8 animate-fade-in">
      {/* Header and Back navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center justify-center p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700/50"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Clinical Workspace Insights
            </h1>
          </div>
          <p className="text-slate-400 text-xs mt-1 pl-11">
            Real-time server analytics, user activities, and engine benchmarks
          </p>
        </div>
        <div className="flex items-center gap-3 pl-11 md:pl-0">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">
            Connected to Supabase Node-EU1
          </span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, i) => (
          <div
            key={i}
            className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 shadow-md transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg ${metric.color}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {metric.label}
                </p>
                <h3 className="text-3xl font-extrabold tracking-tight text-white mt-2">
                  {metric.value.toLocaleString()}
                </h3>
              </div>
              <span className="material-symbols-outlined text-2xl opacity-80">
                {metric.icon}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-xs font-medium">
              <span className="material-symbols-outlined text-sm text-emerald-400">trending_up</span>
              <span className="text-slate-300">{metric.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Activity Chart and Log Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mock Chart: Volume Benchmarks */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800/80 bg-[#0e1322]/80 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-white">Consultation Intake Volume</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Daily triage submissions compiled over the last week</p>
              </div>
              <select className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2.5 py-1.5 outline-none font-medium cursor-pointer">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>

            {/* Custom SVG/HTML Bar Chart */}
            <div className="h-56 flex items-end justify-between gap-4 pt-4 px-2">
              {[
                { day: 'Mon', val: 65, height: 'h-[65%]' },
                { day: 'Tue', val: 82, height: 'h-[82%]' },
                { day: 'Wed', val: 45, height: 'h-[45%]' },
                { day: 'Thu', val: 95, height: 'h-[95%]', active: true },
                { day: 'Fri', val: 70, height: 'h-[70%]' },
                { day: 'Sat', val: 30, height: 'h-[30%]' },
                { day: 'Sun', val: 20, height: 'h-[20%]' },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                  <div className="relative w-full flex items-end justify-center h-full">
                    {/* Tooltip */}
                    <div className="absolute top-[-25px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900 border border-slate-700 text-[10px] text-white px-1.5 py-0.5 rounded font-mono z-20">
                      {item.val}
                    </div>
                    {/* Bar */}
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 cursor-pointer ${
                        item.active
                          ? 'bg-gradient-to-t from-[#FF7A00] to-orange-400'
                          : 'bg-slate-700/60 hover:bg-slate-600/80'
                      } ${item.height}`}
                    ></div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 group-hover:text-white transition-colors">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-800/80 pt-4 mt-6 text-xs text-slate-400">
            <span>Intake Peak: <strong>95 files/day</strong> (Thursday)</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              +18.4% Average Speed
            </span>
          </div>
        </div>

        {/* Live Event Stream representing our database analytics_events */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0e1322]/80 p-6 flex flex-col h-full">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FF7A00] text-lg">history</span>
              Live Event Stream
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Real-time DB analytics_events sync</p>
          </div>

          <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[300px] scrollbar-none pr-1">
            {events.map((event) => {
              let dotColor = 'bg-blue-400';
              if (event.type === 'success') dotColor = 'bg-emerald-400';
              if (event.type === 'warning') dotColor = 'bg-amber-400';
              if (event.type === 'primary') dotColor = 'bg-[#FF7A00]';

              return (
                <div
                  key={event.id}
                  className="flex gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800/50 hover:border-slate-700/50 transition-colors"
                >
                  <div className="flex flex-col items-center pt-1.5">
                    <span className={`h-2 w-2 rounded-full ${dotColor}`}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-mono font-bold text-[#FF7A00] truncate">
                        {event.name}
                      </p>
                      <span className="text-[9px] text-slate-500 whitespace-nowrap font-medium">
                        {event.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 font-medium leading-relaxed">
                      {event.details}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
