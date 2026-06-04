# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Shared Security Concerns
**Knowledge Unit:** Server header removal and hardening
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: No header removal at all**: PHP version, server version, and framework version exposed in every response.
- [ ] Prevent anti-pattern: Relying solely on Laravel middleware**: Web server and PHP-FPM headers are outside Laravel's control.
- [ ] Prevent anti-pattern: Not including header hardening in provisioning**: Each new server requires manual configuration.
- [ ] `expose_php = Off` in `php.ini`
- [ ] Nginx `server_tokens off;` or Apache `ServerTokens Prod`
- [ ] No X-Powered-By header in responses
- [ ] Server header does not reveal version
- [ ] Curl verification confirms no tech stack leakage
- [ ] Avoid: Mistake
- [ ] Avoid: Removing only web server header, not PHP
- [ ] Avoid: Only configuring on production

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Nginx: `server_tokens off;`
- Apache: `ServerTokens Prod`
- PHP-FPM: `expose_php = Off` in `php.ini`
- Laravel global middleware: remove `X-Powered-By` and any package-added headers
- Load balancers (ALB, CloudFront, HAProxy): configure separately

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] `expose_php = Off` in `php.ini`
- [ ] - [ ] Nginx `server_tokens off;` or Apache `ServerTokens Prod`
- [ ] - [ ] No X-Powered-By header in responses
- [ ] - [ ] Server header does not reveal version

# Performance Checklist
- Zero performance impact â€” header removal is a configuration change, not a runtime operation
- Middleware-based removal adds negligible overhead (<0.01ms per request)

# Security Checklist
- **Security by Opacity**: Hiding server versions does not make the application more secure against determined attackers â€” but it eliminates easy reconnaissance for automated scanners.
- **Not a Replacement**: Header removal is complementary to, not a replacement for, proper vulnerability patching and security hardening.
- **Load Balancer Headers**: CloudFront, ALB, and HAProxy may add their own Server or Via headers. Configure them separately.

# Reliability Checklist
- [ ] Ensure: Server header removal is part of attack surface reduction â€” hiding the PHP ver...

# Testing Checklist
- [ ] `expose_php = Off` in `php.ini`
- [ ] Nginx `server_tokens off;` or Apache `ServerTokens Prod`
- [ ] No X-Powered-By header in responses
- [ ] Server header does not reveal version
- [ ] Curl verification confirms no tech stack leakage
- [ ] Enforcement checked in CI pipeline
- [ ] Avoid: Mistake
- [ ] Avoid: Removing only web server header, not PHP
- [ ] Avoid: Only configuring on production

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No header removal at all**: PHP version, server version, and framework version exposed in every response.
- [ ] Prevent: Relying solely on Laravel middleware**: Web server and PHP-FPM headers are outside Laravel's control.
- [ ] Prevent: Not including header hardening in provisioning**: Each new server requires manual configuration.
- [ ] Prevent: Only checking production, not staging**: Staging environments also leak version information.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Removing only web server header, not PHP
- [ ] Avoid mistake: Only configuring on production
- [ ] Avoid mistake: Assuming header removal is complete

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Anti-Patterns
- No header removal at all**: PHP version, server version, and framework version exposed in every response.
- Relying solely on Laravel middleware**: Web server and PHP-FPM headers are outside Laravel's control.
- Not including header hardening in provisioning**: Each new server requires manual configuration.
- Only checking production, not staging**: Staging environments also leak version information.
## Skills
- Harden Server Headers to Conceal Technology Stack


