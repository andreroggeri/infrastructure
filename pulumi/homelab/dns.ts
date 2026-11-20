import * as cloudflare from "@pulumi/cloudflare";
import { cloudflareZoneIds } from "../shared";

// roggeri.com.br DNS. *.local points at the LAN (NAS); home/plex go through the Cloudflare Tunnel.
export const localWildcardRecord = new cloudflare.DnsRecord("dns-a-local-roggeri-com-br", {
    content: "192.168.15.4",
    name: "*.local.roggeri.com.br",
    ttl: 1,
    type: "A",
    zoneId: cloudflareZoneIds.roggeriComBr,
}, {
    protect: true,
});

export const homeAssistantRecord = new cloudflare.DnsRecord("dns-cname-home-roggeri-com-br", {
    content: "2013896f-5ba1-45e7-99ae-b716a03befb9.cfargotunnel.com",
    name: "home.roggeri.com.br",
    proxied: true,
    ttl: 1,
    type: "CNAME",
    zoneId: cloudflareZoneIds.roggeriComBr,
}, {
    protect: true,
});

export const plexRecord = new cloudflare.DnsRecord("dns-cname-plex-roggeri-com-br", {
    content: "2013896f-5ba1-45e7-99ae-b716a03befb9.cfargotunnel.com",
    name: "plex.roggeri.com.br",
    proxied: true,
    ttl: 1,
    type: "CNAME",
    zoneId: cloudflareZoneIds.roggeriComBr,
}, {
    protect: true,
});

// Cloudflare Email Routing (MX, SPF, DKIM) and Google site verification.
export const emailRoutingMx1 = new cloudflare.DnsRecord("dns-mx-roggeri-com-br", {
    content: "route3.mx.cloudflare.net",
    name: "roggeri.com.br",
    priority: 80,
    ttl: 1,
    type: "MX",
    zoneId: cloudflareZoneIds.roggeriComBr,
}, {
    protect: true,
});

export const emailRoutingMx2 = new cloudflare.DnsRecord("dns-mx-roggeri-com-br-2", {
    content: "route2.mx.cloudflare.net",
    name: "roggeri.com.br",
    priority: 16,
    ttl: 1,
    type: "MX",
    zoneId: cloudflareZoneIds.roggeriComBr,
}, {
    protect: true,
});

export const emailRoutingMx3 = new cloudflare.DnsRecord("dns-mx-roggeri-com-br-3", {
    content: "route1.mx.cloudflare.net",
    name: "roggeri.com.br",
    priority: 23,
    ttl: 1,
    type: "MX",
    zoneId: cloudflareZoneIds.roggeriComBr,
}, {
    protect: true,
});

export const emailRoutingSpf = new cloudflare.DnsRecord("dns-txt-roggeri-com-br-2", {
    content: "\"v=spf1 include:_spf.mx.cloudflare.net ~all\"",
    name: "roggeri.com.br",
    ttl: 1,
    type: "TXT",
    zoneId: cloudflareZoneIds.roggeriComBr,
}, {
    protect: true,
});

export const emailRoutingDkim = new cloudflare.DnsRecord("dns-txt-cf2024-1-domainkey-roggeri-com-br", {
    content: "\"v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiweykoi+o48IOGuP7GR3X0MOExCUDY/BCRHoWBnh3rChl7WhdyCxW3jgq1daEjPPqoi7sJvdg5hEQVsgVRQP4DcnQDVjGMbASQtrY4WmB1VebF+RPJB2ECPsEDTpeiI5ZyUAwJaVX7r6bznU67g7LvFq35yIo4sdlmtZGV+i0H4cpYH9+3JJ78k\" \"m4KXwaf9xUJCWF6nxeD+qG6Fyruw1Qlbds2r85U9dkNDVAS3gioCvELryh1TxKGiVTkg4wqHTyHfWsp7KD3WQHYJn0RyfJJu6YEmL77zonn7p2SRMvTMP3ZEXibnC9gz3nnhR6wcYL8Q7zXypKTMD58bTixDSJwIDAQAB\"",
    name: "cf2024-1._domainkey.roggeri.com.br",
    ttl: 1,
    type: "TXT",
    zoneId: cloudflareZoneIds.roggeriComBr,
}, {
    protect: true,
});

export const googleSiteVerification = new cloudflare.DnsRecord("dns-txt-roggeri-com-br", {
    content: "\"google-site-verification=tdQhkYQmPOCJHueG3IAGxdBQHIzGYXgzHtzTAos465M\"",
    name: "roggeri.com.br",
    ttl: 3600,
    type: "TXT",
    zoneId: cloudflareZoneIds.roggeriComBr,
}, {
    protect: true,
});
