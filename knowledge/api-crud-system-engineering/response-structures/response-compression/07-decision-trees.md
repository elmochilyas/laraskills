# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** Response Compression
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Compression Layer: Server vs Application

---

### Decision Context

Choosing whether to implement compression at the web server layer (Nginx) or application layer (PHP middleware) based on architecture and performance requirements.

---

### Decision Criteria

* performance
* architectural
* maintainability

---

### Decision Tree

Is there a web server layer (Nginx, Caddy, HAProxy) between the client and the application?
├── YES → Use server-level compression
│   ├── Are JSON content types added to the compression config?
│   │   ├── YES → Verify: `gzip_types application/json application/vnd.api+json`
│   │   └── NO → Add JSON types — default configs only compress HTML/CSS/JS
│   └── Is there existing application-level compression that could double-compress?
│       ├── YES → Disable application-level compression
│       └── NO → Server-level compression only
└── NO → Serverless environment (Vapor, Lambda)? → Use platform-provided compression
    ├── API Gateway / CloudFront handles compression automatically
    └── No application code changes needed

---

### Rationale

Server-level compression is implemented in C (orders of magnitude faster than PHP), keeps application code simple, and eliminates double-compression risk. Default Nginx configs only compress HTML/CSS/JS — JSON types must be explicitly added.

---

### Recommended Default

**Default:** Nginx-level compression with `gzip on; gzip_types application/json application/vnd.api+json application/problem+json; gzip_comp_level 5; gzip_min_length 1000;`
**Reason:** Server-level compression offloads CPU from PHP, prevents double-compression, and is simpler to configure than middleware.

---

### Risks Of Wrong Choice

Application-level compression wastes PHP CPU and risks double-compression. Missing JSON types in server config leaves 70-90% bandwidth savings unrealized.

---

### Related Rules

* Compress at the Server Level, Not Application Level
* Add JSON Content Types to Compression Configuration

---

### Related Skills

* Compress Large API Responses to Reduce Bandwidth
* Response Caching Headers

---

---

## Compression Algorithm and Level Selection

---

### Decision Context

Choosing between gzip and brotli, and selecting the appropriate compression level based on client support and CPU budget.

---

### Decision Criteria

* performance
* architectural

---

### Decision Tree

Do clients (HTTP libraries, SDKs) universally support the compression algorithm?
├── Universal support required → Use gzip
│   ├── Is CPU budget constrained?
│   │   ├── YES → Level 5 (best CPU-to-compression ratio)
│   │   └── NO → Level 6 (slightly better ratio, similar CPU)
│   └── Is there a specific need for max compression?
│       ├── YES → Level 9 only if bandwidth is extremely constrained
│       └── NO → Level 5-6 is sufficient
└── Clients are primarily browsers → Support both gzip and brotli
    ├── Brotli preferred (10-20% better compression than gzip)
    │   ├── Brotli level 4-6 for best ratio
    │   └── Must fall back to gzip for clients without brotli support
    └── Gzip as universal fallback

---

### Rationale

gzip has universal client support and is sufficient for most APIs. Brotli offers better compression but fewer clients support it. Compression level 9 provides <2% better compression than level 6 but uses 3x more CPU — the marginal gain is not worth the cost.

---

### Recommended Default

**Default:** gzip level 5 for general-purpose APIs; gzip level 6 if CPU is not constrained; support both gzip and brotli for browser-facing APIs
**Reason:** gzip provides universal support; level 5 offers the best CPU-to-compression ratio; brotli adds marginal benefit for most non-browser HTTP clients.

---

### Risks Of Wrong Choice

Level 9 wastes 3x CPU for negligible compression gain. Brotli-only compression excludes clients without brotli support. Sub-1KB compression increases payload size.

---

### Related Rules

* Use gzip Compression Level 5-6
* Set a Compression Threshold of at Least 1KB

---

### Related Skills

* Content Negotiation
* Response Format Decision Framework

---

---

## BREACH Attack Mitigation

---

### Decision Context

Determining when to disable compression to prevent the BREACH attack, which exploits compression ratio changes when attacker-controlled input is reflected with secrets in compressed responses.

---

### Decision Criteria

* security
* reliability

---

### Decision Tree

Does the response body include both user-controlled input AND sensitive secrets?
├── YES → Disable compression for this endpoint
│   ├── Is the endpoint accessible to external, untrusted clients?
│   │   ├── YES → BREACH risk is real — disable compression
│   │   └── NO → Internal-only — lower risk, but still consider disabling
│   └── Can the secrets be moved to a separate, uncompressed channel?
│       ├── YES → Separate the secrets, keep compression for the rest
│       └── NO → Disable compression for the endpoint
└── NO → Compression is safe to enable
    └── Are there any other side-channel concerns?
        ├── YES → Evaluate individually
        └── NO → Enable compression normally

---

### Rationale

The BREACH attack exploits changes in compression ratio to recover secrets from HTTPS responses. Disabling compression on vulnerable endpoints eliminates the side channel while maintaining compression benefits on all other endpoints.

---

### Recommended Default

**Default:** Enable compression on all endpoints except those combining user input with secrets (CSRF tokens, session IDs, API keys)
**Reason:** BREACH is a real attack vector for endpoints that reflect user input alongside secrets; compression is safe everywhere else.

---

### Risks Of Wrong Choice

Enabling compression on BREACH-vulnerable endpoints allows secret recovery through repeated requests and compression ratio analysis. Disabling compression everywhere wastes bandwidth benefit.

---

### Related Rules

* Disable Compression on BREACH-Vulnerable Endpoints
* Generate ETags on Uncompressed Content

---

### Related Skills

* Response Caching Headers
* Conditional Requests
