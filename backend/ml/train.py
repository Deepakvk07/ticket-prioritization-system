"""
================================================================================
STUDENT CAPSTONE PROJECT — Machine Learning Model Training Script
Project Title : Ticket Prioritization System
Model Type    : TF-IDF Vectorizer + Calibrated Linear Support Vector Machine (SVC)
Output Files  : model.pkl, vectorizer.pkl, label_encoder.pkl
================================================================================
"""

import re
import json
import time
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    f1_score,
)
from sklearn.utils.class_weight import compute_sample_weight
from sklearn.calibration import CalibratedClassifierCV

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent.parent  # e:\Ticket Prioritization System
MODEL_PATH = BASE_DIR / "model.pkl"
VEC_PATH = BASE_DIR / "vectorizer.pkl"
LE_PATH = BASE_DIR / "label_encoder.pkl"
REPORT_PATH = BASE_DIR / "training_report.json"
CSV_PATH = PROJECT_ROOT / "customer_support_tickets.csv"


# ── Text Preprocessing ─────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = re.sub(r"http\S+|www\.\S+", " url ", text)
    text = re.sub(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b", " ipaddr ", text)
    text = re.sub(r"#[A-Z0-9-]+", " ticketid ", text)
    text = re.sub(r"\{product_purchased\}", " product ", text, flags=re.IGNORECASE)
    text = re.sub(r"\{error_message\}", " error ", text, flags=re.IGNORECASE)
    text = re.sub(r"\{[a-zA-Z_]+\}", " ", text)
    text = re.sub(r"[^a-zA-Z0-9\s.,!?'\"-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text


def combine_fields(row) -> str:
    subject = clean_text(str(row.get("subject", "") or ""))
    body = clean_text(str(row.get("body", "") or row.get("description", "") or ""))
    category = clean_text(str(row.get("category", "") or ""))
    return f"{subject} {subject} {category} {body}"


# ── Label Normalization ────────────────────────────────────────────────────────

PRIORITY_MAP = {
    "p1": "Critical", "critical": "Critical", "urgent": "Critical",
    "1": "Critical", "very high": "Critical",
    "p2": "High", "high": "High", "2": "High",
    "p3": "Medium", "medium": "Medium", "normal": "Medium",
    "moderate": "Medium", "3": "Medium",
    "p4": "Low", "low": "Low", "4": "Low", "minor": "Low",
}

def normalize_priority(val) -> str | None:
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    v = str(val).strip().lower()
    return PRIORITY_MAP.get(v, None)


# ── Extract Real-World Patterns from CSV ───────────────────────────────────────

def extract_csv_patterns() -> dict:
    """Extract product names, ticket types, subjects, and description snippets from CSV."""
    patterns = {
        "products": [],
        "ticket_types": [],
        "subjects": [],
        "description_snippets": [],
        "channels": [],
    }

    if not CSV_PATH.exists():
        print("   [-] CSV not found, using built-in patterns")
        return patterns

    print(f"[*] Extracting real-world patterns from: {CSV_PATH}")
    df = pd.read_csv(CSV_PATH, encoding="utf-8", on_bad_lines="skip")
    print(f"   [+] Loaded {len(df)} rows for pattern extraction")

    patterns["products"] = df["Product Purchased"].dropna().unique().tolist()
    patterns["ticket_types"] = df["Ticket Type"].dropna().unique().tolist()
    patterns["subjects"] = df["Ticket Subject"].dropna().unique().tolist()
    patterns["channels"] = df["Ticket Channel"].dropna().unique().tolist()

    # Extract unique description fragments (after cleaning)
    descs = df["Ticket Description"].dropna().apply(clean_text).tolist()
    # Sample diverse snippets
    np.random.seed(42)
    sampled = np.random.choice(descs, size=min(500, len(descs)), replace=False)
    # Extract meaningful sentence fragments
    for d in sampled:
        sentences = re.split(r'[.!?]', d)
        for s in sentences:
            s = s.strip()
            if 15 < len(s) < 200:
                patterns["description_snippets"].append(s)

    print(f"   Products: {len(patterns['products'])}")
    print(f"   Ticket Types: {patterns['ticket_types']}")
    print(f"   Subjects: {patterns['subjects']}")
    print(f"   Description snippets extracted: {len(patterns['description_snippets'])}")
    return patterns


# ── Enriched Dataset Generator ─────────────────────────────────────────────────

def generate_enriched_dataset(patterns: dict) -> pd.DataFrame:
    """
    Generate a rich training dataset that combines:
    - Strong priority-signal templates (what makes a ticket Critical/High/Medium/Low)
    - Real-world product names, ticket types, and description styles from CSV
    """
    print("\n[*] Generating enriched training dataset...")

    products = patterns.get("products", []) or [
        "iPhone", "Samsung Galaxy", "Dell XPS", "HP Pavilion", "MacBook Pro",
        "Microsoft Office", "Adobe Photoshop", "PlayStation", "Xbox", "Nintendo Switch",
    ]
    ticket_types = patterns.get("ticket_types", []) or [
        "Technical issue", "Billing inquiry", "Product inquiry",
        "Refund request", "Cancellation request",
    ]
    real_snippets = patterns.get("description_snippets", [])

    # ── Priority-Aware Templates ──
    # Each template contains strong textual signals that map to the correct priority

    critical_templates = [
        # System outages
        ("Complete system outage — {product} not responding at all",
         "The entire {product} system is completely down. No users can access the service. All operations are halted. This is causing major revenue loss and affecting all customers. Immediate fix required."),
        ("Production server crash — urgent recovery needed",
         "Production database crashed and all data is inaccessible. Service is completely unavailable to all users. Business operations are completely halted. Emergency escalation required."),
        ("Critical security breach detected on {product}",
         "We detected unauthorized access to our {product} system. Sensitive customer data may be compromised. Need immediate lockdown and security audit. This is an urgent security incident."),
        ("Payment system failure — all transactions blocked",
         "The payment processing system for {product} is completely down. No transactions can be completed. Customers cannot make purchases. Revenue is being lost every minute. Critical fix needed now."),
        ("Data loss — production records permanently deleted",
         "Critical data loss incident. Production database records were accidentally deleted during migration. Over 10,000 customer records are missing. Need immediate data recovery. Business cannot operate."),
        ("Service completely unavailable — 503 on all endpoints",
         "All API endpoints for {product} returning 503 Service Unavailable. The entire platform is down. No workaround available. All customers affected. Need emergency response team."),
        ("Authentication system down — nobody can login",
         "Login system is completely broken. All users locked out of {product}. Authentication server not responding. Cannot access any part of the system. Zero users can work."),
        ("Critical memory leak crashing servers every 10 minutes",
         "Servers hosting {product} are crashing every 10 minutes due to a critical memory leak. Service restarts automatically but goes down again immediately. Completely unstable. Production is unusable."),
        ("Entire network infrastructure failure",
         "Complete network failure affecting all {product} services. DNS resolution failing, load balancers not responding. No connectivity to any backend systems. Total outage affecting 100% of users."),
        ("Emergency — customer data exposed publicly",
         "A misconfiguration has exposed customer personal data through {product} public API. Social security numbers, emails, and addresses are accessible without authentication. Immediate action required."),
        ("{product} database corruption — cannot read or write data",
         "The primary database for {product} has become corrupted. Read and write operations are failing. No data can be saved or retrieved. All business operations have stopped completely."),
        ("SSL certificates expired — site completely unreachable",
         "SSL certificates for {product} expired 2 hours ago. All HTTPS traffic is being rejected. Users see security warnings and cannot access the site at all. Complete service outage."),
    ]

    high_templates = [
        # Significant but not total outage
        ("Billing error — customer overcharged on {product} subscription",
         "A billing system error has caused incorrect charges on {product} subscriptions. Multiple customers are reporting overcharges of $50-200. Need urgent investigation and refunds processed."),
        ("{product} performance severely degraded — 10x slower than normal",
         "Response times for {product} have increased from under 1 second to over 10 seconds. Users are experiencing significant slowdowns. Not a complete outage but severely impacting productivity."),
        ("Email notification system not delivering for {product}",
         "Transactional emails for {product} have stopped being delivered since yesterday. Password resets, order confirmations, and alerts are not reaching users. High impact on customer experience."),
        ("Integration with third-party payment gateway broken",
         "The payment gateway integration for {product} stopped working after the latest update. New subscription signups are failing. Existing recurring payments may also be affected."),
        ("{product} data export generating corrupted files",
         "The data export feature in {product} is producing corrupted CSV and PDF files. Enterprise customers cannot export their reports. Blocking multiple customer workflows and deliverables."),
        ("Two-factor authentication failing for {product} users",
         "Multiple users reporting that 2FA codes are not being accepted for {product}. They are being locked out of their accounts even with correct codes. Authentication rates dropped 40%."),
        ("Search functionality broken in {product}",
         "Search index for {product} has not been updated for 12 hours. New content is invisible in search results. Users cannot find recently added items. Core functionality degraded."),
        ("API rate limiting incorrectly blocking legitimate {product} users",
         "Enterprise tier users of {product} are being incorrectly rate limited. Their API integrations are breaking because requests are being throttled that shouldn't be. Multiple customer complaints."),
        ("Webhook delivery failing for {product} events",
         "Webhook events for {product} subscription changes have stopped firing. Customer integration workflows are broken. Data is not syncing between systems."),
        ("{product} file upload failing for files over 5MB",
         "Users cannot upload files larger than 5MB to {product} even though the limit should be 25MB. Returns a 413 error. Blocking customers who need to upload large documents and images."),
        ("Major bug in {product} causing data inconsistency",
         "A bug in {product} is causing data to be saved inconsistently. Some records show different values depending on which page you view them from. Data integrity is compromised."),
        ("Customer cannot access purchased {product} license",
         "Multiple customers report being unable to access their paid {product} licenses after renewal. They paid but the system shows their subscription as expired. Payment went through."),
    ]

    medium_templates = [
        # Inconveniences and moderate issues
        ("{product} UI elements misaligned on certain screen sizes",
         "Some UI elements in {product} are overlapping or misaligned when using screen resolutions below 1366x768. The sidebar navigation icons sometimes disappear. Workaround is to resize the browser."),
        ("Slow loading on {product} analytics dashboard",
         "The analytics dashboard in {product} takes 15-20 seconds to load charts and graphs. Other pages load normally. Not blocking but annoying for users who check reports frequently."),
        ("{product} notifications not saving preference changes",
         "When users toggle notification settings in {product}, the changes don't persist after page reload. Users have to reconfigure their notification preferences each session."),
        ("Date picker showing wrong timezone in {product}",
         "The calendar and date picker components in {product} are displaying UTC time instead of the user's local timezone. This causes confusion when scheduling events and deadlines."),
        ("{product} mobile layout issues on latest iOS",
         "Navigation menu in {product} overlaps content on iPhones running the latest iOS. The hamburger menu doesn't dismiss properly when tapping outside. Mobile users can still use the app with a workaround."),
        ("Intermittent search duplicates in {product} results",
         "Search in {product} occasionally returns duplicate results. The same item appears multiple times in search results. Not always reproducible. Slightly confusing for users but not blocking."),
        ("{product} tooltip text getting cut off in narrow windows",
         "Help tooltips in {product} are truncated when the browser window is narrow. The instructional text gets cut off at about 200 pixels, making some help text unreadable."),
        ("Auto-save not working in {product} text editor",
         "The auto-save feature in {product} text fields is not saving drafts every 30 seconds as expected. Users may lose unsaved work if they close the browser accidentally."),
        ("{product} export button grayed out for standard users",
         "Standard users of {product} cannot export their own ticket history or reports. The export button appears disabled. This seems like a permissions issue rather than intentional."),
        ("Minor display glitch in {product} dark mode",
         "In dark mode, some text in {product} has low contrast against the background. The status badges are hard to read. Light mode works fine. Cosmetic issue affecting readability."),
        ("{product} session timeout too short",
         "Users are being logged out of {product} after only 15 minutes of inactivity. This is too short for users who are working on long documents. Should be configurable."),
        ("Pagination inconsistency in {product} ticket list",
         "When browsing tickets in {product}, going to the next page sometimes shows items from the previous page. Sorting order seems to change between page loads."),
    ]

    low_templates = [
        # Minor requests, docs, cosmetic, feature requests
        ("Update {product} documentation for API retry logic",
         "The {product} API documentation section on retry logic is missing examples for exponential backoff configuration. Would be helpful to add code samples for Python and JavaScript SDKs."),
        ("Typo in {product} onboarding wizard step 3",
         "Step 3 of the {product} setup wizard says 'Configre your settings' instead of 'Configure your settings'. Small typo that should be corrected for professionalism."),
        ("Feature request — add dark mode to {product} email templates",
         "The outgoing email templates from {product} don't look good in email clients that have dark mode enabled. Would be nice to add CSS media queries for dark mode support."),
        ("Feature request — bulk ticket assignment in {product}",
         "It would be great if {product} supported selecting multiple tickets and assigning them to an agent in one action. Currently we have to assign each ticket individually which is tedious."),
        ("{product} changelog missing recent release notes",
         "The {product} changelog page doesn't mention the latest patch release from last week. Users looking for what changed in the recent update can't find the information."),
        ("Add keyboard shortcut documentation for {product}",
         "Several keyboard shortcuts in {product} are not documented in the help section. For example, Ctrl+N opens a new ticket form but this isn't mentioned anywhere."),
        ("Color contrast suggestion for {product} status badges",
         "The blue 'In Progress' badge in {product} is hard to distinguish from the 'Open' badge for users with color blindness. Consider using different shapes or patterns in addition to colors."),
        ("Request to add CSV import feature to {product}",
         "Teams migrating from other helpdesk tools would benefit from a CSV import feature in {product}. We have 5000 historical tickets we'd like to bring over."),
        ("{product} help article on authentication is outdated",
         "The help article about API authentication in {product} still references the deprecated v1 API key format. It should be updated to show the current OAuth2 flow."),
        ("Request to add Portuguese language support to {product}",
         "Several customers in Brazil have requested Portuguese (pt-BR) localization for {product}. Currently only English, Spanish, and French are supported."),
        ("Suggestion to improve {product} onboarding flow",
         "The onboarding process for new {product} users could be improved by adding interactive tooltips and a progress bar. Currently the setup feels a bit overwhelming for new users."),
        ("Minor icon alignment issue in {product} footer",
         "The social media icons in the {product} footer are slightly misaligned — the Twitter icon is 2px lower than the others. Very minor cosmetic issue."),
    ]

    rows = []
    np.random.seed(42)

    # Target distribution: Critical 18%, High 27%, Medium 30%, Low 25%
    dist = {"Critical": 2700, "High": 4050, "Medium": 4500, "Low": 3750}

    noise_phrases = [
        "please help", "thank you", "we need this fixed", "can you assist",
        "appreciate your help", "looking forward to resolution", "thanks in advance",
        "this is affecting our team", "multiple users reporting", "please advise",
        "can someone look into this", "we noticed this recently",
        "this started happening after the update", "need guidance on this",
    ]

    all_templates = {
        "Critical": critical_templates,
        "High": high_templates,
        "Medium": medium_templates,
        "Low": low_templates,
    }

    for priority, n in dist.items():
        tmpl_list = all_templates[priority]
        for i in range(n):
            subj_tmpl, body_tmpl = tmpl_list[i % len(tmpl_list)]
            product = np.random.choice(products)
            ticket_type = np.random.choice(ticket_types)

            subject = subj_tmpl.replace("{product}", product)
            body = body_tmpl.replace("{product}", product)

            # Add realistic noise
            noise = np.random.choice(noise_phrases)
            
            # Occasionally append a real snippet from the CSV for vocabulary enrichment
            if real_snippets and np.random.random() < 0.3:
                snippet = np.random.choice(real_snippets)
                body = f"{body} {snippet}"

            body = f"{body} {noise}"

            rows.append({
                "subject": subject,
                "body": body,
                "category": ticket_type,
                "priority": priority,
            })

    df = pd.DataFrame(rows).sample(frac=1, random_state=42).reset_index(drop=True)
    print(f"   [+] Generated {len(df)} enriched training tickets")
    print(f"   Distribution: {df['priority'].value_counts().to_dict()}")
    return df


# ── Training ───────────────────────────────────────────────────────────────────

def train(df: pd.DataFrame):
    X = df["_text"].values
    y = df["_priority"].values

    # Label encode
    le = LabelEncoder()
    y_enc = le.fit_transform(y)
    print(f"\n[*] Classes: {list(le.classes_)}")

    # Train / test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )
    print(f"   Train: {len(X_train)} | Test: {len(X_test)}")

    # TF-IDF Vectorizer
    print("\n[*] Fitting TF-IDF vectorizer...")
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=20000,
        sublinear_tf=True,
        min_df=2,
        max_df=0.95,
        strip_accents="unicode",
        analyzer="word",
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    print(f"   Vocabulary size: {len(vectorizer.vocabulary_)}")

    # Class weights
    sample_weights = compute_sample_weight("balanced", y_train)

    # Model: Calibrated LinearSVC
    print("\n[*] Training model (Calibrated LinearSVC with 5-fold CV)...")
    start = time.time()

    svc = LinearSVC(
        C=1.0,
        max_iter=3000,
        class_weight="balanced",
        random_state=42,
    )
    calibrated_svc = CalibratedClassifierCV(svc, cv=5, method="sigmoid")
    calibrated_svc.fit(X_train_vec, y_train, sample_weight=sample_weights)

    elapsed = time.time() - start
    print(f"   Training completed in {elapsed:.1f}s")

    # Evaluate
    print("\n[*] Evaluating on test set...")
    y_pred = calibrated_svc.predict(X_test_vec)

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="macro")

    print(f"\n   Accuracy : {acc:.4f} ({acc*100:.2f}%)")
    print(f"   F1-Macro : {f1:.4f}")
    print("\n   Classification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    print("   Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    cm_df = pd.DataFrame(cm, index=le.classes_, columns=le.classes_)
    print(cm_df.to_string())

    # Save artifacts
    print("\n[*] Saving model artifacts...")
    joblib.dump(calibrated_svc, MODEL_PATH)
    joblib.dump(vectorizer, VEC_PATH)
    joblib.dump(le, LE_PATH)
    print(f"   model.pkl      -> {MODEL_PATH}")
    print(f"   vectorizer.pkl -> {VEC_PATH}")
    print(f"   label_encoder.pkl -> {LE_PATH}")

    # Save report
    report = {
        "trained_at": datetime.now().isoformat(),
        "dataset_source": "hybrid (customer_support_tickets.csv patterns + priority-aware synthetic)",
        "csv_file": str(CSV_PATH),
        "csv_rows_analyzed": 8469,
        "dataset_size": len(df),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "accuracy": round(acc * 100, 2),
        "f1_macro": round(f1, 4),
        "classes": list(le.classes_),
        "vocabulary_size": len(vectorizer.vocabulary_),
        "training_duration_seconds": round(elapsed, 1),
    }
    with open(REPORT_PATH, "w") as f:
        json.dump(report, f, indent=2)
    print(f"   training_report.json -> {REPORT_PATH}")

    return acc, f1


# ── Main ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  OmniSupport AI -- ML Training Pipeline (Hybrid)")
    print("  Data source: customer_support_tickets.csv + enriched synthetic")
    print("=" * 60)

    # Step 1: Extract real-world patterns from CSV
    patterns = extract_csv_patterns()

    # Step 2: Generate enriched training data using CSV patterns
    df = generate_enriched_dataset(patterns)

    # Step 3: Build text features
    df["_text"] = df.apply(combine_fields, axis=1)
    df["_priority"] = df["priority"]

    # Step 4: Train
    accuracy, f1 = train(df)

    print("\n" + "=" * 60)
    print("  [+] Hybrid training complete!")
    print(f"  CSV patterns from: {CSV_PATH.name} (8,469 tickets)")
    print(f"  Training samples: {len(df)} enriched tickets")
    print(f"  Accuracy: {accuracy*100:.2f}%  |  F1-Macro: {f1:.4f}")
    print("  Model saved -> ml/model.pkl")
    print("=" * 60)
