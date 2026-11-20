import * as cloudflare from "@pulumi/cloudflare";
import { accountId } from "../shared";
import { dns_cname_home_roggeri_com_br, dns_cname_plex_roggeri_com_br } from "./dns";
import { policy_allow_access_from_the_aws_lambda } from "../alexa";

// Cloudflare Access in front of the public hostnames: Brazil only, plus the Alexa Lambda.
export const policy_allow_unauthenticated_access_from_brazil_to_home_assistant = new cloudflare.ZeroTrustAccessPolicy("policy-allow-unauthenticated-access-from-brazil-to-home-assistant", {
    accountId,
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

export const app_plex = new cloudflare.ZeroTrustAccessApplication("app-plex", {
    accountId,
    appLauncherVisible: true,
    destinations: [{
        type: "public",
        uri: dns_cname_plex_roggeri_com_br.name,
    }],
    domain: dns_cname_plex_roggeri_com_br.name,
    name: "Plex",
    policies: [{
        id: policy_allow_unauthenticated_access_from_brazil_to_home_assistant.id,
        precedence: 1,
    }],
    sessionDuration: "24h",
    type: "self_hosted",
}, {
    protect: true,
});

export const policy_allow_unauthenticated_access = new cloudflare.ZeroTrustAccessPolicy("policy-allow-unauthenticated-access", {
    accountId,
    decision: "non_identity",
    includes: [{ everyone: {} }],
    name: "Allow unauthenticated access",
}, {
    protect: true,
});

export const app_home_assistant_oauth = new cloudflare.ZeroTrustAccessApplication("app-home-assistant-oauth", {
    accountId,
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
        id: policy_allow_unauthenticated_access.id,
        precedence: 1,
    }],
    sessionDuration: "1h",
    type: "self_hosted",
}, {
    protect: true,
});

export const app_home_assistant = new cloudflare.ZeroTrustAccessApplication("app-home-assistant", {
    accountId,
    appLauncherVisible: true,
    destinations: [{
        type: "public",
        uri: dns_cname_home_roggeri_com_br.name,
    }],
    domain: dns_cname_home_roggeri_com_br.name,
    name: "Home Assistant",
    policies: [
        {
            id: policy_allow_unauthenticated_access_from_brazil_to_home_assistant.id,
            precedence: 1,
        },
        {
            id: policy_allow_access_from_the_aws_lambda.id,
            precedence: 2,
        },
    ],
    sessionDuration: "1h",
    type: "self_hosted",
}, {
    protect: true,
});

export const policy_blockall = new cloudflare.ZeroTrustAccessPolicy("policy-blockall", {
    accountId,
    decision: "deny",
    includes: [{ everyone: {} }],
    name: "BlockAll",
    sessionDuration: "24h",
}, {
    protect: true,
});
