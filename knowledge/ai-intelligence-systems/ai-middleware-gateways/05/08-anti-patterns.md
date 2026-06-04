# ECC Anti-Patterns — Gateway Authentication & Key Management

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Middleware & Gateways |
| **Knowledge Unit** | Gateway Authentication & Key Management |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. API Keys Hardcoded in Gateway Configuration
2. No Key Rotation Schedule — Keys Never Changed
3. Shared Keys Across Environments — Dev Key Works in Production
4. No Key Usage Monitoring — Can't Detect Compromised Keys
5. Keys in Version Control — Credential Leak

---

## Repository-Wide Anti-Patterns

- Keys stored in plaintext in config files
- No per-service/per-tenant API keys

---

## Anti-Pattern 1: Hardcoded Keys in Gateway Config

### Category
Security

### Description
API keys stored in gateway configuration files committed to version control.

### Preferred Alternative
Use environment variables or secrets manager. Inject keys at deploy time.

### Detection Checklist
- [ ] Keys in config files
- [ ] Keys in version control
- [ ] No secrets manager

---

## Anti-Pattern 2: No Key Rotation

### Category
Security

### Description
API keys never rotated — a compromised key remains valid indefinitely.

### Preferred Alternative
Implement key rotation schedule. Use gateway to manage multiple valid keys during rotation.

### Detection Checklist
- [ ] No key rotation
- [ ] Same keys since deployment
- [ ] No rotation process documented
