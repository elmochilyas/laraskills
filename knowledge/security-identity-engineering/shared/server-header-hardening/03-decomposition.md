# Decomposition: server header hardening

## Topic Overview

Server header removal is part of attack surface reduction — hiding the PHP version (`X-Powered-By`), Laravel version, and server software (Nginx/Apache version) from HTTP responses. These headers provide information that attackers use to identify vulnerable versions. Removal is typically configured at the web server level (Nginx/Apache) and PHP level (`expose_php = Off`), with Laravel's HTTP kernel handling application-level headers. Combined with security headers (HSTS, CSP, XFO), header h...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
server-header-hardening/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### server header hardening
- **Purpose:** Server header removal is part of attack surface reduction — hiding the PHP version (`X-Powered-By`), Laravel version, and server software (Nginx/Apache version) from HTTP responses. These headers provide information that attackers use to identify vulnerable versions. Removal is typically configured at the web server level (Nginx/Apache) and PHP level (`expose_php = Off`), with Laravel's HTTP kernel handling application-level headers. Combined with security headers (HSTS, CSP, XFO), header h...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: HTTP headers, Web server configuration (Nginx/Apache), Related: Security headers (HSTS, CSP, XFO, etc.), Enlightn static/dynamic security analysis, Advanced Follow-up: Web application firewall (WAF) header inspection, and Attack surface reduction beyond headers

## Dependency Graph
**Depends on:** Prerequisites: HTTP headers, Web server configuration (Nginx/Apache), Related: Security headers (HSTS, CSP, XFO, etc.), Enlightn static/dynamic security analysis, Advanced Follow-up: Web application firewall (WAF) header inspection, and Attack surface reduction beyond headers
**Depended on by:** Knowledge units that leverage or extend server header hardening patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for server header hardening.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization