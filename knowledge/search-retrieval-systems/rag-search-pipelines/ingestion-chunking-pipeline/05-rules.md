---
## Rule Name
Use Recursive Character Splitting as Default

## Category
Design

## Rule
Use recursive character splitting (paragraph → sentence → character) as the default chunking method.

## Reason
Recursive splitting respects natural document boundaries. Fixed-size character splitting breaks mid-sentence, causing information loss.

## Bad Example
```php
$chunks = str_split($text, 500);  // Splits in the middle of sentences
```

## Good Example
```php
$chunks = $splitter->splitText($text, [
    'chunk_size' => 512,
    'chunk_overlap' => 50,
    'separators' => ["\n\n", "\n", ".", " "],
]);
```

## Exceptions
Structured documents (code, JSON, tables) where fixed-size splitting is more appropriate.

## Consequences Of Violation
Broken sentences at chunk boundaries, leading to degraded retrieval.

---
## Rule Name
Always Include 10-20% Chunk Overlap

## Category
Design

## Rule
Always configure 10-20% overlap between consecutive chunks.

## Reason
Overlap ensures content at chunk boundaries is not lost. Without overlap, a sentence split across two chunks is missing from both.

## Bad Example
```php
$chunks = chunkText($text, chunkSize: 500, overlap: 0);  // Content lost at boundaries
```

## Good Example
```php
$chunks = chunkText($text, chunkSize: 500, overlap: 50);  // ~10% overlap preserves boundaries
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Retrieval misses information that falls at chunk split points.

---
## Rule Name
Preserve Metadata in Every Chunk

## Category
Maintainability

## Rule
Always attach source document metadata (title, URL, section) to every chunk for citation support.

## Reason
Without metadata, retrieved chunks cannot be attributed. Generated answers lack source citations, reducing trust.

## Bad Example
```php
['content' => $chunk, 'embedding' => $vec]  // No metadata
```

## Good Example
```php
['content' => $chunk, 'embedding' => $vec, 'metadata' => [
    'source_title' => $doc->title,
    'source_url' => $doc->url,
    'section' => $heading,
]]
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Generated answers cannot cite sources, reducing user trust and verifiability.

---
## Rule Name
Use Queue-Based Ingestion Pipeline

## Category
Architecture

## Rule
Always process document ingestion (loading, chunking, embedding) via Laravel queue jobs.

## Reason
Ingestion is compute-intensive. Processing synchronously blocks HTTP responses and cannot scale.

## Bad Example
```php
// Synchronous — blocks HTTP response
public function upload(Request $request) {
    $chunks = chunkAndEmbed($request->file('doc'));
    return response()->json(['status' => 'done']);
}
```

## Good Example
```php
// Queued — non-blocking
public function upload(Request $request) {
    ProcessDocument::dispatch($request->file('doc')->store('documents'));
    return response()->json(['status' => 'processing']);
}
```

## Exceptions
Very small documents (<1KB) where synchronous processing is instantly done.

## Consequences Of Violation
Slow file uploads and HTTP timeouts during heavy ingestion.
