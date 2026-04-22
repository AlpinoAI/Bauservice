import { Badge } from "@/components/ui/badge";

type Props = {
  kategorien?: string[];
  gewerk?: string;
};

export function KategorienBadges({ kategorien, gewerk }: Props) {
  const labels = kategorien?.length ? kategorien : gewerk ? [gewerk] : [];
  if (labels.length === 0) return <span className="text-zinc-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((k) => (
        <Badge key={k} variant="neutral">
          {k}
        </Badge>
      ))}
    </div>
  );
}
