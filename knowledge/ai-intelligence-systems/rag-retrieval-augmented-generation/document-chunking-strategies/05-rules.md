## Never Change Chunking Strategy for a Populated Index
---
## Category
Maintainability | Performance
---
## Rule
Version your chunking strategy and store the strategy identifier with each chunk; never change the chunking strategy without re-embedding the entire corpus.
---
## Reason
Changed chunk boundaries mean existing vectors represent different text segments. Retrieval against old vectors with new chunk boundaries produces semantically inconsistent results. The embedding model sees different content, making similarity scores unreliable.
---
## Bad Example
```php
// Changed from 512-token chunks to 256-token chunks — old vectors are invalid
Chunker::fixedSize($document, 256); // Changed from 512
```
---
## Good Example
```php
// Version the strategy
class DocumentChunker {
    public function __construct(
        private string $strategyVersion = 'v2-fixed-256',
    ) {}
}
// On strategy change: re-chunk all documents with new version
```
---
## Exceptions
Empty indices or development databases may change strategy freely before the first production deployment.
---
## Consequences Of Violation
Silent retrieval quality degradation, undiagnosable relevance issues, wasted debugging time.

## Start with Recursive Chunking, Iterate
---
## Category
Design
---
## Rule
Begin with recursive chunking (character → paragraph → sentence fallback) as the default strategy; evaluate retrieval quality before switching to more complex strategies.
---
## Reason
Recursive chunking is the best general-purpose fallback — it respects structural boundaries while providing predictable chunk sizes. Fixed-size chunking without overlap loses context at boundaries. Semantic chunking requires embedding calls during ingestion. Start simple, measure, then optimize.
---
## Bad Example
```php
// Starting with semantic chunking without a baseline to compare against
Chunker::semantic($document); // Complex, slow, no baseline
```
---
## Good Example
```php
// Start with recursive, measure recall@K, then iterate
Chunker::recursive($document, maxSize: 512, overlap: 64);
// Evaluate, then try document-aware if structural boundaries matter
```
---
## Exceptions
Domain-specific content (legal contracts with defined sections, code documentation) may start with document-aware chunking since structure is well-defined.
---
## Consequences Of Violation
Unnecessary complexity for no measured improvement, wasted embedding API calls on semantic chunking, no baseline to compare against.

## Keep Structural Elements (Tables, Code Blocks) Intact
---
## Category
Reliability
---
## Rule
Configure chunking to never split tables, code blocks, or list items across chunk boundaries; use document-aware splitting when structure matters.
---
## Reason
A table split across two chunks loses its meaning — neither half is useful for retrieval or LLM context. Code blocks split mid-function are syntactically invalid. Structural integrity at chunk boundaries preserves semantic value.
---
## Bad Example
```php
// Fixed-size chunking splits tables and code blocks arbitrarily
Chunker::fixedSize($markdown, 512);
```
---
## Good Example
```php
// Document-aware chunking preserves structure
Chunker::documentAware($markdown, [
    'protectPatterns' => ['/```.*?```/s', '/\|.*\|.*\|/m'],
    'maxSize' => 512,
    'overlap' => 64,
]);
```
---
## Exceptions
Simple prose-only content (news articles, documentation text) without tables or code doesn't need structural preservation.
---
## Consequences Of Violation
Useless half-table chunks, broken code snippets in retrieved context, degraded LLM response quality.
