---
## Rule Name
Use Recursive Character Splitting as Default

## Category
Design

## Rule
Use recursive character splitting (paragraph → sentence → character) as the default chunking strategy for RAG.

## Reason
Recursive splitting respects natural document boundaries (paragraphs, sentences) before falling back to character splits. Fixed-size splitting breaks mid-sentence.

## Bad Example
```php
// Fixed-size — breaks in the middle of sentences
$chunks = str_split($text, 500);
```

## Good Example
```php
// Recursive splitting — respects boundaries
$chunks = $splitter->splitText($text, [
    'chunk_size' => 512,
    'chunk_overlap' => 50,
    'separators' => ["\n\n", "\n", ".", " "],
]);
```

## Exceptions
Structured documents (code, JSON) where fixed-size splitting is more appropriate.

## Consequences Of Violation
Broken sentences at chunk boundaries causing information loss and degraded retrieval quality.

---
## Rule Name
Include 10-20% Chunk Overlap

## Category
Design

## Rule
Always configure 10-20% chunk overlap to prevent information loss at chunk boundaries.

## Reason
Without overlap, sentences or concepts split at chunk boundaries are lost entirely. Overlap ensures boundary content appears in both neighboring chunks.

## Bad Example
```php
// No overlap — content at boundaries lost
$chunks = $splitter->splitText($text, ['chunk_size' => 512, 'chunk_overlap' => 0]);
```

## Good Example
```php
$chunks = $splitter->splitText($text, [
    'chunk_size' => 512,
    'chunk_overlap' => 50,  // ~10% overlap
]);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Information loss at chunk boundaries — retrieval misses content that happens to fall at a split point.

---
## Rule Name
Preserve Document Metadata in Each Chunk

## Category
Maintainability

## Rule
Always attach source document metadata (title, section, page number) to every chunk.

## Reason
Metadata enables source citation in generated answers. Without metadata, retrieved chunks cannot be attributed to their source.

## Bad Example
```php
// Chunk without metadata — can't cite source
['index' => ['_id' => $id], 'doc' => ['content' => $chunk, 'embedding' => $vec]]
```

## Good Example
```php
['index' => ['_id' => $id], 'doc' => [
    'content' => $chunk,
    'embedding' => $vec,
    'metadata' => ['source' => $doc->title, 'url' => $doc->url, 'section' => $heading],
]]
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Generated answers cannot include source citations — users cannot verify AI answers.

---
## Rule Name
Test Chunk Size Before Production

## Category
Testing

## Rule
Always test multiple chunk sizes (256, 512, 1024 tokens) and benchmark retrieval quality before choosing.

## Reason
Optimal chunk size varies by document type, query type, and LLM context window. The wrong size degrades either retrieval specificity or context completeness.

## Bad Example
```bash
# Using arbitrary chunk size without testing
chunk_size=500  # Guessing
```

## Good Example
```php
$sizes = [256, 512, 1024];
$results = [];
foreach ($sizes as $size) {
    $results[$size] = benchmarkRetrieval($testQueries, chunkSize: $size);
}
$best = array_keys($results, max($results))[0];
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Suboptimal retrieval quality from incorrect chunk size.
