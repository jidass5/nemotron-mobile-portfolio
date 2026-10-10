#!/usr/bin/env python3
"""Run public, unauthenticated validation against the local Fetch Proxy."""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE = "http://127.0.0.1:8787"
ROOT = Path(__file__).resolve().parents[1]

CASES = [
    ("health", "/api/health", {}, [], ""),
    ("aider_readme", "/api/fetch", {"url": "https://raw.githubusercontent.com/Aider-AI/aider/main/README.md", "format": "text", "maxChars": "5000"}, ["aider", "Installation", "Git"], ""),
    ("cloudflare_vitest_readme", "/api/fetch", {"url": "https://raw.githubusercontent.com/cloudflare/workers-sdk/main/fixtures/vitest-plugin-examples/README.md", "format": "text", "maxChars": "5000"}, ["Vitest", "Workers", "test"], ""),
    ("openhands_readme", "/api/fetch", {"url": "https://raw.githubusercontent.com/OpenHands/OpenHands/main/README.md", "format": "text", "maxChars": "5000"}, ["OpenHands", "agent"], ""),
    ("github_api", "/api/fetch", {"url": "https://api.github.com/repos/cloudflare/workers-sdk", "format": "text", "maxChars": "5000"}, ["full_name", "stargazers_count"], ""),
    ("example_domain", "/api/fetch", {"url": "https://example.com/", "format": "text", "maxChars": "5000"}, ["Example Domain"], ""),
    ("blocked_loopback", "/api/fetch", {"url": "http://127.0.0.1/", "format": "text"}, [], "hostname bloqueado por segurança"),
    ("blocked_private", "/api/fetch", {"url": "http://192.168.1.1/", "format": "text"}, [], "hostname bloqueado por segurança"),
    ("blocked_credentials", "/api/fetch", {"url": "https://user:pass@example.com/", "format": "text"}, [], "credenciais na URL não são permitidas"),
    ("blocked_port", "/api/fetch", {"url": "https://example.com:8443/", "format": "text"}, [], "porta não permitida"),
    ("invalid_format", "/api/fetch", {"url": "https://example.com/", "format": "markdown"}, [], "format deve ser text ou links"),
]


def request(path: str, params: dict[str, str]) -> dict:
    url = BASE + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(urllib.request.Request(url), timeout=30) as response:
            body = response.read().decode("utf-8", "replace")
            return {"url": url, "proxy_status": response.status, "elapsed_ms": round((time.perf_counter() - started) * 1000, 1), "data": json.loads(body)}
    except urllib.error.HTTPError as error:
        return {"url": url, "proxy_status": error.code, "elapsed_ms": round((time.perf_counter() - started) * 1000, 1), "data": json.loads(error.read().decode("utf-8", "replace"))}


def main() -> None:
    rows = []
    raw = []
    for name, path, params, markers, expected_error in CASES:
        result = request(path, params)
        data = result["data"]
        text = data.get("text", "") if isinstance(data, dict) else ""
        marker_results = {marker: marker.lower() in text.lower() for marker in markers}
        row = {
            "case": name,
            "proxy_status": result["proxy_status"],
            "upstream_status": data.get("status") if isinstance(data, dict) else None,
            "final_url": data.get("finalUrl") if isinstance(data, dict) else None,
            "content_type": data.get("contentType") if isinstance(data, dict) else None,
            "elapsed_ms": result["elapsed_ms"],
            "chars": len(text),
            "markers_found": marker_results,
            "all_markers_found": all(marker_results.values()),
            "error": data.get("error") if isinstance(data, dict) else None,
            "expected_error": expected_error,
        }
        rows.append(row)
        raw.append({"case": name, **result})
    report = {"generated_at": "runtime", "method": "local Wrangler Worker; public unauthenticated GET requests", "results": rows, "raw": raw}
    output = ROOT / "docs" / "REAL_DATA_VALIDATION.json"
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(rows, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
