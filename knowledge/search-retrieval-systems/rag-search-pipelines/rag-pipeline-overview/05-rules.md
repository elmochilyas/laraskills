---
## Rule Name
Prioritize Retrieval Quality Before Generation

## Category
Design

## Rule
Always benchmark and optimize retrieval quality before adding LLM generation to a RAG pipeline.

## Reason
RAG quality is bounded by retrieval recall. If retrieval misses relevant context, the LLM cannot produce correct answers regardless of prompt engineering.

## Bad Example
```php
// Building generation before validating retrieval — garbage in, garbage out
$answer = $llm->generate($prompt, $context);
```

## Good Example
```php
// Step 1: Benchmark retrieval quality
$recall = evaluateRetrieval($testSet, 'current_config');
if ($recall < 0.85) {
    optimizeRetrieval();  // Tune chunking, hybrid search, re-ranking
}
// Step 2: Add generation
$answer = $llm->generate($context, $query);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
LLM produces incorrect or hallucinated answers because the relevant context was not retrieved.

---
## Rule Name
Always Include Source Citations

## Category
Design

## Rule
Always include source document references (title, URL, section) alongside generated answers.

## Reason
Users cannot verify AI-generated answers without sources. Citations build trust and allow fact-checking.

## Bad Example
```json
{"answer": "The return policy is 30 days."}
```

## Good Example
```json
{
    "answer": "The return policy is 30 days.",
    "sources": [
        {"title": "Return Policy", "url": "/help/returns", "section": "Timeline"}
    ]
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Users cannot verify AI answers, reducing trust and increasing hallucination risk perception.

---
## Rule Name
Handle Out-of-Scope Queries Gracefully

## Category
Reliability

## Rule
Always instruct the LLM to say "I don't know" when the retrieved context does not contain the answer.

## Reason
Without explicit "I don't know" instructions, LLMs hallucinate answers from their training data rather than admitting lack of knowledge.

## Bad Example
```php
$prompt = "Answer the question based on the context: $context Question: $query";
// No "I don't know" instruction — LLM may hallucinate
```

## Good Example
```php
$prompt = "Answer the question using ONLY the provided context. If the context does not contain the answer, say 'I cannot answer this question based on the available information.'\n\nContext: $context\n\nQuestion: $query";
```

## Exceptions
No common exceptions.

## Consequences Of Violation
LLM hallucinates answers not supported by retrieved documents.

---
## Rule Name
Implement Streaming for Generation

## Category
UX

## Rule
Always stream LLM-generated responses to reduce perceived latency.

## Reason
Generation adds 500-3000ms. Streaming shows tokens incrementally, making the response feel instant despite total latency.

## Bad Example
```php
// Wait 3 seconds for full answer — terrible UX
$answer = $llm->generate($prompt);  // Blocks 3 seconds
return response()->json(['answer' => $answer]);
```

## Good Example
```php
// Stream response tokens
return response()->stream(function () use ($prompt) {
    $stream = $llm->generateStream($prompt);
    foreach ($stream as $token) {
        echo $token;
        ob_flush();
        flush();
    }
});
```

## Exceptions
API-only integrations where streaming output is not consumed by a human user.

## Consequences Of Violation
Users wait 1-5 seconds without feedback, perceiving the system as slow or broken.
