# Decomposition: Web Server Architectures

## Topic Overview
PHP can integrate with web servers via multiple architectures: **CGI** (process-per-request, obsolete), **FastCGI** (persistent process pool), **PHP-FPM SAPI** (modern FastCGI implementation with process management), and **embedded SAPI** (PHP linked directly into the web server — FrankenPHP, Apache mod_php). PHP-FPM serves ~80%+ of production deployments; embedded SAPI powers Octane-era runtimes.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-engine-performance/web-server-architectures/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Web Server Architectures
- **Purpose:** PHP can integrate with web servers via multiple architectures: **CGI** (process-per-request, obsolete), **FastCGI** (persistent process pool), **PHP-FPM SAPI** (modern FastCGI implementation with process management), and **embedded SAPI** (PHP linked directly into the web server — FrankenPHP, Apache mod_php). PHP-FPM serves ~80%+ of production deployments; embedded SAPI powers Octane-era runtimes.
- **Difficulty:** Foundation
- **Dependencies:
  - Nothing Architecture | Memory-Resident Architecture | PHP-FPM Process Manager Modes
  - --

## Dependency Graph
**Depends on:**
  - Nothing Architecture | Memory-Resident Architecture | PHP-FPM Process Manager Modes
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Nginx + PHP-FPM
  - Pipeline model
  - Bottleneck-first approach

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