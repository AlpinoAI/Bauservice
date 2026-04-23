import { Badge } from "@/components/ui/badge";
import type { Recipient } from "@/lib/types";

type Props = {
  rollen: Recipient["rollen"];
  /** "compact" zeigt nur Anfangsbuchstaben mit Tooltip — passt in schmale Zellen. */
  variant?: "full" | "compact";
};

export function RollenBadges({ rollen, variant = "full" }: Props) {
  if (variant === "compact") {
    return (
      <>
        {rollen.anbieter && (
          <Badge variant="blue" title="Anbieter">
            A
          </Badge>
        )}
        {rollen.kunde && (
          <Badge variant="green" title="Kunde">
            K
          </Badge>
        )}
        {rollen.ausschreiber && (
          <Badge variant="amber" title="Ausschreiber">
            AS
          </Badge>
        )}
      </>
    );
  }
  return (
    <>
      {rollen.anbieter && <Badge variant="blue">Anbieter</Badge>}
      {rollen.kunde && <Badge variant="green">Kunde</Badge>}
      {rollen.ausschreiber && <Badge variant="amber">Ausschreiber</Badge>}
    </>
  );
}
