#!/usr/bin/env python3
"""
Salao de Festas auto-booker (Superlogica Area do Condomino).

The booking window is server-enforced (a date opens exactly 90 days before it) and
the reservation grid is rendered client-side, so there is no clean read-only
availability API. Detection therefore IS the booking attempt: we POST /put and read
the response. Before a date opens the server returns "A area ainda nao esta
disponivel para reservas."; the instant it opens the POST succeeds.

Modes:
  once   - login, report whether the target is within its 90-day window by local
           date math (no writes). Heartbeat to catch auth breakage before the day.
  probe  - poll /put until it succeeds, log the exact open moment, then CANCEL it.
           Used against a throwaway date to pin the open time. Books then cancels.
  watch  - poll /put until it succeeds, then keep it and notify. The real run.

Config via env vars (see README). Stops and alerts on 401/403/429 (no hammering).
"""
import json
import os
import sys
import time
import unicodedata
import urllib.parse
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import requests

BASE_DEFAULT = "https://kpgadministrado.superlogica.net"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36")
WINDOW_DAYS = 90
# Server not-open message is "A area ainda nao esta disponivel para reservas."
# (with accents). We accent-strip before matching, so keep markers ASCII. This also
# keeps this file 100% ASCII, which matters: Helm .Files.Get truncates at the first
# non-ASCII byte when embedding the script into a ConfigMap.
NOT_OPEN_MARKERS = ("ainda nao esta disponivel", "nao esta disponivel")


@dataclass
class Config:
    base: str
    email: str
    senha: str
    condo_id: str
    unit_id: str
    area_id: str
    target_date: str      # MM/DD/YYYY, matches the site's DT_RESERVA_RES
    nome_area: str
    apprise_urls: str
    poll_interval: float
    deadline_seconds: int
    cancel_reason: str


def load_config() -> Config:
    def req(name: str) -> str:
        v = os.environ.get(name)
        if not v:
            sys.exit(f"missing required env {name}")
        return v

    return Config(
        base=os.environ.get("BASE_URL", BASE_DEFAULT).rstrip("/"),
        email=req("SUPERLOGICA_EMAIL"),
        senha=req("SUPERLOGICA_SENHA"),
        condo_id=os.environ.get("CONDO_ID", "58"),
        unit_id=os.environ.get("UNIT_ID", "6471"),
        area_id=os.environ.get("AREA_ID", "766"),
        target_date=req("TARGET_DATE"),
        nome_area=os.environ.get("NOME_AREA", "SALAO DE FESTAS - 10H as 24hH"),
        apprise_urls=os.environ.get("APPRISE_URLS", ""),
        poll_interval=float(os.environ.get("POLL_INTERVAL_SECONDS", "3")),
        deadline_seconds=int(os.environ.get("DEADLINE_SECONDS", "3600")),
        cancel_reason=os.environ.get("CANCEL_REASON", "cancelamento automatico"),
    )


LOG_TZ = os.environ.get("LOG_TZ", "America/Sao_Paulo")


def _now():
    try:
        from zoneinfo import ZoneInfo  # needs tzdata on slim images
        return datetime.now(ZoneInfo(LOG_TZ))
    except Exception:
        return datetime.now(timezone.utc)


def log(msg: str) -> None:
    print(f"{_now().isoformat(timespec='seconds')} {msg}", flush=True)


def notify(cfg: Config, title: str, body: str) -> None:
    log(f"NOTIFY {title}: {body}")
    if not cfg.apprise_urls:
        return
    try:
        import apprise
        ap = apprise.Apprise()
        for url in cfg.apprise_urls.split(","):
            url = url.strip()
            if url:
                ap.add(url)
        ap.notify(title=title, body=body)
    except Exception as e:  # notification must never crash the run
        log(f"notify failed: {e}")


class Blocked(Exception):
    """Raised on 401/403/429 so we stop instead of hammering."""


def make_session() -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "User-Agent": UA,
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "*/*",
    })
    return s


def guard(resp: requests.Response) -> None:
    if resp.status_code in (401, 403, 429):
        raise Blocked(f"HTTP {resp.status_code} on {resp.url}")


def login(s: requests.Session, cfg: Config) -> None:
    try:
        s.post(f"{cfg.base}/areadocondomino/atual/publico/verificarcondomino",
               params={"email": cfg.email, "hashemail": ""}, timeout=20)
    except requests.RequestException:
        pass
    resp = s.post(
        f"{cfg.base}/areadocondomino/atual/publico/auth",
        data={
            "email": cfg.email, "senha": cfg.senha, "url": "", "CHAVE": "",
            "idCondominio": "", "FL_LOGIN_WEB": "1", "salvar": "Entrar",
            "hashemail": "",
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=20,
    )
    guard(resp)
    check = s.get(f"{cfg.base}/clients/areadocondomino/reservas", timeout=20)
    guard(check)
    if "Reservas online" not in check.text:
        raise SystemExit("login failed: reservas page not reached (check credentials)")
    log("login ok")


def _encode_body(params: dict, url: str) -> str:
    # Match the site: json=<encoded compact JSON>, with each value pre-encoded.
    inner = {k: urllib.parse.quote(str(v)) for k, v in params.items()}
    obj = {"params": [inner], "url": url}
    return "json=" + urllib.parse.quote(json.dumps(obj, separators=(",", ":")))


def _post(s, url, params):
    resp = s.post(url, data=_encode_body(params, url),
                  headers={"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"},
                  timeout=20)
    guard(resp)
    try:
        data = resp.json()
    except ValueError:
        return {"ok": False, "msg": f"non-json ({resp.status_code})", "raw": {}}
    items = data.get("data") or []
    it = items[0] if items else data
    inner = it.get("data") if isinstance(it.get("data"), dict) else {}
    return {"ok": str(it.get("status")) == "200", "msg": str(it.get("msg", "")), "raw": inner}


def attempt_book(s: requests.Session, cfg: Config) -> dict:
    url = f"{cfg.base}/areadocondomino/atual/reservas/put"
    params = {
        "nomeArea": cfg.nome_area,
        "ID_UNIDADE_UNI": cfg.unit_id,
        "FL_BLOQUEARINAD_ARE": "1",
        "existeReserva": "",
        "flVerregras": "",
        "ID_CONDOMINIO_COND": cfg.condo_id,
        "FL_REGRAS_ARE": "1",
        "ST_UNIDADE_UNI": "",
        "ID_AREA_ARE": cfg.area_id,
        "DT_RESERVA_RES": f"{cfg.target_date} 00:00:00",
        "FL_COBRANCA_ARE": "0",
    }
    return _post(s, url, params)


def cancel(s: requests.Session, cfg: Config, id_reserva: str) -> dict:
    url = f"{cfg.base}/areadocondomino/atual/reservas/cancelar"
    params = {
        "ID_RESERVA_RES": id_reserva,
        "ID_CONDOMINIO_COND": cfg.condo_id,
        "ST_MOTIVOCANCELAMENTO_RES": cfg.cancel_reason,
        "DT_RESERVA_RES": f"{cfg.target_date} 00:00:00",
        "FL_STATUS_RES": "1",
        "NM_ANTECEDENCIAMINIMACANCELAMENTO_AREA": "0",
    }
    return _post(s, url, params)


def _strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", s)
                   if not unicodedata.combining(c)).lower()


def _is_not_open(msg: str) -> bool:
    m = _strip_accents(msg)
    return any(k in m for k in NOT_OPEN_MARKERS)


def _open_threshold(cfg: Config) -> datetime:
    tgt = datetime.strptime(cfg.target_date, "%m/%d/%Y")
    return tgt - timedelta(days=WINDOW_DAYS)


def run_once(s, cfg) -> int:
    thr = _open_threshold(cfg)
    within = _now().date() >= thr.date()
    log(f"heartbeat: target {cfg.target_date} opens ~{thr.date()} "
        f"(within window now: {within})")
    return 0


def _poll_book(s, cfg):
    """Poll attempt_book until success/deadline. Returns the final result dict
    plus a 'booked' flag. Retries only on the not-open marker."""
    deadline = time.monotonic() + cfg.deadline_seconds
    attempts = 0
    while time.monotonic() < deadline:
        attempts += 1
        try:
            r = attempt_book(s, cfg)
        except Blocked:
            raise
        except requests.RequestException as e:
            log(f"transient error: {e}")
            time.sleep(cfg.poll_interval)
            continue
        if r["ok"]:
            log(f"BOOKED after {attempts} attempts: {r['msg']} "
                f"id={r['raw'].get('id_reserva_res')} fila={r['raw'].get('nm_fila_res')}")
            return r, True
        if _is_not_open(r["msg"]):
            if attempts == 1 or attempts % 20 == 0:
                log(f"not open yet (attempt {attempts}): {r['msg']}")
            time.sleep(cfg.poll_interval)
            continue
        log(f"non-retryable response: {r['msg']}")
        return r, False
    log("deadline reached without booking")
    return None, False


def run_watch(s, cfg) -> int:
    log(f"watch: booking {cfg.target_date} area {cfg.area_id} the instant it opens")
    r, booked = _poll_book(s, cfg)
    if r is None:
        notify(cfg, "Booker FAILED", f"{cfg.target_date} never opened before deadline")
        return 1
    if booked:
        fila = r["raw"].get("nm_fila_res")
        rid = r["raw"].get("id_reserva_res")
        first = str(fila) in ("1", "")
        notify(cfg, "Salao BOOKED" if first else "Salao booked (in queue)",
               f"{cfg.target_date}: {r['msg']} id={rid} fila={fila}")
        return 0
    notify(cfg, "Booker: rejected", f"{cfg.target_date}: {r['msg']}")
    return 2


def run_probe(s, cfg) -> int:
    log(f"probe: pinning open time for {cfg.target_date} area {cfg.area_id} "
        f"(will book then cancel)")
    r, booked = _poll_book(s, cfg)
    if r is None or not booked:
        msg = "deadline reached" if r is None else r["msg"]
        notify(cfg, "Probe: no open", f"{cfg.target_date}: {msg}")
        return 1
    rid = r["raw"].get("id_reserva_res")
    log(f"FLIP pinned at {_now().isoformat()} ({LOG_TZ}) id={rid}")
    if rid:
        c = cancel(s, cfg, rid)
        log(f"probe cleanup cancel: ok={c['ok']} msg={c['msg']}")
    notify(cfg, "Probe: date opened",
           f"{cfg.target_date} opened; booked+cancelled id={rid}")
    return 0


def main() -> int:
    cfg = load_config()
    mode = os.environ.get("MODE", (sys.argv[1] if len(sys.argv) > 1 else "once"))
    s = make_session()
    try:
        login(s, cfg)
        if mode == "once":
            return run_once(s, cfg)
        if mode == "probe":
            return run_probe(s, cfg)
        if mode == "watch":
            return run_watch(s, cfg)
        sys.exit(f"unknown MODE {mode}")
    except Blocked as e:
        notify(cfg, "Booker BLOCKED", f"stopping to avoid hammering: {e}")
        return 3
    except SystemExit as e:
        # login/config failure: alert so we catch auth breakage before the day
        if e.code and e.code != 0:
            notify(cfg, "Booker: login/config error", str(e.code))
        raise
    except Exception as e:  # noqa: BLE001 - last-resort alert on anything unexpected
        notify(cfg, "Booker: unexpected error", f"{type(e).__name__}: {e}")
        return 4


if __name__ == "__main__":
    sys.exit(main())
