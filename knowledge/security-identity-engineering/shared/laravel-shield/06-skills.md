# Skill: Quick-Scan Laravel Security with Laravel-Shield CLI

## Purpose
Run Laravel-Shield security scanning CLI for fast (<10 seconds) detection of critical Laravel-specific misconfigurations: weak APP_KEY, exposed .env, debug mode, and hardcoded credentials.

## When To Use
- Pre-deployment quick check — runs in under 10 seconds
- CI/CD integration as a fast security gate
- Scheduled scans to detect configuration drift

## When NOT To Use
- As a replacement for comprehensive security scanning (Enlightn)
- For deep business logic or authorization analysis
- Production runtime scanning

## Prerequisites
- `composer require mana007777/laravel-shield` (or equivalent)
- Published config

## Workflow
1. Install Laravel-Shield via Composer
2. Run initial scan: `php artisan shield:scan`
3. Integrate in CI: `php artisan shield:scan --ci`
4. Review results — Shield checks ~20 critical items
5. Fix identified issues (weak APP_KEY, exposed .env, debug mode)
6. Schedule periodic scans: daily cron for configuration drift detection
7. Use alongside Enlightn for layered security coverage

## Validation Checklist
- [ ] Shield installed and scan runs without errors
- [ ] CI pipeline includes `php artisan shield:scan --ci`
- [ ] All identified issues addressed
- [ ] Scheduled scans detect configuration drift
- [ ] Shield runs alongside Enlightn for comprehensive coverage
