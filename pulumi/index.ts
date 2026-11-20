import * as cloudflare from "@pulumi/cloudflare";
import "./agendaodonto";

// Imported from Cloudflare on 2026-11-20 (cf-terraforming + pulumi import).
// Everything is protected: Pulumi refuses to delete these unless protect is removed first.
const zoneId = "44208bf0d46843461bf9cb374cdebfa3"; // roggeri.com.br
const accountId = "1d77cf531869bacfabd2888c5fd1ed89";

const dns_a_local_roggeri_com_br = new cloudflare.DnsRecord("dns-a-local-roggeri-com-br", {
    content: "192.168.15.4",
    name: "*.local.roggeri.com.br",
    ttl: 1,
    type: "A",
    zoneId,
}, {
    protect: true,
});
const dns_a_wg_roggeri_com_br = new cloudflare.DnsRecord("dns-a-wg-roggeri-com-br", {
    content: "204.216.165.63",
    name: "wg.roggeri.com.br",
    ttl: 1,
    type: "A",
    zoneId,
}, {
    protect: true,
});
const dns_cname_home_roggeri_com_br = new cloudflare.DnsRecord("dns-cname-home-roggeri-com-br", {
    content: "2013896f-5ba1-45e7-99ae-b716a03befb9.cfargotunnel.com",
    name: "home.roggeri.com.br",
    proxied: true,
    ttl: 1,
    type: "CNAME",
    zoneId,
}, {
    protect: true,
});
const dns_cname_plex_roggeri_com_br = new cloudflare.DnsRecord("dns-cname-plex-roggeri-com-br", {
    content: "2013896f-5ba1-45e7-99ae-b716a03befb9.cfargotunnel.com",
    name: "plex.roggeri.com.br",
    proxied: true,
    ttl: 1,
    type: "CNAME",
    zoneId,
}, {
    protect: true,
});
const dns_mx_roggeri_com_br = new cloudflare.DnsRecord("dns-mx-roggeri-com-br", {
    content: "route3.mx.cloudflare.net",
    name: "roggeri.com.br",
    priority: 80,
    ttl: 1,
    type: "MX",
    zoneId,
}, {
    protect: true,
});
const dns_mx_roggeri_com_br_2 = new cloudflare.DnsRecord("dns-mx-roggeri-com-br-2", {
    content: "route2.mx.cloudflare.net",
    name: "roggeri.com.br",
    priority: 16,
    ttl: 1,
    type: "MX",
    zoneId,
}, {
    protect: true,
});
const dns_mx_roggeri_com_br_3 = new cloudflare.DnsRecord("dns-mx-roggeri-com-br-3", {
    content: "route1.mx.cloudflare.net",
    name: "roggeri.com.br",
    priority: 23,
    ttl: 1,
    type: "MX",
    zoneId,
}, {
    protect: true,
});
const dns_txt_cf2024_1_domainkey_roggeri_com_br = new cloudflare.DnsRecord("dns-txt-cf2024-1-domainkey-roggeri-com-br", {
    content: "\"v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiweykoi+o48IOGuP7GR3X0MOExCUDY/BCRHoWBnh3rChl7WhdyCxW3jgq1daEjPPqoi7sJvdg5hEQVsgVRQP4DcnQDVjGMbASQtrY4WmB1VebF+RPJB2ECPsEDTpeiI5ZyUAwJaVX7r6bznU67g7LvFq35yIo4sdlmtZGV+i0H4cpYH9+3JJ78k\" \"m4KXwaf9xUJCWF6nxeD+qG6Fyruw1Qlbds2r85U9dkNDVAS3gioCvELryh1TxKGiVTkg4wqHTyHfWsp7KD3WQHYJn0RyfJJu6YEmL77zonn7p2SRMvTMP3ZEXibnC9gz3nnhR6wcYL8Q7zXypKTMD58bTixDSJwIDAQAB\"",
    name: "cf2024-1._domainkey.roggeri.com.br",
    ttl: 1,
    type: "TXT",
    zoneId,
}, {
    protect: true,
});
const dns_txt_roggeri_com_br = new cloudflare.DnsRecord("dns-txt-roggeri-com-br", {
    content: "\"google-site-verification=tdQhkYQmPOCJHueG3IAGxdBQHIzGYXgzHtzTAos465M\"",
    name: "roggeri.com.br",
    ttl: 3600,
    type: "TXT",
    zoneId,
}, {
    protect: true,
});
const dns_txt_roggeri_com_br_2 = new cloudflare.DnsRecord("dns-txt-roggeri-com-br-2", {
    content: "\"v=spf1 include:_spf.mx.cloudflare.net ~all\"",
    name: "roggeri.com.br",
    ttl: 1,
    type: "TXT",
    zoneId,
}, {
    protect: true,
});
const policy_allow_unauthenticated_access_from_brazil_to_home_assistant = new cloudflare.ZeroTrustAccessPolicy("policy-allow-unauthenticated-access-from-brazil-to-home-assistant", {
    accountId,
    decision: "non_identity",
    includes: [
        {
            geo: {
                countryCode: "BR",
            },
        },
        {
            geo: {
                countryCode: "ES",
            },
        },
    ],
    name: "Allow unauthenticated access from Brazil to home assistant",
}, {
    protect: true,
});
const app_plex = new cloudflare.ZeroTrustAccessApplication("app-plex", {
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
const policy_allow_unauthenticated_access = new cloudflare.ZeroTrustAccessPolicy("policy-allow-unauthenticated-access", {
    accountId,
    decision: "non_identity",
    includes: [{ everyone: {} }],
    name: "Allow unauthenticated access",
}, {
    protect: true,
});
const app_home_assistant_oauth = new cloudflare.ZeroTrustAccessApplication("app-home-assistant-oauth", {
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

const service_token_alexa_lambda = new cloudflare.ZeroTrustAccessServiceToken("service-token-alexa-lambda", {
    accountId,
    // Expires yearly. Refresh it in Zero Trust (Access → Service auth) before it lapses, or Alexa breaks.
    duration: "8760h",
    enabled: true,
    name: "Alexa Skill Lambda",
}, {
    protect: true,
});
const policy_allow_access_from_the_aws_lambda = new cloudflare.ZeroTrustAccessPolicy("policy-allow-access-from-the-aws-lambda", {
    accountId,
    decision: "non_identity",
    includes: [{
        serviceToken: {
            tokenId: service_token_alexa_lambda.id,
        },
    }],
    name: "Allow access from the AWS Lambda",
}, {
    protect: true,
});
const app_home_assistant = new cloudflare.ZeroTrustAccessApplication("app-home-assistant", {
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
const policy_blockall = new cloudflare.ZeroTrustAccessPolicy("policy-blockall", {
    accountId,
    decision: "deny",
    includes: [{ everyone: {} }],
    name: "BlockAll",
    sessionDuration: "24h",
}, {
    protect: true,
});

// Cloudflare Tunnel: routes the public hostnames into the cluster.
const tunnel_home = new cloudflare.ZeroTrustTunnelCloudflared("tunnel-home", {
    accountId,
    configSrc: "cloudflare",
    name: "Home Network Tunnel",
}, {
    protect: true,
});
const tunnel_home_config = new cloudflare.ZeroTrustTunnelCloudflaredConfig("tunnel-home-config", {
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
