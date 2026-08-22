"""Validate the repository-distributed ClickUp Community plugin."""

from __future__ import annotations

import json
import pathlib
import re
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
PLUGIN = ROOT / "plugins" / "clickup-community"


def load(path: pathlib.Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def main() -> int:
    manifest = load(PLUGIN / ".codex-plugin" / "plugin.json")
    mcp = load(PLUGIN / ".mcp.json")
    marketplace = load(ROOT / ".agents" / "plugins" / "marketplace.json")

    assert manifest["name"] == "clickup-community"
    assert re.fullmatch(r"\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?", manifest["version"])
    assert manifest["mcpServers"] == "./.mcp.json"
    assert "clickup_community" in mcp["mcpServers"]
    assert marketplace["plugins"][0]["name"] == "clickup-community"
    assert marketplace["plugins"][0]["source"]["path"] == "./plugins/clickup-community"
    for required in (
        ".codex-plugin/plugin.json",
        ".mcp.json",
        "clickup_community_server.py",
        "assets/clickup-icon.svg",
        "README.md",
    ):
        assert (PLUGIN / required).is_file(), required

    text = "\n".join(path.read_text(encoding="utf-8") for path in PLUGIN.rglob("*") if path.is_file())
    assert "sk-" not in text.lower()
    assert "pk_" not in text.lower()
    assert "Bearer " not in text
    print("clickup-community plugin validation passed")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AssertionError, json.JSONDecodeError, OSError) as exc:
        print(f"validation failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
