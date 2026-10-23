const STYLES = {
  pending: "bg-amberlight text-amber border border-amber/30",
  approved: "bg-sagelight text-sage border border-sage/30",
  rejected: "bg-rustlight text-rust border border-rust/30",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono uppercase tracking-wide ${STYLES[status] || "bg-slate-100 text-slate-600"}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
