# Skill: Generate and Secure the Laravel APP_KEY

## Purpose
Generate a cryptographically secure `APP_KEY` for Laravel's encryption and signed URL functionality, ensuring it is stored securely and never exposed in version control.

## When To Use
- Every Laravel application — APP_KEY is mandatory
- New project setup
- Key rotation (compromise, staff change, compliance)

## When NOT To Use
- None — APP_KEY is required for all Laravel applications

## Prerequisites
- Laravel project initialized
- `.env` file configured

## Workflow
1. Generate key: `php artisan key:generate` (creates 32-byte base64-encoded AES-256 key)
2. Verify `APP_KEY=base64:...` in `.env` file
3. Ensure `.env` is in `.gitignore` — never commit the key
4. Use environment-specific keys per environment (dev, staging, production)
5. Document key rotation procedure: decrypt all data with old key, re-encrypt with new key
6. For team development: share the key via a secure channel (password manager, not Slack)
7. Never hardcode `APP_KEY` in `config/app.php`

## Validation Checklist
- [ ] `APP_KEY` generated via `php artisan key:generate`
- [ ] `.env` in `.gitignore` — key not in version control
- [ ] Each environment has unique key
- [ ] Key rotation procedure documented
- [ ] Enlightn APP_KEY strength check passes
