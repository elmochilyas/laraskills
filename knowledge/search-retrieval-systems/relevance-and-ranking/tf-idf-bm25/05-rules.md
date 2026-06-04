---
## Rule Name
Use BM25 Over TF-IDF for Production

## Category
Performance

## Rule
Always use BM25 ranking over raw TF-IDF for production keyword search systems.

## Reason
BM25 consistently outperforms TF-IDF by including term frequency saturation and document length normalization.

## Bad Example
```sql
-- TF-IDF in PostgreSQL FTS (default ts_rank)
SELECT id, ts_rank(fts_vector, query) AS score FROM documents WHERE fts_vector @@ query;
```

## Good Example
```sql
-- BM25 in PostgreSQL FTS (ts_rank_cd with normalization)
SELECT id, ts_rank_cd(fts_vector, query, 32) AS score FROM documents WHERE fts_vector @@ query;
```

## Exceptions
Legacy systems or engines that only support TF-IDF (MySQL FULLTEXT).

## Consequences Of Violation
Suboptimal keyword search relevance — common terms inflate scores, variable document lengths bias results.

---
## Rule Name
Tune BM25 k1 and b Parameters

## Category
Performance

## Rule
Always tune BM25's k1 (term frequency saturation) and b (length normalization) parameters for your corpus.

## Reason
Default parameters (k1=1.2, b=0.75) are general-purpose. Your content's document length and term frequency distribution may benefit from different values.

## Bad Example
```php
// Using defaults without testing — suboptimal for corpus
Product::search($query)->get();
```

## Good Example
```php
// PostgreSQL FTS: set k1 and b
DB::statement("ALTER DATABASE app SET default_text_search_config = 'pg_catalog.english'");
// Elasticsearch/Meilisearch: tune via engine config
// Test k1=0.5-3.0, b=0.5-1.0 for your data
```

## Exceptions
Engines that don't expose BM25 parameter tuning (Scout defaults).

## Consequences Of Violation
Suboptimal keyword ranking — either term saturation too high/low or length normalization badly calibrated.

---
## Rule Name
Weight Title Fields Higher Than Body

## Category
Design

## Rule
Always order searchable attributes with title/name fields before body/content in config.

## Reason
Most search engines rank results based on field order — earlier fields have higher weight. Title matches are more relevant than body matches.

## Bad Example
```php
// Body before title — body matches dilute title relevance
'searchableAttributes' => ['body', 'title', 'tags']
```

## Good Example
```php
// Title first — highest relevance weight
'searchableAttributes' => ['title', 'tags', 'body']
```

## Exceptions
Content types where body content is more meaningful than titles (legal documents, transcripts).

## Consequences Of Violation
Diminished title relevance, resulting in less relevant top results.

---
## Rule Name
Use BM25 as Baseline for Relevance

## Category
Testing

## Rule
Always use BM25 as the baseline metric when evaluating search relevance improvements.

## Reason
BM25 is the established standard for keyword search. Any custom ranking or alternative approach should demonstrably outperform BM25.

## Bad Example
```bash
# No baseline — cannot measure improvement
```

## Good Example
```php
$bm25Ndcg = evaluate(fn() => bm25Search($query));
$customNdcg = evaluate(fn() => customSearch($query));
if ($customNdcg <= $bm25Ndcg) {
    // Custom ranking not adding value — revert to BM25
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Deploying ranking changes that don't improve search quality over standard BM25.
