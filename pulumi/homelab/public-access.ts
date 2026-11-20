import * as cloudflare from "@pulumi/cloudflare";
import { cloudflareAccountId } from "../shared";
import { homeAssistantRecord, plexRecord } from "./dns";
import { allowAlexaLambdaPolicy } from "./alexa";

// How Home Assistant and Plex are reachable from the internet:
// Cloudflare Tunnel into the cluster, guarded by Cloudflare Access (Brazil only, plus the Alexa Lambda).

export const homeTunnel = new cloudflare.ZeroTrustTunnelCloudflared("tunnel-home", {
    accountId: cloudflareAccountId,
    configSrc: "cloudflare",
    name: "Home Network Tunnel",
}, {
    protect: true,
});

export const homeTunnelRoutes = new cloudflare.ZeroTrustTunnelCloudflaredConfig("tunnel-home-config", {
    accountId: cloudflareAccountId,
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
    tunnelId: homeTunnel.id,
}, {
    protect: true,
});

// Access policies and apps.
export const allowBrazilPolicy = new cloudflare.ZeroTrustAccessPolicy("policy-allow-unauthenticated-access-from-brazil-to-home-assistant", {
    accountId: cloudflareAccountId,
    decision: "non_identity",
    includes: [
        {
            geo: {
                countryCode: "BR",
            },
        },
    ],
    name: "Allow unauthenticated access from Brazil to home assistant",
}, {
    protect: true,
});

export const allowEveryonePolicy = new cloudflare.ZeroTrustAccessPolicy("policy-allow-unauthenticated-access", {
    accountId: cloudflareAccountId,
    decision: "non_identity",
    includes: [{ everyone: {} }],
    name: "Allow unauthenticated access",
}, {
    protect: true,
});

export const blockAllPolicy = new cloudflare.ZeroTrustAccessPolicy("policy-blockall", {
    accountId: cloudflareAccountId,
    decision: "deny",
    includes: [{ everyone: {} }],
    name: "BlockAll",
    sessionDuration: "24h",
}, {
    protect: true,
});

export const homeAssistantAccessApp = new cloudflare.ZeroTrustAccessApplication("app-home-assistant", {
    accountId: cloudflareAccountId,
    appLauncherVisible: true,
    destinations: [{
        type: "public",
        uri: homeAssistantRecord.name,
    }],
    domain: homeAssistantRecord.name,
    name: "Home Assistant",
    policies: [
        {
            id: allowBrazilPolicy.id,
            precedence: 1,
        },
        {
            id: allowAlexaLambdaPolicy.id,
            precedence: 2,
        },
    ],
    sessionDuration: "1h",
    type: "self_hosted",
}, {
    protect: true,
});

export const homeAssistantOauthAccessApp = new cloudflare.ZeroTrustAccessApplication("app-home-assistant-oauth", {
    accountId: cloudflareAccountId,
    appLauncherVisible: true,
    destinations: [
        {
            type: "public",
            uri: "home.roggeri.com.br/auth/authorize",
        },
        {
            type: "public",
            uri: "home.roggeri.com.br/auth/token",
        },
    ],
    domain: "home.roggeri.com.br/auth/authorize",
    name: "Home Assistant OAuth",
    policies: [{
        id: allowEveryonePolicy.id,
        precedence: 1,
    }],
    sessionDuration: "1h",
    type: "self_hosted",
}, {
    protect: true,
});

export const plexAccessApp = new cloudflare.ZeroTrustAccessApplication("app-plex", {
    accountId: cloudflareAccountId,
    appLauncherVisible: true,
    destinations: [{
        type: "public",
        uri: plexRecord.name,
    }],
    domain: plexRecord.name,
    name: "Plex",
    policies: [{
        id: allowBrazilPolicy.id,
        precedence: 1,
    }],
    sessionDuration: "24h",
    type: "self_hosted",
}, {
    protect: true,
});
