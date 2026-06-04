# Skill: Exclude Incoming Webhook Routes from CSRF Protection

## Purpose
Configure Laravel's CSRF middleware to exclude incoming webhook endpoints so external services can POST payloads without requiring a CSRF token.

## When To Use
- Any incoming webhook receiving endpoint
- Third-party services sending POST webhooks to Laravel

## When NOT To Use
- Non-webhook routes where CSRF protection is needed

## Prerequisites
- Laravel app with CSRF middleware

## Workflow
1. Identify incoming webhook URL paths
2. Add paths to `$except` array in `VerifyCsrfToken` middleware
3. Use wildcards where multiple webhook URLs exist: `webhooks/*`
4. Consider using `routes/api.php` for webhooks where CSRF is not enforced
5. Test webhook endpoint POST without CSRF token
6. Verify other routes remain CSRF-protected

## Validation Checklist
- [ ] Webhook paths added to `$except` array
- [ ] Wildcard used for grouped webhook paths
- [ ] Non-webhook routes still CSRF-protected
- [ ] POST tested without CSRF token
- [ ] Alternative: using `routes/api.php` for webhooks
