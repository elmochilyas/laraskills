# Decomposition: Frankenphp Architecture Caddy Cgo Sapi

## Topic Overview
FrankenPHP is built on three layers: **Caddy** (Go web server — HTTP/3, automatic HTTPS, ACME), **CGO bridge** (Go ? C binding embedding the PHP interpreter), and **custom SAPI** (`frankenphp_sapi_module` — a complete Server API implementation). This architecture eliminates the Nginx/PHP-FPM intermediary entirely, reducing latency and operational complexity.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
alternative-php-runtimes/frankenphp-architecture-caddy-cgo-sapi/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Frankenphp Architecture Caddy Cgo Sapi
- **Purpose:** FrankenPHP is built on three layers: **Caddy** (Go web server — HTTP/3, automatic HTTPS, ACME), **CGO bridge** (Go ? C binding embedding the PHP interpreter), and **custom SAPI** (`frankenphp_sapi_module` — a complete Server API implementation). This architecture eliminates the Nginx/PHP-FPM intermediary entirely, reducing latency and operational complexity.
- **Difficulty:** Foundation
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Vehicle model
  - Runtime selection flow

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

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