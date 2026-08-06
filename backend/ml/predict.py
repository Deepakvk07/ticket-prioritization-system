"""
Standalone prediction CLI — useful for quick testing.
Usage: python ml/predict.py "API is down" "All endpoints returning 500"
"""
import sys
from pathlib import Path

# Allow running from backend/ directory
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.ml_service import predict_priority


def main():
    if len(sys.argv) < 3:
        print("Usage: python ml/predict.py <subject> <description> [category]")
        print('Example: python ml/predict.py "API down" "503 on all endpoints" "Technical"')
        sys.exit(1)

    subject = sys.argv[1]
    description = sys.argv[2]
    category = sys.argv[3] if len(sys.argv) > 3 else ""

    print(f"\n[*] Ticket:")
    print(f"   Subject    : {subject}")
    print(f"   Description: {description}")
    print(f"   Category   : {category or '(none)'}")

    result = predict_priority(subject, description, category)

    print(f"\n[*] AI Prediction:")
    print(f"   Priority   : {result['priority']}")
    print(f"   Confidence : {result['confidence_score']}%")
    print(f"   Reasoning  : {result['reasoning']}")
    print(f"\n   Probabilities:")
    for cls, prob in sorted(result['probabilities'].items(), key=lambda x: -x[1]):
        bar = "#" * int(prob * 30)
        print(f"     {cls:10s} {prob:.3f}  {bar}")


if __name__ == "__main__":
    main()
