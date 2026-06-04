---
## Rule Name
Start with Auto-Embeddings

## Category
Architecture

## Rule
Use Meilisearch's built-in auto-embedding models before configuring external embedding providers.

## Reason
Auto-embeddings eliminate external API dependencies and simplify setup. Upgrade to external embeddings only if quality needs justify the complexity.

## Bad Example
```php
// External embeddings from day one — unnecessary complexity
Product::search($query)->options(['hybrid' => ['embedder' => 'openai']]);
```

## Good Example
```php
// Built-in auto-embeddings first
Product::search($query)->options(['hybrid' => ['semanticRatio' => 0.7, 'embedder' => 'default']]);
```

## Exceptions
Content requiring higher embedding quality than built-in models provide (domain-specific vocabulary).

## Consequences Of Violation
Unnecessary API costs and external dependencies when built-in models suffice.

---
## Rule Name
Tune semanticRatio for Content Type

## Category
Performance

## Rule
Always tune the `semanticRatio` parameter based on your content type and query patterns.

## Reason
Different content benefits from different keyword-vector balances. Product catalogs (exact names) need lower semanticRatio; documentation (conceptual queries) benefits from higher.

## Bad Example
```php
Product::search($query)->options(['hybrid' => ['semanticRatio' => 0.5]]);  // One-size-fits-all
```

## Good Example
```php
// Products: rely more on keyword match
$ratio = $contentType === 'product' ? 0.3 : 0.7;
Product::search($query)->options(['hybrid' => ['semanticRatio' => $ratio]]);
```

## Exceptions
Homogeneous content where one ratio works universally.

## Consequences Of Violation
Suboptimal search results — either too much keyword noise or too much semantic drift.

---
## Rule Name
Benchmark Hybrid Against Keyword-Only

## Category
Testing

## Rule
Always benchmark hybrid search quality against a keyword-only baseline before declaring improvement.

## Reason
Hybrid search adds latency and indexing complexity. If keyword-only achieves comparable recall, hybrid overhead is unjustified.

## Bad Example
```bash
# Enabling hybrid without benchmarking — assumed improvement
```

## Good Example
```php
$keywordRecall = benchmark(fn() => Product::search($query)->get());
$hybridRecall = benchmark(fn() => Product::search($query)->options(['hybrid' => [...]])->get());
if ($hybridRecall['ndcg'] <= $keywordRecall['ndcg'] + 0.02) {
    // Stick with keyword-only
}
```

## Exceptions
Applications where semantic understanding is a hard requirement regardless of benchmark results.

## Consequences Of Violation
Added latency and complexity without measurable search quality improvement.
