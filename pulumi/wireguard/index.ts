import * as cloudflare from "@pulumi/cloudflare";
import { roggeriZoneId } from "../shared";

// WireGuard VPN endpoint. TODO: import the server itself.
export const dns_a_wg_roggeri_com_br = new cloudflare.DnsRecord("dns-a-wg-roggeri-com-br", {
    content: "204.216.165.63",
    name: "wg.roggeri.com.br",
    ttl: 1,
    type: "A",
    zoneId: roggeriZoneId,
}, {
    protect: true,
});
