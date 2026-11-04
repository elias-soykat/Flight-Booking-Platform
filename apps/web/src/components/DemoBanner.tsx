import { AlertTriangle } from 'lucide-react';
import { MOCK_DEMO_NOTICE } from '@travel-platform/shared';

export const DemoBanner = () => {
  return (
    <div
      role="alert"
      className="bg-amber-500 text-slate-950 font-semibold px-4 py-2 text-center text-sm flex items-center justify-center gap-2 shadow-sm border-b border-amber-600"
    >
      <AlertTriangle className="w-4 h-4 text-slate-950 flex-shrink-0" />
      <span>
        <strong className="underline decoration-slate-950/40 mr-1.5">[DEMO / MOCK]</strong>
        {MOCK_DEMO_NOTICE}
      </span>
    </div>
  );
};
