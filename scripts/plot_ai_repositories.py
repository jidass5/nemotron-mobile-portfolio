#!/usr/bin/env python3
"""Plot observed public GitHub stars from the collected snapshot; no synthetic values."""
from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "ai_repositories_snapshot.json"
OUT = ROOT / "docs" / "ai-repositories-stars.svg"

def main() -> None:
    snapshot = json.loads(DATA.read_text())
    rows = sorted((row for row in snapshot["rows"] if row.get("ok") and isinstance(row.get("stars"), int)), key=lambda row: row["stars"])
    if not rows:
        raise SystemExit("Nenhuma linha bem-sucedida para plotar; não será criada uma visualização vazia.")
    labels = [row["full_name"] for row in rows]
    values = [row["stars"] for row in rows]
    fig_height = max(5.5, len(rows) * 0.42)
    fig, ax = plt.subplots(figsize=(11, fig_height))
    ax.barh(labels, values, color="#2563eb")
    ax.set_xscale("log")
    ax.set_xlabel("Stars observadas na API pública do GitHub (escala log)")
    ax.set_title("Snapshot de projetos públicos de IA — sem ranking de qualidade")
    ax.grid(axis="x", alpha=0.25)
    for y, value in enumerate(values):
        ax.text(value * 1.04, y, f"{value:,}".replace(",", "."), va="center", fontsize=8)
    fig.text(0.01, 0.01, f"Coleta: {snapshot['retrieved_at']} | Fonte: GitHub REST API via Nemotron Fetch Proxy", fontsize=8)
    fig.tight_layout(rect=(0, 0.03, 1, 1))
    OUT.parent.mkdir(exist_ok=True)
    fig.savefig(OUT, format="svg", bbox_inches="tight")
    print(OUT)

if __name__ == "__main__":
    main()
