export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <span className="font-serif text-3xl tracking-tight">{value}</span>
    </div>
  );
}
