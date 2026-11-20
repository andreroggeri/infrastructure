import * as cloudflare from "@pulumi/cloudflare";

// agendaodonto.com: separate project, not homelab. DNS only.
const zoneId = "826505f342dd094e3817c3a8af3cc354";

export const agendaodonto_a_wildcard = new cloudflare.DnsRecord("agendaodonto-a-wildcard", {
    content: "204.216.135.129",
    name: "*.agendaodonto.com",
    ttl: 1,
    type: "A",
    zoneId,
}, {
    protect: true,
});
export const agendaodonto_a_root = new cloudflare.DnsRecord("agendaodonto-a-root", {
    content: "199.36.158.100",
    name: "agendaodonto.com",
    ttl: 1,
    type: "A",
    zoneId,
}, {
    protect: true,
});
export const agendaodonto_a_wildcard_staging = new cloudflare.DnsRecord("agendaodonto-a-wildcard-staging", {
    content: "134.65.26.46",
    name: "*.staging.agendaodonto.com",
    ttl: 1,
    type: "A",
    zoneId,
}, {
    protect: true,
});
export const agendaodonto_a_staging = new cloudflare.DnsRecord("agendaodonto-a-staging", {
    content: "199.36.158.100",
    name: "staging.agendaodonto.com",
    ttl: 1,
    type: "A",
    zoneId,
}, {
    protect: true,
});
export const agendaodonto_txt_google_verification = new cloudflare.DnsRecord("agendaodonto-txt-google-verification", {
    content: "google-site-verification=rW-Q06WUaYpVfjgnoipfCVd9WI3IYaFphJx28iXHMpw",
    name: "agendaodonto.com",
    ttl: 1,
    type: "TXT",
    zoneId,
}, {
    protect: true,
});
