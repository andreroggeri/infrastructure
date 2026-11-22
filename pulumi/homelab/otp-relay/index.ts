import * as fs from "fs";
import * as path from "path";
import * as cloudflare from "@pulumi/cloudflare";
import * as random from "@pulumi/random";
import { cloudflareAccountId, cloudflareZoneIds } from "../../shared";

// otp-relay: login scripts can't read my inbox, so Gmail filters forward
// one-time-code emails to otp-<name>@roggeri.com.br. This Worker keeps the
// latest one for 10 minutes and serves it at https://otp.roggeri.com.br/codes/<name>
// to callers with the token. See worker.js for the API.

// One address per service that emails codes. Adding a name adds otp-<name>@.
const mailboxes = ["superlogica"];

export const otpRelayHostname = "otp.roggeri.com.br";

const codes = new cloudflare.WorkersKvNamespace("otp-relay-codes", {
    accountId: cloudflareAccountId,
    title: "otp-relay-codes",
});

// Bearer token for GET /codes/<name>. Read it with:
//   pulumi stack output otpRelayToken --show-secrets
const token = new random.RandomPassword("otp-relay-token", { length: 40, special: false });
export const otpRelayToken = token.result;

const worker = new cloudflare.WorkersScript("otp-relay", {
    accountId: cloudflareAccountId,
    scriptName: "otp-relay",
    content: fs.readFileSync(path.join(__dirname, "worker.js"), "utf8"),
    mainModule: "worker.js",
    compatibilityDate: "2026-11-01",
    bindings: [
        { name: "CODES", type: "kv_namespace", namespaceId: codes.id },
        { name: "TOKEN", type: "secret_text", text: token.result },
    ],
    observability: { enabled: true },
});

new cloudflare.WorkersCustomDomain("otp-relay-domain", {
    accountId: cloudflareAccountId,
    zoneId: cloudflareZoneIds.roggeriComBr,
    hostname: otpRelayHostname,
    service: worker.scriptName,
});

for (const name of mailboxes) {
    new cloudflare.EmailRoutingRule(`otp-relay-${name}`, {
        zoneId: cloudflareZoneIds.roggeriComBr,
        name: `otp-${name} → otp-relay Worker`,
        enabled: true,
        matchers: [{ type: "literal", field: "to", value: `otp-${name}@roggeri.com.br` }],
        actions: [{ type: "worker", values: [worker.scriptName] }],
    });
}

export const otpRelayAddresses = mailboxes.map((n) => `otp-${n}@roggeri.com.br`);
