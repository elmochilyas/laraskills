# Skill: Exclude Webhook Routes from CSRF Protection

## Purpose
Configure Laravel's CSRF middleware to exclude webhook receiving endpoints so external services can POST payloads without a CSRF token.

## When To Use
- Any webhook receiving endpoint in a Laravel application
- Third-party services sending POST requests to your app

## When NOT To Use
- Internally-called routes where CSRF protection is desired
- Non-webhook routes

## Prerequisites
- Laravel app with CSRF middleware enabled

## Workflow
1. Identify webhook URL paths in `routes/web.php`
2. Add paths to `$except` array in `VerifyCsrfToken` middleware
3. Use exact path or wildcard: `webhook/*`
4. Verify webhook routes appear in `$except` array
5. Test webhook endpoint with POST without CSRF token
6. Consider using `routes/api.php` instead for webhooks (no CSRF)

## Validation Checklist
- [ ] Webhook paths added to `$except` array in `VerifyCsrfToken`
- [ ] Wildcards used correctly for multiple webhook paths
- [ ] Non-webhook routes still CSRF-protected
- [ ] Webhook POST tested without CSRF token
- [ ] Considered using `routes/api.php` for webhook routes
