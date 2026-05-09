import React from 'react';

export default function AlertsPage() {
  return (
    <div className="flex-grow flex items-center justify-center bg-[#0a0a0f] p-10">
      <div className="text-center space-y-2">
        <p className="text-slate-600 font-bold italic text-lg uppercase tracking-tight">No alerts yet</p>
        <div className="w-12 h-1 bg-white/5 mx-auto rounded-full" />
      </div>
    </div>
  );
}
