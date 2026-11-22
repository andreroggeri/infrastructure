// otp-relay: catches one-time-code emails forwarded to otp-<name>@roggeri.com.br
// and hands the latest one to scripts that log in somewhere (e.g. pombo's
// Superlogica login service).
//
//   GET https://otp.roggeri.com.br/codes/<name>?since=<epoch ms>
//   Authorization: Bearer <token>
//
// 200 {"code","from","subject","receivedAt","text"} for the latest email to
// otp-<name>@ received after `since`; 404 while there is none yet (poll it).
// Emails are kept 10 minutes. `text` is the whole body, so emails without a
// code (like Gmail's forwarding confirmation) can still be read.

const TTL_SECONDS = 600;

export default {
  async email(message, env) {
    const name = mailboxName(message.to);
    const raw = await new Response(message.raw).text();
    const mail = parseEmail(raw);
    const entry = {
      code: findCode(`${mail.subject}\n${mail.text}`),
      from: mail.from,
      subject: mail.subject,
      receivedAt: Date.now(),
      text: mail.text.slice(0, 4000),
    };
    await env.CODES.put(`latest:${name}`, JSON.stringify(entry), { expirationTtl: TTL_SECONDS });
    console.log(`otp-${name}: ${entry.code ? "code found" : "no code"} in "${mail.subject}" from ${mail.from}`);
  },

  async fetch(request, env) {
    if (request.headers.get("Authorization") !== `Bearer ${env.TOKEN}`) {
      return json({ error: "unauthorized" }, 401);
    }
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/codes\/([a-z0-9-]+)$/);
    if (request.method !== "GET" || !m) {
      return json({ error: "use GET /codes/<name>" }, 404);
    }
    const entry = await env.CODES.get(`latest:${m[1]}`, "json");
    const since = Number(url.searchParams.get("since") || 0);
    if (!entry || entry.receivedAt < since) {
      return json({ error: "no email yet" }, 404);
    }
    return json(entry, 200);
  },
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

// "otp-superlogica@roggeri.com.br" -> "superlogica"
export function mailboxName(to) {
  return to.split("@")[0].toLowerCase().replace(/^otp-/, "");
}

// findCode returns the first 4–9 digit number that isn't part of a date,
// time or phone-like run, preferring one next to "código"/"code".
export function findCode(text) {
  const cleaned = text
    .replace(/\d{1,4}[\/.-]\d{1,2}[\/.-]\d{1,4}/g, " ") // dates
    .replace(/\d{1,2}:\d{2}(:\d{2})?/g, " "); // times
  const near = cleaned.match(/(?:c[oó]digo|code|token)[^0-9]{0,40}(\d{4,9})\b/i);
  if (near) return near[1];
  const any = cleaned.match(/(?<![\d+])\b(\d{4,9})\b(?![\d])/);
  return any ? any[1] : null;
}

// parseEmail reads the headers and the readable text of a raw email.
export function parseEmail(raw) {
  const { headers, body } = splitHeaders(raw);
  return {
    from: decodeWords(headers["from"] || ""),
    subject: decodeWords(headers["subject"] || ""),
    text: textOf(headers, body).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim(),
  };
}

function splitHeaders(raw) {
  const sep = raw.search(/\r?\n\r?\n/);
  const head = sep < 0 ? raw : raw.slice(0, sep);
  const body = sep < 0 ? "" : raw.slice(sep).replace(/^\r?\n\r?\n/, "");
  const headers = {};
  for (const line of head.replace(/\r?\n[ \t]+/g, " ").split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) headers[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
  }
  return { headers, body };
}

// textOf prefers text/plain and falls back to text/html without the tags.
function textOf(headers, body) {
  const type = headers["content-type"] || "text/plain";
  const boundary = type.match(/boundary="?([^";]+)"?/i);
  if (/^multipart\//i.test(type) && boundary) {
    const parts = body
      .split(`--${boundary[1]}`)
      .slice(1)
      .filter((p) => !p.startsWith("--"))
      .map((p) => splitHeaders(p.replace(/^\r?\n/, "")));
    const pick = (re) => parts.find((p) => re.test(p.headers["content-type"] || "text/plain"));
    const part = pick(/^text\/plain/i) || pick(/^multipart\//i) || pick(/^text\/html/i);
    return part ? textOf(part.headers, part.body) : "";
  }
  const charset = (type.match(/charset="?([^";]+)"?/i) || [])[1] || "utf-8";
  const text = decodeBody(body, headers["content-transfer-encoding"] || "", charset);
  return /^text\/html/i.test(type) ? htmlToText(text) : text;
}

function decodeBody(body, encoding, charset) {
  let bytes;
  if (/base64/i.test(encoding)) {
    bytes = Uint8Array.from(atob(body.replace(/\s+/g, "")), (c) => c.charCodeAt(0));
  } else if (/quoted-printable/i.test(encoding)) {
    const s = body.replace(/=\r?\n/g, "");
    const out = [];
    for (let i = 0; i < s.length; i++) {
      if (s[i] === "=" && /^[0-9A-F]{2}$/i.test(s.slice(i + 1, i + 3))) {
        out.push(parseInt(s.slice(i + 1, i + 3), 16));
        i += 2;
      } else {
        out.push(s.charCodeAt(i) & 0xff);
      }
    }
    bytes = Uint8Array.from(out);
  } else {
    return body;
  }
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

function htmlToText(html) {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|tr|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

// decodeWords decodes "=?UTF-8?B?...?=" / "=?UTF-8?Q?...?=" in headers.
function decodeWords(s) {
  return s.replace(/=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi, (_, charset, enc, data) => {
    const body = enc.toUpperCase() === "B" ? data : data.replace(/_/g, " ");
    return decodeBody(body, enc.toUpperCase() === "B" ? "base64" : "quoted-printable", charset);
  });
}
