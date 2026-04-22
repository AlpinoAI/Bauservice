import { ArrowRight } from "lucide-react";

type Props = {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  label?: string;
};

export function StartCampaignButton({
  disabled = false,
  loading = false,
  onClick,
  label = "Kampagne starten",
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
    >
      {loading ? "Lege an …" : label}
      {!loading && <ArrowRight size={12} />}
    </button>
  );
}
