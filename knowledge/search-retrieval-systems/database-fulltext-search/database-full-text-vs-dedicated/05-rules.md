## Start with Database Engine for New Projects
---
## Category
Architecture
---
## Rule
Always start new Laravel projects with Scout's database engine and only migrate to a dedicated engine when scale or feature requirements demand it.
---
## Reason
The database engine requires zero infrastructure, zero cost, and zero operations. Most applications never outgrow it. Prematurely adopting a dedicated engine adds unnecessary complexity and cost.
---
## Bad Example
```php
// New blog app with 100 posts — deployed Meilisearch server
// Unnecessary ops overhead for tiny dataset
```
---
## Good Example
```php
// config/scout.php
'driver' => env('SCOUT_DRIVER', 'database')

// Only switch when hitting scale limits or needing typo tolerance
```
---
## Exceptions
Applications that require typo tolerance, faceted search, or personalization from day one.
---
## Consequences Of Violation
Unnecessary infrastructure cost, operational complexity, maintenance burden.

## Never Use Collection Engine in Production
---
## Category
Reliability
---
## Rule
Always set `SCOUT_DRIVER` to a production-viable engine (`database`, `meilisearch`, `typesense`, or `algolia`) in production environments.
---
## Reason
The collection engine loads ALL searchable records into PHP memory and filters them in-process. On datasets over a few hundred records, this causes memory exhaustion and seconds-long response times.
---
## Bad Example
```php
// .env.production
SCOUT_DRIVER=collection // 50K records loaded into memory on every search
```
---
## Good Example
```php
// .env.local
SCOUT_DRIVER=collection

// .env.production
SCOUT_DRIVER=database
```
---
## Exceptions
No exceptions — collection engine is documented as development-only.
---
## Consequences Of Violation
Memory exhaustion crashes, slow responses, production outages.

## Plan Migration Path From Database to Dedicated Engine
---
## Category
Maintainability
---
## Rule
Always document a migration path from the database engine to a dedicated search engine early, even if starting with the database engine.
---
## Reason
Index settings, ranking configurations, and filterable attributes differ per engine. Planning ahead avoids painful rework when migration becomes necessary.
---
## Bad Example
```php
// No migration plan — when app grows, team scrambles to redesign
```
---
## Good Example
```php
// docs/search-migration.md
// 1. Current: Scout database engine with SearchUsingFullText
// 2. Migration: Set SCOUT_DRIVER=meilisearch, configure filterable attrs
// 3. Full re-index: php artisan scout:import
// 4. Verify: Run acceptance tests with new engine
```
---
## Exceptions
Applications guaranteed to never exceed database engine scale limits.
---
## Consequences Of Violation
Painful emergency migration, data inconsistencies, extended downtime during switch.
