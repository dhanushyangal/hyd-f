#!/usr/bin/env python3
"""Optional standalone Bridge CLI.

Prefer the Bridge ON toggle inside Blender/Maya plugins.
This script is only if you want a Bridge without opening a DCC.
"""

from __future__ import annotations

import argparse
import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
_SHARED = os.path.abspath(os.path.join(_HERE, "..", "shared"))
if _SHARED not in sys.path:
    sys.path.insert(0, _SHARED)

from bridge_server import DEFAULT_PORT, start_bridge, stop_bridge  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Hydrilla Bridge (optional standalone)")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = parser.parse_args()

    result = start_bridge(host=args.host, port=args.port)
    if not result.get("ok"):
        print(result.get("error") or "Failed to start")
        raise SystemExit(1)

    print(f"Hydrilla Bridge listening on {result['url']}")
    print("Prefer Bridge ON inside the Blender/Maya plugin when possible.")
    try:
        while True:
            import time

            time.sleep(1.0)
    except KeyboardInterrupt:
        print("\nBridge stopped.")
        stop_bridge()


if __name__ == "__main__":
    main()
