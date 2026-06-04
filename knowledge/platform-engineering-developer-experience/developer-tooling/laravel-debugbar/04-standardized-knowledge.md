# 04-Standardized Knowledge: Laravel Debugbar

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | developer-tooling-debugging |
| **Knowledge Unit** | laravel-debugbar |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | debugbar-collectors-profiling, laravel-telescope, log-viewer-debugging-patterns |
| **Framework/Language** | Laravel Debugbar, PHP, Laravel |

## Overview

Laravel Debugbar is a browser toolbar displaying debugging info during development. Captures: DB queries (bindings, duration, stack traces), route/request details, views+data, events/listeners, mail previews, log entries, cache operations, session data, auth state, timing/memory profiling. Integrates via middleware and event listeners. Installed via Composer, publishes `config/debugbar.php`, renders as floating toolbar. 19.2k+ GitHub stars, most popular Laravel debugging tool.

## Core Concepts

- **Toolbar Rendering**: JavaScript/CSS toolbar injected into HTML response, collapsible tabs
- **Data Collectors**: modular collectors capturing specific debugging categories
- **Middleware Integration**: captures request data at start/end of request lifecycle
- **Event Listeners**: hooks into `QueryExecuted`, `ViewRendered`, `MailSent` events
- **AJAX Debugging**: captures AJAX requests, displays in dedicated tab
- **Configuration**: `config/debugbar.php` controls enabled state, IP whitelist, collector selection, storage, rendering mode

## When to Use

- Development debugging of database queries, view data, request lifecycle
- Identifying N+1 queries and slow operations during development
- Inspecting data flow through views and events
- Quick performance profiling of individual requests

## When NOT to Use

- Production environments (security risk, performance overhead)
- JSON/API responses (corrupts response format)
- Automated testing/CI (no browser toolbar context)
- When historical/deferred debugging is needed (use Telescope instead)

## Best Practices (WHY)

- **Disable in production**: `DEBUGBAR_ENABLED=false` — exposes DB queries with values, session data, app internals
- **Disable for API routes**: `Debugbar::disable()` in API middleware to prevent response corruption
- **Use IP whitelisting**: on staging, restrict via `DEBUGBAR_ALLOWED_IPS` env var
- **Selective collectors in staging**: enable only needed collectors to minimize overhead
- **Avoid during performance testing**: Debugbar adds 50-200ms overhead, producing inaccurate benchmarks

## Architecture Guidelines

- Register as middleware at end of stack for full request lifecycle capture
- Disable for non-HTML responses (JSON, XML, file downloads, streamed responses)
- Use `Debugbar::startMeasure()`/`stopMeasure()` for custom code section profiling
- Clear Debugbar data on redirect to avoid memory accumulation

## Performance Considerations

- Query capture: 0.1-0.5ms per query (500 queries = 50-250ms overhead)
- Memory: 5-10MB additional for pages with many queries/large view data
- Response size: 20-200KB added to HTML
- AJAX debugging adds ~5ms per request overhead

## Security Implications

- Debugbar exposes DB queries with values, session contents, env config, app internals
- Must be disabled in production — critical security vulnerability if enabled
- Use IP whitelisting on staging environments
- Toolbar can leak password hashes, API tokens in query form data

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Enabled in production | Exposes all request data to users | Critical security breach | Auto-disable via APP_DEBUG=false |
| Not disabled for JSON | Toolbar injected into API responses | Broken API consumers | Disable in API middleware |
| Used during perf testing | 50-200ms added overhead | Inaccurate benchmarks | Disable before testing |
| Enabled on staging without IP whitelist | Anyone can view debug data | Data exposure | Use whitelist |
| Full capture with large datasets | Memory exhaustion | PHP crash | Limit query capture, disable on heavy pages |

## Anti-Patterns

- **Permanent full capture**: leaving all collectors enabled even when only query data is needed
- **Debugbar as primary debugging tool for complex issues**: use Telescope for multi-request analysis

## Examples

```php
// config/debugbar.php selective collectors (staging)
'collectors' => [
    'queries' => true,
    'routes' => false,
    'views' => false,
    'mail' => true,
    'log' => true,
],
```

## Related Topics

- debugbar-collectors-profiling — detailed collector patterns
- laravel-telescope — historical/request-scoped debugging
- log-viewer-debugging-patterns — log-based debugging

## AI Agent Notes

- When scaffolding, add Debugbar to `require-dev` with auto-config
- Generate code with environment checks for Debugbar disabling

## Verification

- [ ] Debugbar disabled in production
- [ ] API routes excluded
- [ ] IP whitelist configured for staging
- [ ] Collector selection matches environment
- [ ] Not installed in production dependencies
