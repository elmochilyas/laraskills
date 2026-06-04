# Rules — Circuit Breaker Patterns

## Rule 1: Always Provide a Fallback When Circuit Is Open
| Field | Value |
|-------|-------|
| **Name** | Always Provide a Fallback When Circuit Is Open |
| **Category** | Resilience & Degradation |
| **Rule** | Every circuit breaker must define a fallback behavior for when the circuit is open. Never leave open-circuit behavior undefined. |
| **Reason** | Without a fallback, the application throws a `CircuitOpenException` and the user sees a 500 error. The purpose of a circuit breaker is graceful degradation, not replacing one failure mode with another. Fallbacks include cached data, default values, queued retries, or degraded responses. |
| **Bad Example** | `$circuitBreaker->call(fn () => $api->charge(100))` — no fallback; user sees 500 error when circuit is open. |
| **Good Example** | `$circuitBreaker->call(fn () => $api->charge(100), fn () => $this->cachedPaymentResponse())` — returns cached response when circuit is open. |
| **Exceptions** | Operations where no meaningful fallback exists and failing fast is preferred (e.g., idempotent validation checks). |
| **Consequences Of Violation** | Users experience 500 errors when external dependencies fail; no graceful degradation. |

## Rule 2: Use Separate Circuit Breaker Instances Per Dependency
| Field | Value |
|-------|-------|
| **Name** | Use Separate Circuit Breaker Instances Per Dependency |
| **Category** | Isolation & Design |
| **Rule** | Create a dedicated circuit breaker instance for each external dependency. Never share one circuit breaker across multiple services. |
| **Reason** | A single circuit breaker across all dependencies creates cascading failures — one failing dependency opens the circuit for all others. Each dependency has different failure characteristics and thresholds. Payment gateway failures should not affect email service calls. |
| **Bad Example** | One `$globalCircuitBreaker` for payment gateway, email service, database, and cache — payment failure blocks all other calls. |
| **Good Example** | `$paymentBreaker`, `$emailBreaker`, `$cacheBreaker` — each with independent states and thresholds. |
| **Exceptions** | Dependencies that are part of the same logical service (e.g., multiple endpoints of the same third-party API). |
| **Consequences Of Violation** | Cascading failures; one degraded dependency causes all external calls to fail. |

## Rule 3: Count Only Server Errors as Failures
| Field | Value |
|-------|-------|
| **Name** | Count Only Server Errors as Failures |
| **Category** | Configuration & Accuracy |
| **Rule** | Configure circuit breakers to count only 5xx server errors and timeouts as failures. Never count 4xx client errors (400 Bad Request, 401 Unauthorized) as circuit failures. |
| **Reason** | Client errors indicate invalid requests from the application, not service unavailability. A bug that sends malformed requests should not open the circuit for all users. Server errors (5xx) and timeouts indicate the service itself is unhealthy. |
| **Bad Example** | Counting all HTTP errors as failures — a bug in the application sending bad requests opens the circuit for all users. |
| **Good Example** | Only counting connection timeouts and 5xx responses — valid client errors don't trigger circuit opening. |
| **Exceptions** | 429 Rate Limit responses that indicate the service is overwhelmed (configure separately). |
| **Consequences Of Violation** | Application bugs trigger circuit opening; legitimate client errors cause unnecessary degradation. |

## Rule 4: Use Redis for Circuit State Storage in Distributed Applications
| Field | Value |
|-------|-------|
| **Name** | Use Redis for Circuit State Storage in Distributed Applications |
| **Category** | Infrastructure & Consistency |
| **Rule** | Use Redis for circuit breaker state storage in multi-server applications. Use database storage only for single-server applications. |
| **Reason** | Redis atomic operations ensure consistent circuit state across multiple application servers. Database storage adds latency and may cause race conditions under high concurrency. In single-server applications, database storage is acceptable because there's no cross-server state to synchronize. |
| **Bad Example** | Using database storage for circuit breaker state in a 10-server application — potential race conditions; inconsistent circuit states across servers. |
| **Good Example** | Redis storage with atomic operations — consistent circuit state across all servers. |
| **Exceptions** | Applications where Redis is not available and database storage is the only option (accept race condition risk). |
| **Consequences Of Violation** | Inconsistent circuit states across servers; circuit may be open on one server and closed on another. |

## Rule 5: Reset Circuit State During Deployments
| Field | Value |
|-------|-------|
| **Name** | Reset Circuit State During Deployments |
| **Category** | Operations & Maintenance |
| **Rule** | Include circuit breaker state reset in the deployment script. Clear all circuit states after each deployment. |
| **Reason** | Previously open circuits may remain open after the dependency has been fixed. A deployment often includes fixes to dependency handling code. Without state reset, circuits remain open even though the underlying issue is resolved, causing unnecessary degradation after deployment. |
| **Bad Example** | Deploying a fix for payment gateway timeout handling — circuit remains open from pre-deployment failures; users still see degraded responses. |
| **Good Example** | Post-deploy step: `php artisan circuit-breaker:reset` — all circuits start fresh after deployment. |
| **Exceptions** | Zero-downtime deployments where old code is still running alongside new code (reset after old code drains). |
| **Consequences Of Violation** | Deployments fail to restore service availability; users experience degraded service after fixes are deployed. |

## Rule 6: Expose Circuit States in Health Endpoints
| Field | Value |
|-------|-------|
| **Name** | Expose Circuit States in Health Endpoints |
| **Category** | Observability & Monitoring |
| **Rule** | Include circuit breaker status for each dependency in the application health endpoint. Alert when circuits remain open for extended periods. |
| **Reason** | Circuit state is critical operational data. An open circuit means a dependency is unavailable and fallback code is active. Without health endpoint exposure, operations teams don't know that the application is running in degraded mode. Monitoring alerts on extended open-circuit states trigger investigation. |
| **Bad Example** | Circuit breaker opens for payment gateway — monitoring doesn't show circuit state; ops doesn't know users can't make payments. |
| **Good Example** | Health endpoint: `{ "services": { "payment_gateway": { "circuit": "open", "since": "2026-06-02T10:00:00Z" } } }` — ops alerted when open > 5 minutes. |
| **Exceptions** | Internal health check endpoints that shouldn't expose operational state publicly. |
| **Consequences Of Violation** | Operations unaware of degraded state; delayed response to external dependency failures. |
