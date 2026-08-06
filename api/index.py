import sys
from pathlib import Path

# Add backend to python path
base_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(base_dir / "backend"))

from app.main import app
