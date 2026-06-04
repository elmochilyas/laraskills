## Default to Saloon + Spatie for New Integrations
---
## Category
Architecture
---
## Rule
Start new API integrations with SaloonPHP (HTTP client) and Spatie webhook packages (client + server); add additional packages only for specific gaps.
---
## Reason
This default stack covers 80% of integration needs: structured API calls (Saloon), webhook receiving (Spatie client), and webhook sending (Spatie server).
---
## Bad Example
```php
// Building custom HTTP client — reinventing Saloon
```
---
## Good Example
```json
{
    "require": {
        "saloonphp/saloon": "^4.0",
        "spatie/laravel-webhook-client": "^3.0",
        "spatie/laravel-webhook-server": "^3.0"
    }
}
```
---
## Exceptions
Single-endpoint, no-auth API calls where Http facade suffices.
---
## Consequences Of Violation
Unnecessary custom code, missing features (auth, pagination, middleware), higher maintenance burden.
## Choose Managed Gateway Only for 10K+ Daily Webhooks
---
## Architecture
---
## Rule
Use self-hosted Spatie webhook server for under 10,000 webhooks per day; evaluate managed gateways (Convoy, Svix) only for higher volumes.
---
## Reason
Spatie handles 10K/day easily with a single queue worker; managed gateways add cost but provide auto-scaling for higher volumes.
---
## Bad Example
```php
// Managed gateway for 500 webhooks/day — unnecessary cost and complexity
```
---
## Good Example
```php
$volume = WebhookOutbox::whereDate('created_at', today())->count();
$dispatcher = $volume > 10000 ? new GatewayDispatcher($gateway) : new SpatieDispatcher();
```
---
## Exceptions
Strict compliance or data residency requirements preventing self-hosting.
---
## Consequences Of Violation
Unnecessary gateway costs at low volumes, or scaling issues at high volumes with self-hosted approach.
## Pin Package Versions with Caret Constraints
---
## Maintainability
---
## Rule
Pin package versions with `^` constraints (e.g., `"saloonphp/saloon": "^4.0"`) and review lockfile changes on `composer update`.
---
## Reason
Floating constraints (`dev-master`, `*`) cause unpredictable updates; caret constraints allow safe minor/patch updates while preventing major breakage.
---
## Bad Example
```json
"saloonphp/saloon": "dev-master" // floating — unpredictable updates
```
---
## Good Example
```json
"saloonphp/saloon": "^4.0" // safe minor/patch updates
```
---
## Exceptions
Active development where latest features are critical.
---
## Consequences Of Violation
Breaking changes introduced by automatic updates, production outages from unexpected package incompatibility.
## Add Circuit Breaker for All External API Calls
---
## Reliability
---
## Rule
Implement circuit breaker (algoyounes for sync, Fuse for queue jobs) for every external API call; never call external APIs without protection.
---
## Reason
Without circuit breakers, a single failing external service exhausts workers and connections, causing cascading failures across all integrations.
---
## Bad Example
```php
Http::get('/stripe/balance'); // no circuit breaker — failure cascades
```
---
## Good Example
```php
if ($breaker->isOpen('stripe')) { throw new ServiceUnavailableException('stripe'); }
Http::get('/stripe/balance');
```
---
## Exceptions
Internal-only APIs with guaranteed availability.
---
## Consequences Of Violation
Failing service exhausts resources, cascading failures, all outbound calls blocked.
## Verify Package Health Before Adoption
---
## Maintainability
---
## Rule
Before adopting a package, verify: recent commits (within 6 months), GitHub stars, test CI status, and explicit Laravel 13 support.
---
## Reason
Abandoned packages accumulate security vulnerabilities and may not work with current Laravel versions; health verification prevents adopting dead dependencies.
---
## Bad Example
```php
// Adopts unmaintained package — no updates for 2 years
```
---
## Good Example
```php
// Checks: last commit < 6 months, CI passing, Laravel 13 in support matrix
composer require square1-io/laravel-idempotency "^1.0"
```
---
## Exceptions
Packages that are feature-complete and stable despite infrequent commits.
---
## Consequences Of Violation
Security vulnerabilities unpatched, Laravel upgrade blocked by incompatible package, forced migration under pressure.
## Document Package Choices with Justification
---
## Maintainability
---
## Rule
Record each package selection decision in an architecture decision record with rationale and alternatives considered.
---
## Reason
Without documentation, future developers don't know why a package was chosen or what alternatives were rejected, leading to re-evaluation churn.
---
## Bad Example
```php
// No ADR — future dev wonders: "Why Saloon and not OpenAPI generator?"
```
---
## Good Example
```php
// docs/adr/001-use-saloon-for-http-client.md
// Title: Use SaloonPHP for HTTP Client
// Decision: SaloonPHP v4
// Rationale: Connector/Request pattern, plugin ecosystem, Laravel integration
// Alternatives: Http facade (too simple for multi-endpoint), vendor SDK (not available)
```
---
## Exceptions
Self-evident package choices (Stripe PHP SDK for Stripe integration).
---
## Consequences Of Violation
Re-evaluation churn, inconsistent package selection across projects, knowledge loss on team changes.
## Run composer audit Weekly
---
## Security
---
## Rule
Schedule `composer audit` to run weekly and alert on detected vulnerabilities.
---
## Reason
Package transitive dependencies introduce vulnerabilities over time; regular audits catch them before exploits are published.
---
## Bad Example
```php
// No audit — vulnerabilities go undetected for months
```
---
## Good Example
```bash
# Scheduled: composer audit && notify on vulnerabilities
0 9 * * 1 cd /app && composer audit --format=json | notify-slack
```
---
## Exceptions
Air-gapped environments without internet access for audit.
---
## Consequences Of Violation
Unpatched vulnerabilities in production, compliance violations, security incidents from known CVEs.
