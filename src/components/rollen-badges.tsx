import { Badge } from "@/components/ui/badge";
import type { Recipient } from "@/lib/types";

type Props = {
  rollen: Recipient["rollen"];
};

export function RollenBadges({ rollen }: Props) {
  return (
    <>
      {rollen.anbieter && <Badge variant="blue">Anbieter</Badge>}
      {rollen.kunde && <Badge variant="green">Kunde</Badge>}
      {rollen.ausschreiber && <Badge variant="amber">Ausschreiber</Badge>}
    </>
  );
}
