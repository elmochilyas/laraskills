# Anti-Patterns: API Mesh and Service Mesh Integration Patterns

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit | API Mesh and Service Mesh Integration Patterns |
| Difficulty | Expert |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Adding Service Mesh Before Needing It | Architecture | High |
| 2 | Over-Reliance on Mesh-Level Circuit Breakers Without API-Aware Classification | Architecture | Medium |
| 3 | Uncoordinated Mesh and Application Rate Limiting | Architecture | High |
| 4 | Assuming Mesh mTLS Replaces Application-Level Authentication | Security | Critical |
| 5 | Mesh Configuration Without Failure Scenario Testing | Reliability | Critical |

---

## Anti-Pattern 1: Adding Service Mesh Before Needing It

### Category
Architecture

### Description
Deploying a full service mesh (Istio, Linkerd) for a single Laravel application or small handful of services consuming a few external APIs, introducing significant operational complexity without proportional benefit.

### Why It Happens
Service mesh is a popular buzzword in cloud-native architecture. Teams adopt it proactively believing it will solve future scaling problems, without assessing current integration complexity or operational capacity.

### Warning Signs
- Single Laravel application with a service mesh installed
- One or two external API integrations managed through mesh configuration
- No team member with Kubernetes CRD or Envoy configuration expertise
- Mesh operational incidents (sidecar crashes, config errors) consume more time than API integration issues

### Why Harmful
Service mesh adds sidecar proxy latency (1-5ms per request), resource overhead (sidecar containers), and operational burden (CRD management, control plane upgrades, mTLS certificate rotation). For simple integrations, application-level patterns (Guzzle middleware, Laravel Http facade, circuit breaker packages) provide the same resilience with zero infrastructure complexity.

### Real-World Consequences
- Developer productivity loss from managing mesh infrastructure instead of application features
- Increased cloud costs from sidecar resource consumption
- Deployment failures from mesh configuration errors unrelated to application changes
- Team friction between application developers and infrastructure engineers

### Preferred Alternative
Use application-level resilience patterns (retry middleware, circuit breaker via SaloonPHP or custom Guzzle middleware) for simple integration needs. Graduate to mesh only when the organization has 10+ services, Kubernetes-native deployment, and dedicated infrastructure engineering.

### Refactoring Strategy
1. Document all current mesh-managed external API integrations
2. Replace mesh-level circuit breakers and retries with application-level equivalents
3. Remove Istio ServiceEntry resources for simple external APIs
4. Evaluate mesh value: if all integrations work identically without mesh, uninstall
5. Retain mesh only for internal service-to-service mTLS if already needed for compliance

### Detection Checklist
- [ ] Number of external API integrations justifies mesh complexity
- [ ] Team has infrastructure engineering capacity for mesh operations
- [ ] Application-level patterns cannot provide equivalent resilience
- [ ] Mesh overhead (latency, cost, operational burden) is measured and justified
- [ ] Mesh graduated from simpler patterns, not adopted preemptively

### Related Rules/Skills/Trees
- Rule: Use service mesh for internal traffic; add API mesh for external integrations gradually
- Rule: Application-level circuit breaker coordinates with mesh-level
- Prerequisite: Kubernetes fundamentals, circuit breaker, rate limiting

---

## Anti-Pattern 2: Over-Reliance on Mesh-Level Circuit Breakers Without API-Aware Classification

### Category
Architecture

### Description
Relying exclusively on Envoy's outlier detection (mesh-level circuit breaker) for all failure handling, without implementing API-aware failure classification at the application level.

### Why It Happens
Mesh-level circuit breakers are easy to configure (YAML CRDs) and provide a single control point. Developers assume they cover all failure scenarios and skip application-level handling.

### Warning Signs
- All circuit breaker configuration is in mesh CRDs; no application-level circuit breaker code
- 403, 429, or 5xx responses from external APIs all treated equally by mesh
- No differentiation between rate limit responses (retry later) and auth failures (don't retry)
- Mesh ejects upstream hosts based on generic error counts without API semantics

### Why Harmful
Mesh-level circuit breakers operate on generic HTTP error codes and cannot distinguish between retryable errors (429 rate limit, 503 temporary overload) and non-retryable errors (401 auth failure, 403 forbidden, 400 bad request). Retrying auth failures wastes resources and may trigger account locks. Not retrying rate limits causes unnecessary failures.

### Real-World Consequences
- Account lockouts from retrying authentication failures through mesh
- Wasted retry volume on non-retryable errors consuming API rate limits
- Missed recovery opportunities from not retrying rate-limited requests
- Inconsistent error handling across different API integrations with different failure semantics

### Preferred Alternative
Implement application-level failure classification alongside mesh-level circuit breaking. Use mesh for generic protection (5xx flood, connection timeouts) and application-level for API-specific semantics (retry on 429, fail on 401).

```php
// Application-level classification
$response = Http::retry(3, 1000, function ($exception, $request) {
    return $exception->response?->status() === 429; // Only retry rate limits
});
```

### Refactoring Strategy
1. Add application-level HTTP client middleware that classifies responses by status code
2. Define per-API retry policies: retryable (429, 503), non-retryable (401, 403, 400)
3. Coordinate mesh outlier detection thresholds with application retry budgets
4. Keep mesh circuit breakers for infrastructure-level protection (connection floods)
5. Log and monitor circuit breaker trips at both levels to detect misconfiguration

### Detection Checklist
- [ ] Application-level failure classification exists for each API integration
- [ ] Retryable and non-retryable errors are handled differently
- [ ] Mesh outlier detection thresholds are coordinated with app retry budgets
- [ ] Circuit breaker trips at both levels are logged and monitored
- [ ] No API auth failures are retried through mesh mechanisms

### Related Rules/Skills/Trees
- Rule: Implement mesh-level circuit breaking for generic protection; keep application-level for API-specific logic
- Rule: Application-level circuit breaker coordinates with mesh-level
- Decision Tree: Circuit Breaker Strategy (layer coordination)

---

## Anti-Pattern 3: Uncoordinated Mesh and Application Rate Limiting

### Category
Architecture

### Description
Configuring rate limiting independently at both the mesh layer and application layer without coordination, resulting in double-limiting or contradictory policies that reduce throughput.

### Why It Happens
Mesh rate limiting is configured by infrastructure teams, while application rate limiting is configured by development teams. Without cross-team communication, both layers apply independent limits, each unaware of the other.

### Warning Signs
- Requests consistently fail at a lower rate than either limit individually would allow
- Rate limit errors come from both mesh and application responses
- Debugging rate limit issues requires checking two independent configurations
- No documentation coordinating mesh and application rate limit values
- Token-aware limits at application level conflict with request-count limits at mesh level

### Why Harmful
Uncoordinated double-limiting reduces effective throughput below what either layer would allow individually. Token-aware application limits can be negated by mesh request-count limits, or vice versa. Debugging becomes complex because failures could originate from either layer.

### Real-World Consequences
- Production throughput capped at the lower of two uncoordinated limits
- False rate limit triggers from cumulative effect of both layers
- Emergency limit increases fail because only one layer is adjusted
- Token-intensive LLM requests blocked by mesh-level RPM that doesn't account for token weight

### Preferred Alternative
Designate a primary rate limiting layer (application-level for token-aware, mesh-level for global request-count) and configure the secondary layer to be more permissive. Document the coordination strategy.

```php
// Application: primary token-aware limiter
$tpmLimiter->allow($estimatedTokens); // Fine-grained control

// Mesh: secondary, more permissive request-count limiter (2x application RPM)
// api-mesh-rate-limit: 200rpm (application allows 100rpm)
```

### Refactoring Strategy
1. Document current rate limits at both mesh and application layers
2. Designate primary layer (application for token-aware, mesh for global)
3. Set secondary layer limits 2-3x higher than primary to avoid double-limiting
4. Add rate limit header propagation between layers for debugging
5. Create cross-team documentation of coordinated rate limiting strategy

### Detection Checklist
- [ ] Primary rate limiting layer is explicitly designated
- [ ] Secondary layer limits are 2-3x more permissive
- [ ] Rate limit configurations are documented together
- [ ] Rate limit errors clearly indicate which layer rejected the request
- [ ] Coordination applies to both RPM and TPM limits

### Related Rules/Skills/Trees
- Rule: Mesh rate limiting is global but lacks token-aware limiting for LLM APIs
- Rule: Coordinate mesh-level and application-level circuit breaker configuration
- Related KU: Rate Limiting Algorithms (mesh-level vs application-level)

---

## Anti-Pattern 4: Assuming Mesh mTLS Replaces Application-Level Authentication

### Category
Security

### Description
Relying on service mesh mTLS for API authentication with external services, assuming the mesh's mutual TLS handles all identity and access requirements.

### Why It Happens
Mesh mTLS provides transparent certificate-based authentication between services. Developers see this working for internal traffic and assume the same mechanism applies to external API calls managed through the mesh.

### Warning Signs
- External API calls through the mesh have no application-level authentication headers
- API keys or tokens are not sent with requests; mTLS is assumed sufficient
- Mesh ServiceEntry resources configured without TLS origination or auth headers
- External API authentication relies solely on IP allowlisting at the mesh egress

### Why Harmful
Mesh mTLS authenticates the service (infrastructure identity) but not the application (user/tenant identity). External APIs require application-level authentication (API keys, OAuth tokens, JWTs) for authorization, tenant isolation, and audit logging. Without it, the mesh becomes a single point of authentication that leaks tenant context.

### Real-World Consequences
- External API requests rejected for missing authentication credentials
- Tenant isolation bypass: all requests authenticated as the mesh identity, losing per-user authorization context
- Audit trail gaps: external API logs show mesh identity, not the originating user
- Compliance violations when regulated APIs require per-request authentication

### Preferred Alternative
Use mesh mTLS for transport-layer security and service identity, but always supply application-level authentication credentials (API key, Bearer token, OAuth) in the request headers.

```php
// Application-level auth always sent regardless of mesh mTLS
Http::withToken($apiKey)->post('https://external-api.com/endpoint', $data);
// Mesh mTLS handles transport security; API key handles application auth
```

### Refactoring Strategy
1. Audit all external API calls through mesh for application-level auth credentials
2. Add API key/token injection middleware at application layer
3. Verify tenant/user context is preserved in outbound request headers
4. Remove assumption of mesh-managed authentication from integration documentation
5. Add test coverage that verifies auth credentials are sent with every request

### Detection Checklist
- [ ] Every external API call includes application-level authentication
- [ ] API key/token injection is not delegated to mesh configuration
- [ ] User/tenant context is preserved in API request headers
- [ ] No external API relies solely on mesh mTLS for authentication
- [ ] Audit logs capture both mesh identity and application identity

### Related Rules/Skills/Trees
- Rule: Mesh mTLS does not replace application-level API authentication
- Rule: External API credentials still managed at application layer
- Related KU: Laravel Http Facade API (authentication patterns)

---

## Anti-Pattern 5: Mesh Configuration Without Failure Scenario Testing

### Category
Reliability

### Description
Deploying mesh configuration changes (traffic splitting, circuit breaker thresholds, rate limits, ServiceEntry updates) to production without testing how the mesh behaves under failure scenarios.

### Why It Happens
Mesh configuration is infrastructure-as-code (YAML CRDs) that feels static and declarative. Teams apply CRD changes through GitOps workflows without simulating failures because the mesh is assumed to be reliable infrastructure.

### Warning Signs
- Mesh configuration changes are deployed without integration tests
- No chaos engineering or fault injection testing for mesh-managed traffic
- Sidecar crashes or control plane outages are discovered during incidents
- No documented recovery procedure for mesh configuration errors
- Team has never tested behavior when sidecar is removed or restarted

### Why Harmful
Mesh failures can completely disconnect applications from external APIs. A sidecar crash causes total network loss. A control plane outage prevents configuration changes from propagating, leaving misconfigured routes in place. Without testing, these failure modes are discovered during production incidents.

### Real-World Consequences
- Sidecar memory leak causes application to lose network connectivity in production
- Control plane outage during API migration leaves traffic routed to deprecated endpoints
- Envoy configuration error redirects external API traffic to wrong endpoint
- mTLS certificate expiry causes all service-to-service communication to fail silently

### Preferred Alternative
Test mesh failure scenarios as part of the deployment pipeline: sidecar crash recovery, control plane outage behavior, configuration rollback procedures, and circuit breaker threshold validation.

```yaml
# Testing checklist for mesh changes:
# 1. Apply config to staging; verify traffic flows correctly
# 2. Crash sidecar; verify application recovers when sidecar restarts
# 3. Simulate control plane outage; verify existing config continues working
# 4. Apply invalid config; verify rollback procedure
# 5. Verify circuit breaker thresholds with load testing
```

### Refactoring Strategy
1. Create a mesh failure testing plan covering: sidecar crash, control plane outage, invalid config, certificate expiry
2. Add mesh scenario tests to staging deployment pipeline
3. Document rollback procedures for each mesh component (sidecar, control plane, CRDs)
4. Implement mesh health monitoring separate from application health checks
5. Schedule regular chaos engineering exercises for mesh-managed traffic

### Detection Checklist
- [ ] Sidecar crash recovery procedure is documented and tested
- [ ] Control plane outage behavior is understood and tested
- [ ] Configuration rollback procedure exists and works
- [ ] Circuit breaker thresholds are validated with load testing
- [ ] Mesh health is monitored independently from application health
- [ ] mTLS certificate rotation is tested and automatic

### Related Rules/Skills/Trees
- Rule: Ensure mesh control plane is highly available (separate failure domain)
- Rule: Not testing mesh behavior under failure (sidecar crash, control plane outage)
- Related KU: Circuit Breaker Pattern (mesh vs application)
