## Build a Test Collection Before Optimizing

---
## Category
Testing | Reliability

---
## Rule
Create a curated test collection of 100-500 query-relevant document pairs before making any retrieval optimizations; never tune retrieval parameters without a baseline measurement.

---
## Reason
Without a test collection and baseline metrics, you cannot measure whether changes improve or degrade retrieval quality. Optimization without measurement is guesswork.

---
## Bad Example
```php
// Tuning chunk size without measuring impact
public function optimize(): void {
    $this->chunker = new SemanticChunker(256); // Guess
}
```

---
## Good Example
```php
class RetrievalOptimizer {
    public function __construct(
        private array $testQueries, // 100+ curated pairs
        private RetrievalEvaluator $evaluator,
    ) {}

    public function findBestChunkSize(): array {
        $candidates = [256, 384, 512, 768, 1024];
        $results = [];

        foreach ($candidates as $size) {
            $pipeline = $this->buildPipeline($size);
            $metrics = $this->evaluator->evaluate($pipeline, $this->testQueries);
            $results[$size] = $metrics;
            Log::info("Chunk size {$size}: recall@5={$metrics->avgRecallAt5}");
        }

        return $results;
    }
}
```

---
## Exceptions
Prototype systems with no production users may start with defaults and build a test collection later.

---
## Consequences Of Violation
Retrieval changes may silently degrade quality, no ability to measure improvement, wasted effort on ineffective optimizations.

---

## Measure Both Precision and Recall

---
## Category
Testing | Reliability

---
## Rule
Track both Precision@K and Recall@K metrics when evaluating retrieval quality; never measure one without the other.

---
## Reason
Precision alone hides missed relevant documents. Recall alone hides noise in results. Together they provide a complete picture — high precision means no irrelevant noise, high recall means no missed relevant documents.

---
## Bad Example
```php
public function evaluate(RetrievalPipeline $pipeline, array $testQueries): array {
    return [
        'precision_at_5' => $this->avgPrecision($pipeline, $testQueries, 5),
        // Only precision — no recall measurement
    ];
}
```

---
## Good Example
```php
public function evaluate(RetrievalPipeline $pipeline, array $testQueries): EvaluationResult {
    $precisionAt5 = $this->avgPrecision($pipeline, $testQueries, 5);
    $recallAt5 = $this->avgRecall($pipeline, $testQueries, 5);
    $recallAt10 = $this->avgRecall($pipeline, $testQueries, 10);

    Log::info("Retrieval quality: P@5={$precisionAt5}, R@5={$recallAt5}, R@10={$recallAt10}");

    return new EvaluationResult(
        avgPrecisionAt5: $precisionAt5,
        avgRecallAt5: $recallAt5,
        avgRecallAt10: $recallAt10,
    );
}
```

---
## Exceptions
When the use case strictly requires no false positives (e.g., legal discovery, compliance audits), precision-only may be acceptable with documented rationale.

---
## Consequences Of Violation
Missed relevant documents go undetected, retrieval optimization improves one metric at the expense of the other.

---

## Segment Evaluation by Query Type

---
## Category
Testing | Reliability

---
## Rule
Evaluate retrieval quality separately for different query types (factual, comparative, procedural); never average all query types into a single score.

---
## Reason
Different query types have different optimal strategies. Factual queries need high precision, procedural queries need completeness. Averages hide category-specific failures.

---
## Bad Example
```php
$overallScore = $evaluator->evaluate($pipeline, $allQueries);
// Average score hides category-specific issues
```

---
## Good Example
```php
class SegmentedEvaluation {
    public function run(RetrievalPipeline $pipeline): array {
        $results = [];
        foreach ($this->queryCategories as $category => $queries) {
            $metrics = $this->evaluator->evaluate($pipeline, $queries);
            $results[$category] = $metrics;
            Log::info("Category '{$category}': P@5={$metrics->avgPrecisionAt5}, R@5={$metrics->avgRecallAt5}");
        }
        return $results;
    }
}

// Query categories:
$categories = [
    'factual' => [/* who, what, when queries */],
    'procedural' => [/* how-to queries */],
    'comparative' => [/* vs, compared to queries */],
    'keyword' => [/* proper nouns, codes */],
];
```

---
## Exceptions
Systems with a single query type (e.g., FAQ lookup) need only one evaluation segment.

---
## Consequences Of Violation
Poor performance on specific query categories hidden by overall averages, certain user segments get bad results.

---

## Automate Evaluation in CI

---
## Category
Maintainability | Reliability

---
## Rule
Run retrieval quality evaluation automatically in CI/CD pipelines whenever the retrieval code changes; never deploy retrieval changes without automated quality validation.

---
## Reason
Chunking, embedding, search, and reranking changes can silently degrade retrieval quality. Automated CI gates catch regressions before they reach production.

---
## Bad Example
```php
// Retrieval changes deployed without validation
git push origin main
// Pipeline deploys without running quality checks
```

---
## Good Example
```yaml
# .github/workflows/retrieval-eval.yml
name: Retrieval Quality Check
on: [pull_request]
jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: composer install
      - run: php artisan rag:evaluate --min-recall@5=0.80
```

---
## Exceptions
Prototype systems or rapid development phases may defer CI integration.

---
## Consequences Of Violation
Silent retrieval regressions deployed to production, declining answer quality unnoticed until user complaints.

---

## Track Quality Metrics Over Time

---
## Category
Observability | Maintainability

---
## Rule
Chart retrieval quality metrics (precision, recall, MRR) weekly and alert on significant deviations; never assume retrieval quality remains constant.

---
## Reason
Retrieval quality degrades over time as the corpus grows, embeddings drift, or document distributions change. Weekly tracking catches degradation early before it impacts users.

---
## Bad Example
```php
// Quality measured once at launch — never checked again
```

---
## Good Example
```php
// Scheduled weekly evaluation
$schedule->call(function () {
    $metrics = $this->evaluator->evaluate(
        $this->pipeline,
        $this->testCollection,
    );

    Metrics::gauge('retrieval.precision_at_5', $metrics->avgPrecisionAt5);
    Metrics::gauge('retrieval.recall_at_5', $metrics->avgRecallAt5);
    Metrics::gauge('retrieval.mrr', $metrics->avgMrr);

    if ($metrics->avgRecallAt5 < 0.75) {
        Alert::send('Retrieval quality degradation detected', $metrics);
    }

    Log::info('Weekly retrieval quality', (array) $metrics);
})->weekly();
```

---
## Exceptions
Systems with very stable, unchanging corpora may evaluate monthly.

---
## Consequences Of Violation
Silent quality degradation, user frustration with worsening answers, difficult to identify what changed.
