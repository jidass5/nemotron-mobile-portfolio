#!/usr/bin/env python3
"""Collect a small, reproducible snapshot of public AI repositories through the local proxy."""
from __future__ import annotations

import csv
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROXY_BASE = os.environ.get("PROXY_BASE", "http://127.0.0.1:8787")
REPOSITORIES = [
    "Aider-AI/aider",
    "continuedev/continue",
    "OpenHands/OpenHands",
    "open-webui/open-webui",
    "cloudflare/workers-sdk",
    "langchain-ai/langchain",
    "run-llama/llama_index",
    "microsoft/autogen",
    "Significant-Gravitas/AutoGPT",
    "huggingface/transformers",
    "vllm-project/vllm",
    "NVIDIA/NeMo",
]


def fetch_repo(repo: str) -> dict:
    target = f"https://api.github.com/repos/{repo}"
    url = PROXY_BASE + "/api/fetch?" + urllib.parse.urlencode({"url": target, "format": "text", "maxChars": "50000"})
    started = time.perf_counter()
    result = {"requested_repo": repo, "target": target, "proxy_url": url, "retrieved_at": datetime.now(timezone.utc).isoformat()}
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"Accept": "application/vnd.github+json"}), timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8", "replace"))
            result.update({"proxy_status": response.status, "elapsed_ms": round((time.perf_counter() - started) * 1000, 1)})
            if response.status != 200 or payload.get("status") != 200:
                result.update({"ok": False, "error": f"proxy/upstream status {response.status}/{payload.get('status')}", "raw": payload})
                return result
            try:
                metadata = json.loads(payload["text"])
            except (KeyError, TypeError, json.JSONDecodeError) as exc:
                result.update({"ok": False, "error": f"metadata JSON parse failed: {exc}", "raw": payload.get("text", "")[:500]})
                return result
            license_info = metadata.get("license") or {}
            result.update({
                "ok": True,
                "full_name": metadata.get("full_name"),
                "requested_matches_response": metadata.get("full_name", "").lower() == repo.lower(),
                "redirected_to": metadata.get("full_name") if metadata.get("full_name", "").lower() != repo.lower() else None,
                "description": metadata.get("description"),
                "language": metadata.get("language"),
                "stars": metadata.get("stargazers_count"),
                "forks": metadata.get("forks_count"),
                "open_issues": metadata.get("open_issues_count"),
                "archived": metadata.get("archived"),
                "license": license_info.get("spdx_id"),
                "default_branch": metadata.get("default_branch"),
                "created_at": metadata.get("created_at"),
                "updated_at": metadata.get("updated_at"),
                "pushed_at": metadata.get("pushed_at"),
                "html_url": metadata.get("html_url"),
            })
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        result.update({"ok": False, "elapsed_ms": round((time.perf_counter() - started) * 1000, 1), "error": str(exc)})
    return result


def write_outputs(rows: list[dict]) -> None:
    data_dir = ROOT / "data"
    docs_dir = ROOT / "docs"
    data_dir.mkdir(exist_ok=True)
    successes = [row for row in rows if row.get("ok")]
    snapshot = {
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "source": "GitHub REST API /repos/{owner}/{repo} via Nemotron Fetch Proxy",
        "proxy_base": PROXY_BASE,
        "repository_count_requested": len(rows),
        "repository_count_success": len(successes),
        "repository_count_failed": len(rows) - len(successes),
        "rows": rows,
    }
    (data_dir / "ai_repositories_snapshot.json").write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n")
    fields = ["requested_repo", "full_name", "requested_matches_response", "redirected_to", "language", "stars", "forks", "open_issues", "archived", "license", "elapsed_ms", "updated_at", "html_url", "error"]
    with (data_dir / "ai_repositories_snapshot.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field) for field in fields})
    lines = [
        "# Snapshot de repositórios públicos de IA",
        "",
        f"Coleta: `{snapshot['retrieved_at']}`. Fonte: GitHub REST API, acessada pelo Worker local `{PROXY_BASE}`.",
        "",
        "Este snapshot é observacional. Stars, forks, issues e timestamps mudam; não são métricas de qualidade, contratação ou desempenho. Falhas e redirecionamentos não são removidos: ficam registrados no JSON/CSV.",
        "",
        f"**Solicitados:** {len(rows)} · **Sucesso:** {len(successes)} · **Falhas:** {len(rows) - len(successes)}",
        "",
        "| Repositório solicitado | Repositório retornado | Linguagem | Stars | Forks | Issues abertas | Arquivado | Atualizado | Latência (ms) |",
        "| --- | --- | --- | ---: | ---: | ---: | :---: | --- | ---: |",
    ]
    for row in successes:
        returned = f"[{row['full_name']}]({row['html_url']})"
        requested = row["requested_repo"] if row.get("requested_matches_response") else f"{row['requested_repo']} (redirecionado)"
        lines.append(f"| {requested} | {returned} | {row.get('language') or '—'} | {row.get('stars', '—'):,} | {row.get('forks', '—'):,} | {row.get('open_issues', '—'):,} | {'sim' if row.get('archived') else 'não'} | {row.get('updated_at', '—')} | {row.get('elapsed_ms', '—')} |".replace(",", "."))
    for row in rows:
        if not row.get("ok"):
            lines.append(f"| `{row['requested_repo']}` | — | — | — | — | — | — | falha: {row.get('error', 'desconhecida')} |")
    lines += [
        "",
        "## Método e limitações",
        "",
        "O script consulta uma lista fixa de repositórios públicos, passa cada URL pelo endpoint `/api/fetch`, verifica o status do upstream e interpreta o JSON retornado. A coluna de repositório solicitado é preservada quando a API redireciona ou canonicaliza um endereço. Não há amostragem aleatória nem dados simulados. A lista foi escolhida por relevância ao benchmark do projeto, não como ranking universal.",
        "",
        "A latência é medida do processo local até o proxy retornar. Ela inclui rede e tempo de resposta do GitHub naquele instante. Não é p50/p95: para isso seria necessário repetir cada consulta sob um protocolo de carga controlado.",
        "",
        "Os arquivos brutos estão em [`data/ai_repositories_snapshot.json`](../data/ai_repositories_snapshot.json) e [`data/ai_repositories_snapshot.csv`](../data/ai_repositories_snapshot.csv).",
    ]
    (docs_dir / "AI_REPOSITORIES_SNAPSHOT.md").write_text("\n".join(lines) + "\n")


def main() -> None:
    rows = []
    for index, repo in enumerate(REPOSITORIES):
        row = fetch_repo(repo)
        rows.append(row)
        print(f"[{index + 1}/{len(REPOSITORIES)}] {repo}: {'ok' if row.get('ok') else 'FAIL'} {row.get('elapsed_ms', '—')}ms")
    write_outputs(rows)


if __name__ == "__main__":
    main()
