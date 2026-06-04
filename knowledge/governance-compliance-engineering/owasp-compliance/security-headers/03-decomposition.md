# Decomposition: Security Headers for SOC 2 / ISO 27001

## Topic Overview
Security headers are HTTP response headers that instruct browsers to enforce security policies. For SOC 2 and ISO 27001 compliance, specific headers are required: `Strict-Transport-Security` (max-age >= 1 year), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy` (deployed in report-only mode initially, then enforce), and `Permissions-Policy`. Implementation in Laravel is straightforward via middleware or Nginx/Apache configuration.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
security-headers/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Security Headers for SOC 2 / ISO 27001
- **Purpose:** Security headers are HTTP response headers that instruct browsers to enforce security policies.
- **Difficulty:** Intermediate
- **Dependencies:** GCE-OWA-001 (owasp-top-10-2025) — Security misconfiguration (#2) includes missing headers, GCE-OWA-003 (laravel-security-hardening) — Headers as part of hardening checklist, GCE-COM-002 (evidence-collection-automation) — Header configuration evidence

## Dependency Graph
**Depends on:**
- GCE-OWA-001 (owasp-top-10-2025) — Security misconfiguration (#2) includes missing headers
- GCE-OWA-003 (laravel-security-hardening) — Headers as part of hardening checklist
- GCE-COM-002 (evidence-collection-automation) — Header configuration evidence

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Content-Security-Policy (CSP)
- Permissions-Policy
- Referrer-Policy: strict-origin-when-cross-origin
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GCE-OWA-001 (owasp-top-10-2025) — Security misconfiguration (#2) includes missing headers, GCE-OWA-003 (laravel-security-hardening) — Headers as part of hardening checklist, GCE-COM-002 (evidence-collection-automation) — Header configuration evidence

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization