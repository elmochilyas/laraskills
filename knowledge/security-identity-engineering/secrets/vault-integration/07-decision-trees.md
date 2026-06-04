# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Secrets Management
**Knowledge Unit:** HashiCorp Vault Integration
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Vault vs .env for Production Secrets | Secret storage architecture | operational, security |
| 2 | Auth Method Selection | How the app authenticates to Vault | architectural, security |
| 3 | Secret Engine Selection | KV vs Dynamic DB vs PKI vs Transit | use-case |

---

# Architecture-Level Decision Trees

---

## Vault vs .env for Production Secrets

---

## Decision Context

Whether to use HashiCorp Vault or traditional `.env` files for production secrets.

---

## Decision Criteria

* operational
* security

---

## Decision Tree

Is the application deployed across multiple servers or services?
↓
YES → Vault (centralized secrets distribution, consistent across instances)
NO → Single-server: .env with proper security may be sufficient

Are dynamic credentials (auto-rotating database passwords) needed?
↓
YES → Vault required (Vault database engine generates dynamic credentials)
NO → .env or Vault for static secrets

Is audit logging for secret access required (compliance)?
↓
YES → Vault (full audit trail for every secret access)
NO → .env is simpler

Does the organization have Vault operations expertise?
↓
YES → Vault is feasible (requires dedicated operations)
NO → .env with secrets manager (AWS SSM, GCP Secret Manager) — less operational overhead

What is the secret rotation frequency?
↓
Frequent (automated rotation) → Vault (automated rotation policies)
Infrequent (annual/manual) → .env or simple secrets manager

Is there existing Vault infrastructure?
↓
YES → Use existing Vault (avoid running two secrets systems)
NO → Evaluate: Vault setup cost vs benefit

---

## Rationale

Vault provides centralized secrets management, dynamic credentials, audit logging, and automated rotation — all valuable for larger deployments and compliance. However, Vault is operationally expensive (dedicated server, maintenance, expertise). For small deployments, `.env` with good security practices (outside web root, restricted permissions, not in git) is more practical. A middle ground is a cloud secrets manager (AWS SSM, GCP Secret Manager) which provides centralized storage without Vault's operational overhead.

---

## Recommended Default

**Default:** .env for small/medium deployments; cloud secrets manager (AWS SSM, GCP Secret Manager) as intermediate step; Vault only when dynamic credentials or multi-service secret distribution is required
**Reason:** Vault's operational complexity is not justified for simple deployments. Cloud secrets managers provide centralized storage and audit logging without the Vault maintenance burden. Vault's unique value (dynamic credentials, PKI, Transit encryption) only pays off in larger or compliance-driven environments.

---

## Risks Of Wrong Choice

- Vault for small app: operational overhead, Vault server becomes a single point of failure
- .env for large multi-service: secret distribution inconsistent, no audit trail
- No fallback when Vault is down: application-wide outage
- Vault token in .env: secrets management circular dependency

---

## Related Rules

- Use a Client Library for Vault Access (Never Shell Exec) (05-rules.md)
- Cache Vault Secrets With a TTL and Refresh Gracefully (05-rules.md)
- Implement Vault Connection Failure Fallback (05-rules.md)

---

## Related Skills

- Integrate HashiCorp Vault for Centralized Secrets Management (06-skills.md)

---

## Auth Method Selection

---

## Decision Context

How the Laravel application authenticates to Vault — token, AppRole, Kubernetes, AWS IAM, or LDAP.

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

What is the deployment platform?
↓
Kubernetes → Kubernetes auth (automatic, short-lived tokens via service account)
AWS EC2/ECS → AWS IAM auth (instance profile-based, no static credentials)
Azure VM → Azure MSI auth (managed identity, no static credentials)
Bare metal/VM → AppRole or token auth

Is automated token rotation required?
↓
YES → Kubernetes auth, AWS IAM auth, or AppRole (all support automated lifecycle)
NO → Static token (simplest but longest-lived)

What is the security requirement for token lifetime?
↓
Short-lived (hours) → Kubernetes or AWS IAM auth (automated, short-lived)
Long-lived (days/weeks) → AppRole or token (easier setup, longer exposure)

Is there an existing IAM integration?
↓
YES → Use platform auth (Kubernetes, AWS IAM, Azure MSI) — no separate Vault credentials
NO → AppRole or token (requires managing Vault credentials)

What is the operational complexity budget?
↓
Low → Token auth (simplest: set token in env variable)
Medium → AppRole (role ID + secret ID, supports rotation)
High → Platform auth (Kubernetes/AWS IAM — best security, more setup)

---

## Rationale

Platform-native auth methods (Kubernetes, AWS IAM, Azure MSI) are the most secure — they provide short-lived tokens without managing additional credentials. AppRole is the next best option for non-cloud deployments, supporting secret ID rotation. Static tokens are the simplest but least secure (long-lived, no rotation). The auth method should match the deployment platform for the best security/ops balance.

---

## Recommended Default

**Default:** Kubernetes auth (on Kubernetes), AWS IAM auth (on AWS), AppRole (on bare metal/VM), token (development only)
**Reason:** Platform-native auth eliminates the need to manage Vault credentials separately — the platform handles authentication. AppRole provides a good balance for non-cloud deployments. Static tokens should only be used in development.

---

## Risks Of Wrong Choice

- Token auth in production: long-lived token, difficult to rotate, exposed if .env leaks
- No auth method configured: Vault access denied on every request
- Root token: full Vault admin access (catastrophic if compromised)
- Token in version control: Vault access exposed to all repository readers

---

## Related Rules

- Authenticate With Vault Using a Short-Lived Token (05-rules.md)
- Restrict Vault Policies to the Minimum Necessary Paths (05-rules.md)

---

## Related Skills

- Integrate HashiCorp Vault for Centralized Secrets Management (06-skills.md)

---

## Secret Engine Selection

---

## Decision Context

Choosing the Vault secret engine — KV (key-value), Database (dynamic credentials), PKI (certificates), or Transit (encryption-as-a-service).

---

## Decision Criteria

* use-case

---

## Decision Tree

What type of secret is being stored?
↓
Static secrets (API keys, configuration values) → KV engine (key-value store)
Database credentials → Database engine (dynamic, auto-rotating credentials)
TLS certificates → PKI engine (auto-generated, short-lived certificates)
Encryption/decryption service → Transit engine (encryption-as-a-service, no key management)

Are dynamic (short-lived, auto-rotated) credentials needed?
↓
YES → Database engine (for DB creds), PKI engine (for certs)
NO → KV engine (static secrets)

Is the secret consumed by another application or service?
↓
YES → KV or Database engine (Vault distributes to authorized consumers)
NO → KV or Transit engine (application-local consumption)

Is this a compliance environment requiring short-lived credentials?
↓
YES → Database engine (auto-rotating DB passwords) or PKI engine (short-lived certs)
NO → KV engine (static secrets, rotated manually or on schedule)

Does the application need encryption capability without managing keys?
↓
YES → Transit engine (Vault handles key management, app calls encrypt/decrypt)
NO → KV engine (store pre-encrypted values)

---

## Rationale

Each Vault secret engine serves a specific purpose. KV is for static secrets (API keys, config). Database engine generates dynamic, short-lived database credentials with automatic rotation. PKI engine issues short-lived TLS certificates. Transit engine provides encryption-as-a-service — the application sends plaintext, Vault returns ciphertext. For most applications, KV is the starting point; Database and PKI engines are added as needs grow.

---

## Recommended Default

**Default:** KV engine for static secrets (API keys, configuration); Database engine for dynamic database credentials (if Vault is justified)
**Reason:** KV is the simplest engine and covers most secret storage needs. The Database engine provides the highest value-add for Vault (auto-rotating database passwords) and is the most common reason teams adopt Vault. PKI and Transit are specialized engines for specific infrastructure needs.

---

## Risks Of Wrong Choice

- KV for database credentials: static passwords, no rotation (same as .env)
- Database engine without lease renewal: application loses DB access mid-operation
- PKI without certificate renewal automation: expired certificates cause outages
- Transit for everything: operational overhead, latency for simple encryption needs
- KV version enabled without versioning config: accidental secret overwrite loses history

---

## Related Rules

- Use Vault's Dynamic Database Secrets, Not Static Credentials (05-rules.md)
- Restrict Vault Policies to the Minimum Necessary Paths (05-rules.md)

---

## Related Skills

- Integrate HashiCorp Vault for Centralized Secrets Management (06-skills.md)
