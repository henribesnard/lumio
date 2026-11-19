#!/usr/bin/env python3
"""Export the OpenAPI schema to docs/openapi.json."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.main import app

schema = app.openapi()
output = Path(__file__).parent.parent / "docs" / "openapi.json"
output.write_text(json.dumps(schema, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"OpenAPI schema exported to {output}")
