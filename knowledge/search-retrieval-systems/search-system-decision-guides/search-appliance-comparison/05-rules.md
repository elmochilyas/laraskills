---
## Rule Name
Start with Scout Database Engine

## Category
Architecture

## Rule
Use Laravel Scout's database engine before adopting a dedicated search appliance for datasets under 50K records.

## Reason
The database engine requires zero infrastructure and is sufficient for small datasets. Dedicated engines add operational complexity without benefit at small scale.

## Bad Example
```php
// Self-hosting Meilisearch for 5K records — unnecessary infrastructure
```

## Good Example
```php
// config/scout.php
'driver' => env('SCOUT_DRIVER', 'database'),
// Switch to Meilisearch/Typesense only when >50K records or advanced features needed
```

## Exceptions
Applications needing advanced search features (typo tolerance, faceting, instant search) even at small scale.

## Consequences Of Violation
Unnecessary infrastructure, devops burden, and cost for small datasets.

---
## Rule Name
Benchmark with Production Data Before Choosing

## Category
Testing

## Rule
Always benchmark at least two search engines with production-representative data before making a final decision.

## Reason
Each engine performs differently depending on data shape, query patterns, and volume. Benchmarks reveal the best fit.

## Bad Example
```bash
# Choosing based on popularity — may not match your data profile
```

## Good Example
```php
$engines = ['meilisearch', 'typesense'];
$results = [];
foreach ($engines as $engine) {
    $results[$engine] = benchmark($engine, $realData, $querySet);
}
// Choose engine with best p95 latency + recall for your workload
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Selecting an engine that performs poorly with your specific data and query patterns.

---
## Rule Name
Account for Total Cost of Ownership

## Category
Scalability

## Rule
Always factor in operational costs (hosting, maintenance, ops time) not just software licensing when choosing a search engine.

## Reason
Self-hosting Meilisearch/Typesense may appear free, but server costs and devops time often exceed Algolia's per-query pricing for small-to-medium deployments.

## Bad Example
```bash
# Choosing self-hosted because "free" — ignoring $200/month server + ops time
```

## Good Example
```bash
# TCO comparison:
# Algolia: $0.50/1000 queries × 100K queries = $50/month
# Typesense self-hosted: $100/month VPS + 5 hours ops time
# Choose based on real TCO, not just license cost
```

## Exceptions
Compliance requirements requiring self-hosting.

## Consequences Of Violation
Hidden operational costs exceeding anticipated budget.

---
## Rule Name
Use Scout Abstraction for Future Migration

## Category
Architecture

## Rule
Always use Scout's abstraction layer rather than engine-specific SDKs for basic search operations.

## Reason
Scout's interface is consistent across engines. Using it directly enables switching engines without rewriting search code.

## Bad Example
```php
// Direct Meilisearch SDK — tightly coupled
$results = $meiliClient->search('products', $query);
```

## Good Example
```php
// Scout abstraction — engine-switchable
Product::search($query)->get();
```

## Exceptions
Engine-specific features (faceting, geo-search, synonym management) that Scout doesn't abstract.

## Consequences Of Violation
High migration cost when switching search engines.
