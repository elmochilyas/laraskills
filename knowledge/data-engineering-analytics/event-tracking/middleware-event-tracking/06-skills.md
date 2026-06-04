# Skills: Middleware-Based Event Tracking Patterns

## Skill: Building an Analytics Tracking Middleware
**Purpose:** Implement performant, production-ready event tracking middleware.
**When to use:** Adding analytics capture to a Laravel application.
**Steps:**
1. Create middleware class that implements `terminate()`
2. Define a DTO for captured event data (URL, method, status, user, agent, IP, duration)
3. Register middleware with a route alias (e.g., `track`)
4. Assign middleware to specific route groups requiring tracking
5. Implement skip logic for internal paths and ignored routes
6. Dispatch event data to a queue job for async processing
7. Configure middleware ordering in Kernel.php
8. Test with PHPUnit: assert job dispatched on tracked routes, not skipped routes

## Skill: Middleware Performance Optimization
**Purpose:** Ensure analytics middleware does not degrade application performance.
**When to use:** Optimizing existing analytics middleware for high-traffic applications.
**Steps:**
1. Profile terminate() execution time with Laravel Telescope or custom timing
2. Move all enrichment out of middleware into queue jobs
3. Replace synchronous tracking with queue dispatch
4. Implement batch dispatching for extremely high throughput
5. Verify middleware execution order is correct (auth, consent, then tracking)
6. Test under load: measure p95 and p99 response times with and without middleware
7. Monitor queue backlog: ensure tracking jobs are processed before the next request burst
