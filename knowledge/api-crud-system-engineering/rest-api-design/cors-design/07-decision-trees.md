# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** REST API Design
**Knowledge Unit:** CORS Design
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## CORS Origin Strategy

---

### Decision Context

Determining the appropriate CORS origin configuration based on client types, authentication requirements, and deployment environment.

---

### Decision Criteria

* security
* architectural
* maintainability

---

### Decision Tree

Are there browser-based clients accessing the API from different origins?
├── YES → Configure CORS in `config/cors.php`
│   ├── Does the API use credential-based authentication (cookies, Authorization header)?
│   │   ├── YES → Use specific origins (no wildcard); set `supports_credentials: true`
│   │   │   ├── SPA auth (Sanctum) requires `sanctum/csrf-cookie` in paths
│   │   │   └── Each origin must be listed explicitly
│   │   └── NO → Wildcard `*` is acceptable for public data only
│   └── Are origins managed per environment?
│       ├── YES → Use environment variables: `CORS_ALLOWED_ORIGINS`
│       └── NO → Hardcoding origins blocks environment-specific configurations
└── NO → No CORS configuration needed
    ├── Server-to-server, mobile apps, CLI → CORS doesn't apply
    └── Same-origin deployment → No CORS needed

Is the allowed origin list pruned regularly?
├── YES → Document process for quarterly review
└── NO → Add quarterly review — unused origins become security liabilities

---

### Rationale

CORS is enforced by browsers, not the server. Specific origins limit browser-based access to known frontends. Credentialed requests require explicit origins (wildcard + credentials is rejected by browsers). Environment variables prevent deploying development CORS policies to production.

---

### Recommended Default

**Default:** Specific origins from env vars, `supports_credentials: false` unless SPA auth needed; quarterly origin list review
**Reason:** Specific origins minimize attack surface; env vars enable environment-specific configs; credentials only when needed.

---

### Risks Of Wrong Choice

Wildcard with credentials breaks all credentialed CORS requests. No CORS config blocks legitimate browser clients. Hardcoded origins leak between environments.

---

### Related Rules

* Use Specific Origins In Production
* Never Pair Wildcard Origins With Credentials

---

### Related Skills

* Configure CORS Correctly for Your API Clients
* Content Negotiation

---

---

## Preflight (OPTIONS) Handling Strategy

---

### Decision Context

Configuring OPTIONS preflight handling to minimize latency while maintaining correctness.

---

### Decision Criteria

* performance
* architectural

---

### Decision Tree

Does the client make non-simple requests (PUT, PATCH, DELETE, custom headers, application/json)?
├── YES → Preflight is required; configure OPTIONS handling
│   ├── Is OPTIONS handled before authentication middleware?
│   │   ├── YES → Correct — preflight must not require auth
│   │   └── NO → Reorder middleware: CORS runs before auth
│   └── What Max-Age should be set?
│       ├── 86400 (24h) — reduces preflight to ~1/day per origin
│       ├── 3600 (1h) — balances freshness with overhead for development
│       └── 0 — every request triggers preflight (only for debugging)
└── NO → Simple requests only (GET, POST with simple content types)
    ├── No preflight needed
    └── CORS headers still required on the actual response

Does the API use custom headers (Authorization, X-Requested-With, custom media types)?
├── YES → Add to `allowed_headers` and `exposed_headers` as appropriate
└── NO → Default simple headers are sufficient

---

### Rationale

Every non-simple request triggers a preflight OPTIONS, doubling request count for writes. Setting a 24-hour Max-Age reduces preflight requests to approximately one per origin per day. CORS middleware must run before auth middleware because preflight has no credentials.

---

### Recommended Default

**Default:** `Max-Age: 86400` (24h); `HandleCors` middleware before auth in middleware pipeline
**Reason:** 24h Max-Age minimizes preflight overhead; middleware ordering ensures preflight succeeds.

---

### Risks Of Wrong Choice

Auth middleware before CORS blocks all preflight requests. No Max-Age triggers preflight on every request, doubling latency. Too-short Max-Age increases preflight frequency.

---

### Related Rules

* Handle OPTIONS Before Authentication Middleware
* Configure CORS In config/cors.php Only

---

### Related Skills

* HTTP Method Semantics
* API Authentication and Authorization

---

---

## Credentialed CORS Configuration

---

### Decision Context

Configuring CORS for credentialed requests (cookies, Authorization headers) in SPA or authenticated browser clients.

---

### Decision Criteria

* security
* architectural
* maintainability

---

### Decision Tree

Does the SPA use cookie-based authentication (Sanctum, session)?
├── YES → Credentialed CORS required
│   ├── Set `supports_credentials: true`
│   ├── Set specific origins (wildcard `*` is incompatible)
│   ├── Include `sanctum/csrf-cookie` in CORS paths
│   └── Ensure `Access-Control-Allow-Origin` matches exactly (no trailing slash mismatch)
└── NO → Does the SPA use Authorization header?
    ├── YES → Credentialed CORS required (Authorization is a credential)
    │   ├── Set `supports_credentials: true`
    │   ├── Add `Authorization` to `allowed_headers`
    │   └── Specific origins required (no wildcard)
    └── NO → No credentialed CORS needed

Are there multiple SPA origins (staging, production, local development)?
├── YES → Use env variable for comma-separated origins list
└── NO → Single origin in env variable

---

### Rationale

Credentialed requests require exact origin matching — the browser rejects wildcard origins with credentials. Sanctum SPA auth specifically requires cookie-based CORS with `sanctum/csrf-cookie` in the allowed paths. Exact origin matching means protocol, domain, and port must all match.

---

### Recommended Default

**Default:** `supports_credentials: true` for authenticated SPAs; explicit origins from `SPA_URL` env var; `sanctum/csrf-cookie` in paths
**Reason:** Credentialed CORS is required for SPA auth; env variables enable per-environment configuration.

---

### Risks Of Wrong Choice

Wildcard with credentials breaks all browser requests silently. Missing `sanctum/csrf-cookie` path breaks Sanctum SPA authentication. Trailing slash mismatch in origin causes browser rejection.

---

### Related Rules

* Use Environment Variables For Origins
* Include Sanctum Endpoints In CORS Paths For SPA Auth

---

### Related Skills

* Content Negotiation
* URL Structure Design
