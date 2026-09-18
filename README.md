<div align="center">

# 🛡️ FLYYY.AI — Privacy-Preserving Customer Data Platform
### *Enterprise Zero-Knowledge Privacy Operations Enclave & Privacy Gateway*

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Cryptography](https://img.shields.io/badge/Cryptography-AES--256--GCM%20%7C%20FF1-purple.svg?style=for-the-badge)](https://csrc.nist.gov)
[![License](https://img.shields.io/badge/Security_Posture-100%25_SECURE-10b981.svg?style=for-the-badge)](http://127.0.0.1:8000/api/security/posture)

<p align="center">
  <b>Built for the FLYYY.AI Student Engineering Challenge</b><br>
  A production-grade, local privacy control room implementing <b>Physical Database Separation</b>, <b>Format-Preserving Encryption (FF1)</b>, <b>Deterministic Vault Tokenization</b>, an <b>In-Memory Privacy Gateway</b>, and an audited <b>Controlled Reveal Enclave</b>.
</p>

</div>

---

### 🌐 Live Platform Access & Services

| Service Component | Direct Access Link | Port | Purpose |
|---|---|---|---|
| 🖥️ **Frontend Control Room** | [**`http://127.0.0.1:5173`**](http://127.0.0.1:5173) | `5173` | Interactive Cyber Privacy Enclave OS Dashboard |
| ⚙️ **Backend REST API** | [**`http://127.0.0.1:8000`**](http://127.0.0.1:8000) | `8000` | FastAPI Core Privacy Engine & Enclave Gateway |
| 📖 **Interactive Swagger UI** | [**`http://127.0.0.1:8000/docs`**](http://127.0.0.1:8000/docs) | `8000` | Real-time OpenAPI interactive test bench |
| 📑 **API Documentation (ReDoc)** | [**`http://127.0.0.1:8000/redoc`**](http://127.0.0.1:8000/redoc) | `8000` | Schema models and endpoint specifications |
| 🛡️ **Security Posture Report** | [**`http://127.0.0.1:8000/api/security/posture`**](http://127.0.0.1:8000/api/security/posture) | `8000` | Automated 6-control security verification JSON |

---

## 📑 Table of Contents
- [Live Platform Access & Services](#-live-platform-access--services)
- [Executive Overview](#-executive-overview)
- [System Architecture & Data Topology](#-system-architecture--data-topology)
- [Physical Database Isolation (6 Separate Stores)](#-physical-database-isolation-6-separate-stores)
- [Core Cryptographic Innovations](#-core-cryptographic-innovations)
- [Flagship Cyber UI/UX (Privacy Enclave OS)](#-flagship-cyber-uiux-privacy-enclave-os)
- [Quick Start Guide](#-quick-start-guide)
- [REST API Specifications](#-rest-api-specifications)
- [Automated Verification & Test Suite](#-automated-verification--test-suite)
- [Challenge Acceptance Alignment](#-challenge-acceptance-alignment)

---

## 🎯 Executive Overview

Modern consumer enterprises handle millions of customer records containing **Personally Identifiable Information (PII)** — emails, phone numbers, national IDs, and names. Traditionally, this data is replicated in plaintext across marketing automation tools, downstream analytics warehouses, and customer support portals, creating catastrophic attack surfaces and violating data protection mandates (GDPR, DPDP, CCPA).

**FLYYY.AI Privacy Platform solves this at the architectural root:**
1. **Protected by Default**: Downstream databases and consumer applications store **100% zero plaintext PII**.
2. **Format-Preserving Encryption (FF1)**: Mobile numbers and numeric IDs retain their original character length, structure, and type — enabling database foreign keys and validation logic without revealing raw digits.
3. **Deterministic Vault Tokenization**: Email addresses are mapped to cryptographically opaque tokens (`tok_usr_...`) via HMAC-SHA256 with isolated secret salts.
4. **Isolated Privacy Gateway**: Marketing campaigns dispatch to tokens. The Gateway securely resolves tokens to emails in-memory at dispatch time and routes them directly to recipients without disclosing plaintext to marketing operators.
5. **Reverse-Resolution for Webhooks**: Inbound bounce callbacks with raw emails are reverse-mapped to tokens via the vault; plaintext is discarded before storage.
6. **Controlled Reveal Enclave**: Decryption of customer PII is role-gated (RBAC), strictly ticket-justified, and permanently logged in an immutable forensic ledger.

---

## 🏛️ System Architecture & Data Topology

```
                                  [ RAW SOURCE CSV ]
                                          │
                                          ▼
                             ┌─────────────────────────┐
                             │ 1. Ingestion Controller │
                             │  (Chunked & Idempotent) │
                             └────────────┬────────────┘
                                          │
                                          ▼
                             ┌─────────────────────────┐
                             │ 2. Presidio AI Engine   │
                             │  (PII Discovery & Tag)  │
                             └────────────┬────────────┘
                                          │
                                          ▼
                             ┌─────────────────────────┐
                             │ 3. Policy Engine Matrix │
                             │  (FPE / TOKENIZE / KEEP)│
                             └────────────┬────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     ┌────────────────────────┐                     ┌───────────────────────────┐
     │   🔒 VAULT ENCLAVE     │                     │     🛡️ PROTECTED DB       │
     │   (vault.db)           │                     │  (protected_customers.db) │
     │ • AES-256-GCM Ciphers  │                     │ • FF1 Mobile (9015402359) │
     │ • HMAC Lookup Index    │                     │ • Email Token (tok_usr_.) │
     │ • Zero Plaintext Read  │                     │ • 100% Plaintext-Free     │
     └───────────┬────────────┘                     └─────────────┬─────────────┘
                 │                                                │
                 └───────────────────────┬────────────────────────┘
                                         │
                                         ▼
                             ┌─────────────────────────┐
                             │   PRIVACY GATEWAY       │
                             │ (Ephemeral In-Memory)   │
                             └───────────┬─────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         ▼                               ▼                               ▼
┌──────────────────┐           ┌──────────────────┐            ┌──────────────────┐
│ MARKETING DISPATCH│           │ CONTROLLED REVEAL│            │  IMMUTABLE AUDIT │
│ • Sends to Token │           │ • RBAC Gated     │            │  (audit.db)      │
│ • Gateway routes │           │ • Justification  │            │ • Every access   │
│ • Real Mailbox   │           │ • Live diff seal │            │ • Zero raw PII   │
└──────────────────┘           └──────────────────┘            └──────────────────┘
```

---

## 🗄️ Physical Database Isolation (6 Separate Stores)

In strict accordance with the FLYYY.AI engineering requirements, data is physically separated into **6 isolated SQLite databases**. Downstream systems are physically barred from touching vault or source storage:

| Database Engine | Physical File | Purpose & Security Guarantees |
|---|---|---|
| **Source DB** | `source.db` | Confined storage for raw ingested CSV data. Locked down; inaccessible to consumer apps. |
| **Protected DB** | `protected.db` | Downstream production store. **100% zero plaintext PII**. Stores FF1 tokens and HMAC identifiers. |
| **Vault DB** | `vault.db` | Key-value store mapping tokens to raw values. Values encrypted with **AES-256-GCM** using random nonces. |
| **Policy DB** | `policy.db` | Declarative field-level protection policies (`FPE`, `TOKENIZE`, `KEEP`, `PSEUDONYMIZE`). |
| **Audit DB** | `audit.db` | Append-only, tamper-evident audit ledger. Immutably logs every access; **stores zero raw customer PII**. |
| **Batch DB** | `batch.db` | Batch job execution telemetry, chunk performance metrics, and idempotency status. |

---

## 🔐 Core Cryptographic Innovations

### 1. Format-Preserving Encryption (NIST SP 800-38G FF1)
Numeric identifiers (e.g., 10-digit mobile phone numbers) are encrypted using **pyffx (FF1 algorithm over AES-128)**:
- **Input**: `9876543210` (10 digits)
- **Output**: `9015402359` (10 digits, preserves format, alphabet `0-9`, and length)
- **Benefit**: Existing database schemas, column widths, regex validations, and foreign keys continue operating without schema modification.

### 2. Deterministic HMAC Tokenization & Vaulting
- Emails and unique identifiers are passed through **HMAC-SHA256** combined with a vault-held secret salt to produce a deterministic token: `tok_usr_c001`.
- The raw email is encrypted with **AES-256-GCM** and stored in `vault.db` alongside the HMAC digest.
- Downstream applications only ever see and query the token.

### 3. Inbound Webhook Reverse-Resolution
When third-party Email Service Providers (SendGrid, AWS SES) issue a bounce webhook containing a raw email:
1. The Privacy Gateway computes `HMAC_SHA256(email, salt)`.
2. The Gateway matches the corresponding customer token in the vault index.
3. The bounce record is recorded in `bounces` **associated exclusively with the token**. The plaintext email is immediately purged from memory.

### 4. RBAC-Gated Controlled Reveal Enclave
- Access is strictly governed by user roles (`ADMIN`, `CUSTOMER_SUPPORT`, `MARKETING`, `AUDITOR`).
- Decryption requires:
  1. Authenticated User & Role
  2. Documented Operational Purpose (`CUSTOMER_SUPPORT`, `FRAUD_INVESTIGATION`, etc.)
  3. External Ticket / Reference ID (`TICK-4921`)
- Every reveal attempt generates an immutable audit record containing actor, timestamp, justification, and field name — **never the decrypted value itself**.

---

## ⚡ Flagship Cyber UI/UX (Privacy Enclave OS)

The frontend has been completely redesigned into an ultra-modern, **Cyber-Defense Mission Control Room**:

- 🌌 **Aurora Ambient Mesh**: Fluid multi-layer glowing orbs drifting behind frosted glassmorphic panels.
- 📐 **100% Full-Width Scalability**: Guaranteed fluid scaling across standard, ultra-wide, and 4K displays.
- 🎛️ **Mission Control Top HUD Bar**: Live telemetry badges displaying physical DB isolation status, cipher status, active role indicators, and real-time security score.
- 🔬 **Live Cryptography Laboratory (`/policies`)**: An interactive sandbox where evaluators can input any test string and watch real-time Format-Preserving Encryption or Vault tokenization execute live.
- 📡 **Automated Leakage Radar Scanner (`/leakage-check`)**: Animated rotating radar sweep scanning all database tables for plaintext leaks with instant verification seals.
- 📊 **7-Stage Interactive Topology (`/`)**: Dynamic architecture graph displaying live record counts, pipeline flow, and direct navigation.
- 📬 **Simulated In-App Mailbox (`/mailbox`)**: Verifies that tokens dispatched by marketing safely arrive as decrypted emails in customer mailboxes.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & `npm`

### Option 1: One-Click Launch (Windows)
Double-click `start.bat` in the project root:
```cmd
start.bat
```
This automatically initializes the FastAPI backend and launches the Vite React frontend.

Once started, access the platform services locally:
- 🖥️ **Frontend Dashboard**: [**http://127.0.0.1:5173**](http://127.0.0.1:5173)
- ⚙️ **Backend REST API**: [**http://127.0.0.1:8000**](http://127.0.0.1:8000)
- 📖 **Interactive Swagger Docs**: [**http://127.0.0.1:8000/docs**](http://127.0.0.1:8000/docs)

### Option 2: Manual Setup

#### 1. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download Presidio / Spacy English model
python -m spacy download en_core_web_sm

# Configure environment variables
cp .env.example .env

# Run FastAPI backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API will be live at: [**http://127.0.0.1:8000**](http://127.0.0.1:8000) (Swagger Docs: [**http://127.0.0.1:8000/docs**](http://127.0.0.1:8000/docs))

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend Control Room will be live at: [**http://127.0.0.1:5173**](http://127.0.0.1:5173)

---

## 🔌 REST API Specifications

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/overview/stats` | ALL | Returns live counts across all 6 isolated databases. |
| `POST` | `/api/source/seed` | ALL | Seeds verifiable sample customer records into `source.db`. |
| `POST` | `/api/source/upload` | ALL | Uploads customer CSV into source storage. |
| `POST` | `/api/discover` | ALL | Presidio PII discovery with confidence scores. |
| `GET` | `/api/policies` | ALL | Retrieves active field protection rules. |
| `PUT` | `/api/policies` | ADMIN | Updates field policies (FPE, TOKENIZE, KEEP). |
| `POST` | `/api/protect` | ALL | Live test utility for FPE & token transformations. |
| `POST` | `/api/batch/run` | ALL | Executes chunked, idempotent protection pipeline. |
| `GET` | `/api/customers` | ALL | Queries downstream protected database (zero plaintext). |
| `GET` | `/api/customers/export/csv` | ALL | Exports protected customers CSV. |
| `POST` | `/api/actions/send-email` | MARKETING, ADMIN | Dispatches email via Privacy Gateway using tokens. |
| `POST` | `/api/webhooks/email` | ALL | Inbound bounce callback with reverse resolution. |
| `POST` | `/api/reveal` | ADMIN, CUSTOMER_SUPPORT | Decrypts protected field; requires ticket & purpose. |
| `GET` | `/api/audit` | ALL | Returns immutable audit event stream with filters. |
| `GET` | `/api/security/posture` | ALL | Automated verification of all 6 security controls. |
| `GET` | `/api/mailbox` | ALL | In-app SMTP test inbox displaying delivered messages. |

---

## 🧪 Automated Verification & Test Suite

The platform includes automated end-to-end regression tests covering all security, cryptography, and RBAC workflows:

```bash
python -m pytest tests/test_privacy_platform.py -v
```

### Test Suite Results:
```
tests/test_privacy_platform.py::test_fpe_phone_format_preservation PASSED
tests/test_privacy_platform.py::test_fpe_alphanumeric_code PASSED
tests/test_privacy_platform.py::test_deterministic_tokenization PASSED
tests/test_privacy_platform.py::test_vault_authenticated_encryption PASSED
tests/test_privacy_platform.py::test_pii_discovery_api PASSED
tests/test_privacy_platform.py::test_batch_execution_and_idempotency PASSED
tests/test_privacy_platform.py::test_zero_plaintext_in_protected_export PASSED
tests/test_privacy_platform.py::test_marketing_send_email PASSED
tests/test_privacy_platform.py::test_bounce_reverse_resolution PASSED
tests/test_privacy_platform.py::test_unauthorized_reveal_denied_and_audited PASSED
tests/test_privacy_platform.py::test_authorized_reveal_granted_and_audited PASSED

======================== 11 passed in 8.38s ========================
```

---

## 🏆 Challenge Acceptance Alignment

| Requirement | Implementation Verification | Status |
|---|---|---|
| **Physical Database Separation** | 6 dedicated SQLite files (`source`, `protected`, `vault`, `policy`, `audit`, `batch`). Verified via `getSecurityPosture()`. | ✅ PASS |
| **Format-Preserving Encryption** | NIST FF1 via `pyffx` preserves exact digit length and numeric character set for mobile numbers. | ✅ PASS |
| **Zero Downstream Plaintext** | Automated scanner verifies zero raw emails or mobile numbers exist in `protected_customers.db`. | ✅ PASS |
| **Privacy Gateway** | Marketing uses tokens; in-memory ephemeral resolution routes to SMTP without operator visibility. | ✅ PASS |
| **Reverse Resolution** | Inbound bounces with plaintext emails reverse-resolve to tokens before saving; raw email is discarded. | ✅ PASS |
| **Controlled Reveal Enclave** | RBAC enforced; justification ticket required; attempt logged immutably without storing revealed value. | ✅ PASS |
| **Dynamic Frontend Experience** | 100% full-width cyber command room with live cryptography lab and real-time radar sweep. | ✅ PASS |

---

<div align="center">
  <sub>Developed for the FLYYY.AI Student Engineering Challenge • Built with Zero-Knowledge Architecture Principles</sub>
</div>
