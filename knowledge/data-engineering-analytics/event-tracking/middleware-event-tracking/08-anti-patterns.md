# Anti-Patterns: Middleware-Based Event Tracking Patterns

## Middleware Doing Enrichment
The middleware performs geo-IP lookups, user-agent parsing, or other enrichment synchronously. This blocks terminate(), delays subsequent middleware callbacks, and couples the tracking pipeline to external service availability.

**Solution:** Middleware captures raw event data; all enrichment is performed in downstream queue jobs.

## Tracking Before Authentication
The analytics middleware executes before the auth middleware, capturing events with null user IDs. The event data is queued before the user is authenticated, and the middleware never re-captures after auth resolves.

**Solution:** Ensure analytics middleware executes after auth middleware in the middleware priority list.

## No Skip Logic for AJAX/API Routes
Tracking middleware captures every API request and AJAX call, flooding the analytics pipeline with background noise. A single-page application generates hundreds of API calls per page view, each tracked as a separate event.

**Solution:** Skip API routes from tracking unless they represent meaningful user actions. Track only page loads and explicit user interactions.

## Inconsistent Event Naming
The middleware captures route URLs as event names, but route URLs change during development. "/posts/123" becomes "/articles/123" after a refactor, breaking all trend analysis.

**Solution:** Use route names as event identifiers, not URLs. Route names are stable across URL structure changes.
