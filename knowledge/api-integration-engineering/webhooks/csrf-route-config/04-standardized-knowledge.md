# ECC Standardized Knowledge — CSRF Token Handling for Webhook Routes

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | incoming-webhooks |
| Knowledge Unit ID | ku-08 |
| Knowledge Unit | CSRF Token Handling for Webhook Routes |
| Difficulty | Beginner |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K003, K004, K015 |

## Overview (Engineering Value)
Laravel applies CSRF protection to all web routes by default, but webhook requests from external systems cannot provide a CSRF token. These routes must be explicitly excluded from the CSRF middleware to avoid 419 errors. Proper exclusion configuration ensures security is maintained for other routes while allowing webhook endpoints to accept unsigned requests.

## Core Concepts
- **CSRF Protection**: Laravel's VerifyCsrfToken middleware validates tokens on POST/PUT/DELETE
- **Webhook Routes**: Endpoints receiving callbacks from external systems with no user session
- **Exclusion Configuration**: `$except` array in `App\Http\Middleware\VerifyCsrfToken`
- **Route Grouping**: Isolating webhook routes to apply exclusion precisely
- **Alternative Auth**: Webhooks authenticated via signature verification, not CSRF

## When To Use
- Any webhook route in a Laravel application
- Third-party integration callback URLs
- Payment gateway webhooks (Stripe, PayPal, etc.)

## When NOT To Use
- API routes (api.php) which don't have CSRF middleware
- Routes consumed by first-party frontend with session
- Internal routes not exposed to external callers

## Best Practices
- Use route prefix (`/webhook/`) to group webhook routes and exclude by pattern
- Exclude with wildcards: `/webhook/*`
- Never exclude all routes from CSRF
- Use signature verification as alternative auth for webhook routes
- Keep exclusion list minimal and specific

## Architecture Guidelines
- Webhook routes in `routes/web.php` under `/webhook/` prefix
- CSRF exclusion by path pattern in middleware
- Signature verification middleware on webhook routes
- Separate route file for webhooks if many exist

## Performance Considerations
- CSRF middleware adds ~0.5ms per request
- Excluded routes skip middleware entirely
- No performance impact from proper exclusion

## Common Mistakes
- Forgetting to exclude webhook routes → 419 expired errors
- Excluding entire route groups with overly broad patterns
- Adding webhook routes to api.php to avoid CSRF (wrong semantics)
- Excluding routes without adding alternative auth
- Hardcoding full URLs instead of path-based exclusion

## Related Topics
- **Prerequisites**: Laravel routing, CSRF protection basics
- **Closely Related**: Webhook verification, signature validation
- **Advanced**: Custom CSRF exemption middleware, route model binding
- **Cross-Domain**: Laravel security, middleware pipeline

## Verification
- [ ] Webhook routes excluded from CSRF protection
- [ ] Exclusion uses path pattern, not full URL
- [ ] Alternative authentication on webhook routes (signature)
- [ ] Exclusion list minimal and documented
- [ ] Non-webhook routes still have CSRF protection
