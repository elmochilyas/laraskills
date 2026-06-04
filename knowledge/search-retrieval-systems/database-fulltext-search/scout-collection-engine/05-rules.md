## Never Use Collection Engine in Production
---
## Category
Reliability
---
## Rule
Always set `SCOUT_DRIVER` to a production-viable engine (`database`, `meilisearch`, `typesense`, or `algolia`) in production environments.
---
## Reason
The collection engine loads ALL searchable records into PHP memory on every request and filters them with `Str::is()` — O(n) memory and CPU per search, causing memory exhaustion and timeouts on any non-trivial dataset.
---
## Bad Example
```php
// .env.production
SCOUT_DRIVER=collection // Loads all records into memory per search
```
---
## Good Example
```php
// .env.local — collection is fine for dev
SCOUT_DRIVER=collection

// .env.production — use a real engine
SCOUT_DRIVER=database
```
---
## Exceptions
No exceptions. The collection engine is explicitly documented as development-only.
---
## Consequences Of Violation
Memory exhaustion crashes, multi-second response times, production outages.

## Test with the Production Engine, Not Just Collection
---
## Category
Testing
---
## Rule
Always run search-related tests against the actual production engine (or `Scout::fake()`) in CI — not just the collection engine.
---
## Reason
Collection engine behavior differs significantly from real engines: it lacks relevance ranking, proper pagination, filtering, and typo tolerance. Passing tests with the collection engine does not guarantee correct behavior in production.
---
## Bad Example
```php
// Tests only run with SCOUT_DRIVER=collection
// Production breaks because ranking behavior differs
```
---
## Good Example
```php
// phpunit.xml
<env name="SCOUT_DRIVER" value="collection"/>

// But also run search-specific tests with Scout::fake()
public function test_search_ranking(): void
{
    Scout::fake();
    // Test with production-like behavior
}
```
---
## Exceptions
No common exceptions — always verify against the target engine.
---
## Consequences Of Violation
Search bugs reaching production, ranking issues, pagination failures.

## Configure Per Environment in .env Files
---
## Category
Code Organization
---
## Rule
Always configure `SCOUT_DRIVER` per environment using `.env` files, never hardcode it in `config/scout.php`.
---
## Reason
Hardcoding the driver prevents environment-specific configuration. Developers need the collection engine locally, CI needs it in tests, and production needs a real engine — all from the same codebase.
---
## Bad Example
```php
// config/scout.php
'driver' => 'collection', // All environments use collection
```
---
## Good Example
```php
// config/scout.php
'driver' => env('SCOUT_DRIVER', 'collection'),

// .env.local — override not needed (default is collection)
// .env.production
SCOUT_DRIVER=database
```
---
## Exceptions
No common exceptions — always use environment configuration.
---
## Consequences Of Violation
Production accidentally running collection engine, development misconfigured.
