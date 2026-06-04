## Use Mesh for Enterprise Scale; Application-Level for Simple Deployments
---
## Category
Architecture
---
## Rule
Implement service/API mesh only for enterprise-scale (10+ microservices, many external APIs); use application-level patterns for simpler deployments.
---
## Reason
Mesh adds significant operational complexity (sidecar proxies, control plane, infrastructure-as-code) without proportional benefit for small deployments.
---
## Bad Example
```php
// Istio mesh for a single Laravel app consuming 2 APIs — over-engineering
```
---
## Good Example
```php
// Application-level patterns for simple deployments
$client = new Client(['timeout' => 30]);
// Mesh only when scaling to 10+ services and many external APIs
```
---
## Exceptions
Existing Kubernetes infrastructure with mesh already deployed.
---
## Consequences Of Violation
Operational overhead without benefit, infrastructure complexity, debugging difficulty for simple integration issues.
## Model External APIs as Istio ServiceEntry Resources
---
## Category
Architecture
---
## Rule
When using service mesh, model all external APIs as Istio `ServiceEntry` resources with DNS resolution.
---
## Reason
ServiceEntry resources bring external APIs under mesh observability and traffic management, providing latency, error rate, and traffic metrics per external API.
---
## Bad Example
```yaml
// External APIs not modeled — no mesh observability or traffic management
```
---
## Good Example
```yaml
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: stripe-api
spec:
  hosts:
  - api.stripe.com
  ports:
  - number: 443
    name: https
    protocol: TLS
  resolution: DNS
```
---
## Exceptions
APIs accessed via SDKs that bypass HTTP-based routing.
---
## Consequences Of Violation
No mesh observability for external API calls, inability to apply mesh-level traffic policies, blind spot in mesh telemetry.
## Combine Mesh Observability with Application-Level Logging
---
## Category
Observability
---
## Rule
Use mesh telemetry for latency, error rate, and traffic metrics; augment with application-level context for detailed debugging.
---
## Reason
Mesh telemetry provides infrastructure-level metrics but lacks application context (which user, which operation); both are needed for full observability.
---
## Bad Example
```php
// Only mesh telemetry — no application context for debugging
```
---
## Good Example
```php
// Mesh provides latency/error metrics
// Application adds context
Log::info('Stripe charge', [
    'user_id' => $user->id,
    'charge_id' => $charge->id,
    'amount' => $charge->amount,
    'mesh_latency' => $meshLatency,
]);
```
---
## Exceptions
None — always combine mesh and application observability.
---
## Consequences Of Violation
Unable to correlate infrastructure metrics with application context, slow debugging, incomplete incident response.
## Coordinate Mesh-Level and Application-Level Circuit Breakers
---
## Category
Architecture
---
## Rule
Configure mesh-level circuit breakers (Envoy outlier detection) for generic protection; keep application-level breakers for API-specific failure classification.
---
## Reason
Mesh breakers treat all 5xx similarly; application breakers distinguish retryable (503) from non-retryable (501) errors, enabling finer-grained control.
---
## Bad Example
```php
// Mesh circuit breaker + no application breaker — all 5xx treated equally
```
---
## Good Example
```php
// Mesh: generic 5xx protection (Envoy outlier detection)
// Application: API-specific classification
if ($response->status() === 503) { $breaker->reportFailure(); } // retryable
// 501 not reported — non-retryable
```
---
## Exceptions
Simple integrations where mesh-level protection is sufficient.
---
## Consequences Of Violation
Mesh treats non-retryable errors as retryable (wasting resources) or application breakers conflict with mesh breakers (overlapping protection).
## Keep External API Auth at Application Level
---
## Category
Security
---
## Rule
Manage external API authentication (API keys, tokens, OAuth) at the application level, not the mesh level.
---
## Reason
Mesh mTLS handles service-to-service identity but cannot manage per-API authentication credentials with different rotation schedules and scopes.
---
## Bad Example
```yaml
// Attempting mesh-level API key management — inflexible and unscalable
```
---
## Good Example
```php
// Application-level auth
class StripeConnector extends Connector {
    protected function defaultHeaders(): array {
        return ['Authorization' => 'Bearer '.config('services.stripe.secret')];
    }
}
// Mesh handles mTLS, network-level traffic management only
```
---
## Exceptions
APIs with mesh-level identity solutions (SPIFFE-based auth).
---
## Consequences Of Violation
Inflexible credential management, inability to rotate per-service credentials independently, security misconfiguration.
