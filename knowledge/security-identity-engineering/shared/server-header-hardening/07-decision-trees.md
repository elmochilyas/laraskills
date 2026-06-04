# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Additional Security Concerns
**Knowledge Unit:** Server Header Removal and Hardening
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Header Removal Layer Responsibility | Which layer handles which headers | coverage, responsibility |
| 2 | Testing and Verification Strategy | How to verify headers are properly removed | verification, automation |

---

# Architecture-Level Decision Trees

---

## Header Removal Layer Responsibility

---

## Decision Context

Which layer (web server, PHP-FPM, Laravel middleware) is responsible for removing which identifying HTTP headers.

---

## Decision Criteria

* coverage
* responsibility

---

## Decision Tree

Which header needs to be removed?
↓
`X-Powered-By` (PHP version) → PHP-FPM layer (`expose_php = Off` in php.ini) — PHP sends this header, not the web server
`Server` (web server version) → Web server layer (`server_tokens off` for Nginx, `ServerTokens Prod` for Apache)
Custom application headers → Laravel middleware (any package-added or middleware-added version headers)

Is the web server accessible (Nginx/Apache config)?
↓
YES → Configure `server_tokens off;` or `ServerTokens Prod` at the web server level
NO → Laravel middleware can remove `server` header as fallback (less effective — header may be added after Laravel processes response)

Is PHP-FPM config accessible?
↓
YES → Set `expose_php = Off` in `php.ini` or server-specific PHP config
NO → Laravel middleware can remove `X-Powered-By` as fallback (but better to config at PHP level)

Are there load balancers or reverse proxies?
↓
YES → Configure header removal at each intermediate layer (ALB, CloudFront, HAProxy add their own headers)
NO → Only web server + PHP-FPM + Laravel middleware needed

Are there custom middleware or packages that add version headers?
↓
YES → Add Laravel middleware to specifically remove those custom headers
NO → Standard header removal at web server and PHP layers is sufficient

---

## Rationale

Each layer adds its own identifying headers independently. PHP-FPM adds `X-Powered-By`; the web server adds `Server`; load balancers may add `Via`, `X-Amz-Cf-Id`, or custom headers; Laravel packages may add `X-App-Version`. Configuring only one layer leaves the other layers' headers exposed. Defense in depth requires configuring all layers because each layer has independent control over the response headers it sends.

---

## Recommended Default

**Default:** Nginx `server_tokens off;` + PHP `expose_php = Off` + Laravel global middleware removing `X-Powered-By` and `Server` as fallback; configure load balancers separately
**Reason:** Three-layer defense ensures header removal even if one layer's configuration is missed or overwritten. The Laravel middleware acts as a safety net for headers that web server or PHP-FPM configuration misses. Load balancer headers must be configured separately because they are outside Laravel's control.

---

## Risks Of Wrong Choice

- PHP-FPM only: web server `Server` header still leaks version
- Web server only: PHP `X-Powered-By` still leaks PHP version
- Laravel middleware only: headers may be added after middleware runs (web server adds them last)
- Not configuring load balancers: CloudFront/ALB add `Server` headers outside application control
- Custom version headers in middleware: explicitly adding `X-App-Version` defeats header removal purpose

---

## Related Rules

- Remove Server Version Headers at All Layers (05-rules.md)
- Never Add Custom Version Headers (05-rules.md)
- Test Header Removal After Every Deployment (05-rules.md)

---

## Related Skills

- Harden Server Headers to Conceal Technology Stack (06-skills.md)

---

## Testing and Verification Strategy

---

## Decision Context

How to verify that server-identifying headers have been properly removed from HTTP responses.

---

## Decision Criteria

* verification
* automation

---

## Decision Tree

What type of deployment environment?
↓
Production → Automated curl verification in monitoring (every response should be clean)
Staging → Pre-deployment header test in CI (block deployment if headers leak)
Development → Manual curl check or skip (development is not externally visible)

How is the application deployed?
↓
Container (Docker) → Test headers in container integration test + after deployment
Server (bare metal/VM) → Test headers in post-deployment job
Serverless → Test headers in post-deployment smoke test

Is there a CI/CD pipeline?
↓
YES → Add header leak test as a CI step (`curl -I https://staging.example.com`)
NO → Manual curl check on deployment checklist (less reliable)

What is the acceptable risk tolerance?
↓
Low → Weekly automated header audit + post-deployment check + alert on leak
Medium → Post-deployment check only
High → Manual check on major releases only

---

## Rationale

Header leaks are configuration issues that can be introduced at any time — a server restart may reset PHP-FPM config, a new deploy may overwrite Nginx config, a new load balancer may add headers. Automated verification ensures that header removal remains effective over time. The verification should use the same request path an attacker would use (`curl -I https://app.com`) and check for any headers containing version information.

---

## Recommended Default

**Default:** `curl -I` header leak test in CI/CD pipeline (pre-deployment check); weekly automated header audit in production; alert on any version-revealing header detected
**Reason:** Automated verification catches configuration drift immediately. Weekly audits catch changes that bypassed the deployment pipeline (manual server changes, infrastructure updates). Alerting ensures the team is notified of leaks between deployments.

---

## Risks Of Wrong Choice

- No header verification: headers leak for days or weeks before detection
- Only testing one path: app may remove headers on main page but leak on error pages
- Not testing after every deploy: new configuration introduced in deploy may add headers
- Only checking production: staging environment leak is still an information disclosure
- Not checking load balancer headers: CloudFront/ALB may add Server headers outside application control

---

## Related Rules

- Remove Server Version Headers at All Layers (05-rules.md)
- Test Header Removal After Every Deployment (05-rules.md)
- Add Header Leak Test to CI Pipeline (05-rules.md)

---

## Related Skills

- Harden Server Headers to Conceal Technology Stack (06-skills.md)
