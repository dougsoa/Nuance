import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 lg:p-12 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8 lg:space-y-10 pb-20">
        <div className="space-y-3">
          <div className="h-10 w-64 bg-stone-200 rounded-xl"></div>
          <div className="h-5 w-48 bg-stone-100 rounded-lg"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white border border-stone-100 rounded-[28px] lg:rounded-[32px] p-6 shadow-sm"></div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[400px] bg-white border border-stone-100 rounded-[28px] lg:rounded-[32px] p-6 shadow-sm"></div>
          <div className="h-[400px] bg-white border border-stone-100 rounded-[28px] lg:rounded-[32px] p-6 shadow-sm"></div>
        </div>
      </div>
    </div>
  );
}
