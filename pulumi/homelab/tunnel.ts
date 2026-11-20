import * as cloudflare from "@pulumi/cloudflare";
import { accountId } from "../shared";

// Cloudflare Tunnel: routes the public hostnames into the cluster.
export const tunnel_home = new cloudflare.ZeroTrustTunnelCloudflared("tunnel-home", {
    accountId,
    configSrc: "cloudflare",
    name: "Home Network Tunnel",
}, {
    protect: true,
});

export const tunnel_home_config = new cloudflare.ZeroTrustTunnelCloudflaredConfig("tunnel-home-config", {
    accountId,
    config: {
        ingresses: [
            {
                hostname: "plex.roggeri.com.br",
                service: "http://plex.plex.svc.cluster.local:32400",
            },
            {
                hostname: "home.roggeri.com.br",
                service: "https://home.local.roggeri.com.br",
            },
            {
                service: "http_status:404",
            },
        ],
    },
    source: "cloudflare",
    tunnelId: tunnel_home.id,
}, {
    protect: true,
});
