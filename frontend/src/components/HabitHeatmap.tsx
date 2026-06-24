import React from 'react';

interface ContributionDay {
  date: string;
  count: number;
}

interface HabitHeatmapProps {
  data?: ContributionDay[];
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ data = [] }) => {
  // Generate last 365 days contribution grid
  const generateYearGrid = () => {
    const grid: ContributionDay[][] = [];
    const today = new Date();
    
    // Create a map of existing contribution data for fast lookup
    const dataMap = new Map<string, number>();
    data.forEach(item => {
      dataMap.set(item.date, item.count);
    });

    // Start from 52 weeks ago, aligning with Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay); // Align to Sunday

    // 53 weeks
    for (let w = 0; w < 53; w++) {
      const week: ContributionDay[] = [];
      // 7 days in a week (Sun - Sat)
      for (let d = 0; d < 7; d++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (w * 7) + d);
        
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Mock data logic: if no data supplied, generate semi-random values
        // so it looks premium and populated at first launch
        let count = dataMap.get(dateStr) ?? 0;
        if (data.length === 0) {
          // Deterministic seed-like mock data
          const dayVal = currentDate.getDate() + currentDate.getMonth();
          if (dayVal % 7 === 0) count = Math.floor((dayVal % 5) + 1);
          else if (dayVal % 13 === 0) count = Math.floor((dayVal % 3) + 1);
        }

        week.push({
          date: dateStr,
          count: currentDate > today ? -1 : count // -1 for future days
        });
      }
      grid.push(week);
    }
    return grid;
  };

  const gridData = generateYearGrid();

  // Color mapping based on counts
  const getColorClass = (count: number) => {
    if (count === -1) return 'bg-transparent border-transparent'; // Future
    if (count === 0) return 'bg-[#121215] border-[#1e1e22]';      // None
    if (count <= 2) return 'bg-zinc-800 border-zinc-700';        // Low
    if (count <= 4) return 'bg-zinc-500 border-zinc-400';        // Medium
    return 'bg-white border-white';                              // High
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="mono-panel p-6 select-none">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-heading text-sm font-semibold tracking-wider text-white uppercase">Consistency Matrix</h3>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">365-day task & routine performance index</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
          <span>Less</span>
          <div className="w-2.5 h-2.5 bg-[#121215] border border-[#1e1e22] rounded-sm"></div>
          <div className="w-2.5 h-2.5 bg-zinc-800 border border-zinc-700 rounded-sm"></div>
          <div className="w-2.5 h-2.5 bg-zinc-500 border border-zinc-400 rounded-sm"></div>
          <div className="w-2.5 h-2.5 bg-white border border-white rounded-sm"></div>
          <span>More</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {/* Day of week labels */}
        <div className="grid grid-rows-7 gap-1 pr-1 text-[9px] font-mono text-zinc-500 pt-5">
          {dayLabels.map((label, idx) => (
            <span key={label} className={idx % 2 === 0 ? 'opacity-0' : 'opacity-100'}>
              {label}
            </span>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="flex-1">
          {/* Months label row */}
          <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-2 px-1">
            {months.map((m, i) => (
              <span key={i} className="w-full text-left">{m}</span>
            ))}
          </div>

          <div className="flex gap-1.5">
            {gridData.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5">
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    className={`w-[10px] h-[10px] border rounded-sm transition-all duration-100 group relative ${getColorClass(day.count)}`}
                  >
                    {day.count !== -1 && (
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0c0c0e] border border-zinc-800 text-white text-[9px] font-mono py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl">
                        {day.count} action{day.count !== 1 ? 's' : ''} on {day.date}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
