# Decomposition: Frankenphp Installation Caddyfile

## Topic Overview
FrankenPHP is distributed as a **single binary** containing Caddy web server + embedded PHP via CGO. No separate Nginx/PHP-FPM setup needed. Configuration uses the `Caddyfile` with `php_server` and `php` directives. Worker mode maintains persistent PHP threads for maximum performance (3-5x vs FPM). Automatic HTTPS via ACME is built in.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
alternative-php-runtimes/frankenphp-installation-caddyfile/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Frankenphp Installation Caddyfile
- **Purpose:** FrankenPHP is distributed as a **single binary** containing Caddy web server + embedded PHP via CGO. No separate Nginx/PHP-FPM setup needed. Configuration uses the `Caddyfile` with `php_server` and `php` directives. Worker mode maintains persistent PHP threads for maximum performance (3-5x vs FPM). Automatic HTTPS via ACME is built in.
- **Difficulty:** Intermediate
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Running FrankenPHP in standard mode for high throughput
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