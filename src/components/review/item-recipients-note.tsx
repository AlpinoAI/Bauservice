import { Info } from "lucide-react";

type Props = { total: number };

export function ItemRecipientsNote({ total }: Props) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 text-xs text-blue-900">
      <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />
      <div>
        <div className="font-semibold">
          Empfänger aus automatischem Matching
        </div>
        <p className="mt-0.5 leading-snug text-blue-800/90">
          Für diese Kampagne wurden <strong>{total} passende Empfänger</strong>{" "}
          aus dem Netzwerk vorgeschlagen. Bei 37.000 Kontakten in der Datenbank
          wäre eine manuelle Auswahl nicht praktikabel — die Empfängerliste
          kommt daher direkt aus der Matching-API. Pro Empfänger kannst du unten
          Details anpassen oder einzelne Empfänger vom Versand streichen.
        </p>
      </div>
    </div>
  );
}
