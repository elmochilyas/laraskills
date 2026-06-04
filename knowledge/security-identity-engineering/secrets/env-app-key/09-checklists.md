# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Secrets Management
**Knowledge Unit:** .env management and APP_KEY
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: APP_KEY Pasted in Slack/Email**: Sharing keys via insecure channels â€” use password manager or Vault
- [ ] Prevent anti-pattern: No config:cache in Deployment Pipeline**: Production serves every request with uncached config, reading .env each time
- [ ] Prevent anti-pattern: APP_DEBUG=true in Production**: Exposes .env values in error pages â€” high-severity data leak
- [ ] `APP_KEY` generated via `php artisan key:generate`
- [ ] `.env` in `.gitignore` â€” key not in version control
- [ ] Each environment has unique key
- [ ] Key rotation procedure documented
- [ ] Enlightn APP_KEY strength check passes
- [ ] Avoid: Mistake
- [ ] Avoid: Committing `.env` to version control
- [ ] Avoid: Using the same APP_KEY across environments

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- `.env` files are per-environment and per-developer â€” never shared
- `config/` files read from `.env` via `env()` helper â€” use `env()` only in config files, not application code
- Cached config (`config:cache`) reads from `.env` at cache time â€” changes require re-caching
- `APP_KEY` can be set as an environment variable (server-level) instead of `.env` for higher security

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] `APP_KEY` generated via `php artisan key:generate`
- [ ] - [ ] `.env` in `.gitignore` â€” key not in version control
- [ ] - [ ] Each environment has unique key
- [ ] - [ ] Key rotation procedure documented

# Performance Checklist
- `env()` helper is slow â€” only use in `config/` files. Use `config()` in application code.
- `config:cache` loads all config into a single file â€” eliminates `env()` calls at runtime
- After `config:cache`, `.env` is no longer read until cache is cleared

# Security Checklist
- **APP_KEY Compromise**: If `APP_KEY` is leaked, an attacker can decrypt all encrypted data (sessions, cookies, encrypted model fields, signed URLs).
- **Committed Secrets**: A committed `.env` file exposes all secrets to anyone with repository access. Use `.gitignore` and secret scanning.
- **Key Rotation Impact**: Changing `APP_KEY` invalidates all existing encrypted data. Plan rotation windows carefully.
- **Debug Mode**: `APP_DEBUG=true` in production exposes `.env` values in error pages â€” always set `APP_DEBUG=false` in production.

# Reliability Checklist
- [ ] Ensure: The `.env` file is Laravel's configuration source of truth for environment-speci...

# Testing Checklist
- [ ] `APP_KEY` generated via `php artisan key:generate`
- [ ] `.env` in `.gitignore` â€” key not in version control
- [ ] Each environment has unique key
- [ ] Key rotation procedure documented
- [ ] Enlightn APP_KEY strength check passes
- [ ] Avoid: Mistake
- [ ] Avoid: Committing `.env` to version control
- [ ] Avoid: Using the same APP_KEY across environments

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: APP_KEY Pasted in Slack/Email**: Sharing keys via insecure channels â€” use password manager or Vault
- [ ] Prevent: No config:cache in Deployment Pipeline**: Production serves every request with uncached config, reading .env each time
- [ ] Prevent: APP_DEBUG=true in Production**: Exposes .env values in error pages â€” high-severity data leak
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Committing `.env` to version control
- [ ] Avoid mistake: Using the same APP_KEY across environments
- [ ] Avoid mistake: Not regenerating APP_KEY from template
- [ ] Avoid mistake: Using env() in application code

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
- APP_KEY Pasted in Slack/Email**: Sharing keys via insecure channels â€” use password manager or Vault
- No config:cache in Deployment Pipeline**: Production serves every request with uncached config, reading .env each time
- APP_DEBUG=true in Production**: Exposes .env values in error pages â€” high-severity data leak
## Skills
- Generate and Secure the Laravel APP_KEY


