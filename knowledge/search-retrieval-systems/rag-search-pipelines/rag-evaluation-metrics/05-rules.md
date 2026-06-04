---
## Rule Name
Create Ground Truth Test Set Before Launch

## Category
Testing

## Rule
Always create a test set of 100-200 queries with ground-truth relevant documents before deploying a RAG pipeline.

## Reason
Without ground truth data, retrieval and generation quality cannot be measured objectively. Evaluation without ground truth is unreliable.

## Bad Example
```bash
# No test set — relying on subjective manual review
```

## Good Example
```php
$testSet = [
    ['query' => 'What is the return policy?', 'relevant_docs' => [1, 5], 'ideal_answer' => '...'],
    // ... 100-200 queries
];
$recall = evaluateRetrieval($testSet, $config);
$faithfulness = evaluateGeneration($testSet, $pipeline);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
No objective quality measure — cannot detect regressions or measure improvement.

---
## Rule Name
Evaluate Retrieval and Generation Separately

## Category
Testing

## Rule
Always evaluate retrieval quality and generation quality as separate metrics.

## Reason
Merged metrics mask which part of the pipeline needs improvement. If answers are bad, is it retrieval missing context or LLM misusing it?

## Bad Example
```php
// Single combined score — can't diagnose issues
$overallScore = evaluateEndToEnd($testSet);
```

## Good Example
```php
$retrievalScore = evaluateRetrieval($testSet);  // recall, MRR, NDCG
$generationScore = evaluateGeneration($testSet);  // faithfulness, relevance
// If retrieval is 0.95 but faithfulness is 0.60 → problem is generation
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Inability to pinpoint whether retrieval or generation is the bottleneck.

---
## Rule Name
Run Nightly Evaluation Pipeline

## Category
Maintainability

## Rule
Always schedule nightly RAG evaluation runs to detect quality regression.

## Reason
RAG quality degrades over time due to data drift, model updates, and configuration changes. Nightly runs catch regressions early.

## Bad Example
```bash
# No regular evaluation — regression goes undetected
```

## Good Example
```php
$schedule->call(function () {
    $metrics = $evaluator->evaluate($testSet);
    if ($metrics['faithfulness'] < 0.8) {
        Notification::route('slack', config('services.slack.webhook'))
            ->notify(new RAGQualityAlert("Faithfulness dropped to {$metrics['faithfulness']}"));
    }
})->daily();
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Gradual RAG quality degradation reaching users without detection.
