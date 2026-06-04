# ECC Standardized Knowledge — Laravel Telescope Debugging for HTTP Client Calls

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | observability-monitoring |
| Knowledge Unit ID | ku-02 |
| Knowledge Unit | Laravel Telescope Debugging for HTTP Client Calls |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K029, K001, K010 |

## Overview (Engineering Value)
Laravel Telescope provides debug-level observability for HTTP client calls through the Http facade and SaloonPHP, capturing request/response details, timing, headers, and errors. For API integrations, Telescope is the primary debugging tool for inspecting outbound requests, diagnosing response issues, and understanding integration behavior. Its watchers for HTTP client calls, queue jobs, exceptions, and logs provide a comprehensive view of API integration activity.

## Core Concepts
- **HTTP Client Watcher**: Captures every outbound HTTP request through the Http facade
- **Request/Response Detail**: Full URL, method, headers, body, status, duration
- **Timing Information**: Request duration in milliseconds
- **Exception Context**: HTTP exceptions with full request context
- **SaloonPHP Integration**: `SentSaloonRequest` events captured by Telescope

## When To Use
- Development and staging debugging of API integrations
- Production debugging with sampling for performance issue detection
- Investigating integration failures with detailed request/response data
- Auditing outbound API calls during incident response

## When NOT To Use
- Production with full data capture on high-traffic applications
- For sensitive API calls containing PII or credentials
- Long-term monitoring (use Pulse or custom metrics instead)

## Best Practices
- Enable Telescope in local/staging with full data capture
- Enable in production with sampling (10-25%) for performance detection
- Use Telescope's `filter` callback to exclude health check noise
- Implement automatic pruning (24-48 hour retention typical)
- Combine Telescope with Horizon for complete integration observability

## Architecture Guidelines
- HTTP watcher registers Guzzle middleware for capture
- Entries stored in `telescope_entries` table with JSON columns
- Tag-based filtering: entries tagged with URL domain and HTTP method
- Saloon integration via event watcher for `SentSaloonRequest`
- Production: `TELESCOPE_ENABLED=false` + on-demand enable via filter

## Performance Considerations
- HTTP watcher middleware: ~0.5-2ms overhead per request
- Storage write: ~10-50ms depending on storage backend
- Response body storage grows proportionally to request volume
- Dashboard queries on large tables may be slow without indexing
- Pruning adds periodic write load

## Security Considerations
- Telescope captures request/response data including sensitive headers
- Redact sensitive data (Authorization, API keys) via filter
- Never enable full capture in production on high-traffic apps
- Restrict Telescope dashboard access with authentication
- Configure data retention policies for compliance

## Common Mistakes
- Leaving full capture enabled in production (storage overflow)
- Not pruning old entries (infinite storage growth)
- Capturing sensitive data (API keys in Authorization headers visible)
- Expecting Telescope to capture non-Http-facade HTTP calls
- Not filtering health check noise from Telescope entries

## Anti-Patterns
- Production full data capture on high-traffic applications
- Telescope as long-term monitoring solution
- No sensitive data redaction in captured entries
- Dashboard accessible without authentication

## Examples
```php
// Telescope filter for production (config/telescope.php)
'filter' => function ($entry) {
    if ($entry->type === 'request' && app()->environment('production')) {
        return mt_rand(1, 100) <= 10; // 10% sampling
    }
    return true;
},
```

## Related Topics
- **Prerequisites**: Laravel Http facade, Guzzle middleware
- **Closely Related**: Horizon monitoring, Pulse metrics, Saloon debugging
- **Advanced**: Custom Telescope watchers, production sampling strategies
- **Cross-Domain**: Debugging, observability, application performance monitoring

## AI Agent Notes
- Enable Telescope in dev environments for HTTP debugging
- Add sampling filter for production deployment
- Combine with Horizon for full integration lifecycle observability

## Verification
- [ ] Telescope enabled in local/staging with full data capture
- [ ] Production sampling configured (10-25%)
- [ ] Sensitive data redaction implemented via filter
- [ ] Automatic pruning configured (24-48h retention)
- [ ] Dashboard secured with authentication
- [ ] Health check noise filtered from entries
