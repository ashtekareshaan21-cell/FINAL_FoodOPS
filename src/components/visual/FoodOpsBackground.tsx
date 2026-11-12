interface FoodOpsBackgroundProps {
  variant?: 'hero' | 'auth' | 'dashboard' | 'admin';
}

export default function FoodOpsBackground({ variant = 'dashboard' }: FoodOpsBackgroundProps) {
  const accentClass =
    variant === 'hero'
      ? 'from-emerald-100/40 via-[#f8faf9] to-[#f8faf9]'
      : variant === 'auth'
      ? 'from-emerald-50/50 via-[#f8faf9] to-slate-100/40'
      : 'from-slate-50 via-[#f8faf9] to-[#f8faf9]';

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 -z-50 overflow-hidden pointer-events-none select-none bg-gradient-to-b ${accentClass}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(11,60,38,0.06),_transparent_60%)]" />
    </div>
  );
}
