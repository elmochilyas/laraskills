## Prefer Semantic Chunking Over Fixed-Size

---
## Category
Design | Reliability

---
## Rule
Split documents at natural semantic boundaries (paragraphs, sections, sentences) rather than at fixed token counts; never use fixed-size chunking that may split mid-sentence or mid-thought.

---
## Reason
Semantic chunks are coherent units of meaning that the LLM can understand independently. Fixed-size chunks that split mid-sentence lose context and produce incoherent content that confuses both retrieval and generation.

---
## Bad Example
```php
class FixedSizeChunker implements ChunkingStrategy {
    public function chunk(string $document, array $metadata): array {
        return collect(mb_str_split($document, $this->chunkSize))
            ->map(fn($chunk, $i) => new DocumentChunk(
                content: $chunk,
                metadata: $metadata + ['position' => $i],
            ))->all();
        // May split mid-word, mid-sentence — incoherent chunks
    }
}
```

---
## Good Example
```php
class SemanticChunker implements ChunkingStrategy {
    public function chunk(string $document, array $metadata): array {
        $paragraphs = preg_split('/\n\s*\n/', $document);
        $chunks = [];
        $current = '';

        foreach ($paragraphs as $para) {
            $candidate = $current ? $current . "\n\n" . $para : $para;
            if ($this->countTokens($candidate) > $this->maxTokens && $current) {
                $chunks[] = new DocumentChunk(content: $current, metadata: $metadata);
                $current = $para;
            } else {
                $current = $candidate;
            }
        }

        if ($current) {
            $chunks[] = new DocumentChunk(content: $current, metadata: $metadata);
        }

        return $chunks;
    }
}
```

---
## Exceptions
Plain text documents with no paragraph structure (log files, data dumps) may require fixed-size chunking.

---
## Consequences Of Violation
Incoherent chunks that confuse the LLM, poor retrieval quality, missed context at chunk boundaries.

---

## Add 10-20% Chunk Overlap

---
## Category
Reliability

---
## Rule
Configure 10-20% overlap between consecutive chunks; never use zero overlap.

---
## Reason
Without overlap, a question or concept that straddles the boundary between two chunks is missed entirely by both. Overlap ensures that information at chunk boundaries is preserved in at least one chunk.

---
## Bad Example
```php
class NoOverlapChunker implements ChunkingStrategy {
    public function __construct(private int $chunkSize = 512) {}

    public function chunk(string $document): array {
        // No overlap — boundary information is lost
        return str_split($document, $this->chunkSize);
    }
}
```

---
## Good Example
```php
class OverlapChunker implements ChunkingStrategy {
    public function __construct(
        private int $chunkSize = 512,
        private int $overlap = 64, // ~12% overlap
    ) {}

    public function chunk(string $document): array {
        $chunks = [];
        $start = 0;
        $length = mb_strlen($document);

        while ($start < $length) {
            $chunks[] = mb_substr($document, $start, $this->chunkSize);
            $start += $this->chunkSize - $this->overlap;
        }

        return $chunks;
    }
}
```

---
## Exceptions
Very short documents (<200 tokens) that produce a single chunk do not need overlap.

---
## Consequences Of Violation
Information loss at chunk boundaries, missed retrieval for queries spanning chunk boundaries, reduced recall.

---

## Adapt Chunk Size to Content Type

---
## Category
Design | Performance

---
## Rule
Use different chunk sizes and strategies for different content types (prose, code, tables, lists); never use a single chunk size for all document types.

---
## Reason
Code snippets need smaller chunks to preserve logical units (functions, classes). Tables need to be kept intact. Prose benefits from larger, context-rich chunks. One size fits none.

---
## Bad Example
```php
class SingleChunker implements ChunkingStrategy {
    public function chunk(string $document, array $metadata): array {
        // 512-token chunks for everything — wrong for code, tables, lists
    }
}
```

---
## Good Example
```php
class AdaptiveChunker implements ChunkingStrategy {
    public function __construct(
        private ChunkingRegistry $registry,
    ) {}

    public function chunk(string $document, array $metadata): array {
        $strategy = $this->registry->forMimeType(
            $metadata['mime_type'] ?? 'text/plain'
        );
        return $strategy->chunk($document, $metadata);
    }
}

class ChunkingRegistry {
    private array $strategies = [
        'text/markdown' => new MarkdownChunker(512, 64),
        'text/html' => new HtmlChunker(512, 64),
        'text/x-php' => new CodeChunker(256, 32),
        'application/pdf' => new PdfChunker(512, 128),
    ];
}
```

---
## Exceptions
Document corpora with a single content type may use one strategy.

---
## Consequences Of Violation
Broken code chunks that split mid-function, mangled tables, poor retrieval for structured content.

---

## Propagate Document Metadata to Every Chunk

---
## Category
Maintainability | Reliability

---
## Rule
Carry source document metadata (title, source URL, date, position, parent ID) into every chunk; never store chunks without provenance metadata.

---
## Reason
Without metadata, retrieved chunks are orphaned — the LLM cannot cite sources, the system cannot trace answers back to originals, and access control cannot be enforced per document.

---
## Bad Example
```php
class Chunk {
    public function __construct(
        public readonly string $content, // No metadata
    ) {}
}
```

---
## Good Example
```php
class DocumentChunk {
    public function __construct(
        public readonly string $content,
        public readonly string $chunkId,
        public readonly array $metadata = [
            'document_id' => '...',
            'title' => '...',
            'source_url' => '...',
            'position' => 0,
            'allowed_roles' => ['admin'],
            'created_at' => '...',
        ],
    ) {}
}
```

---
## Exceptions
No common exceptions. Metadata propagation is a mandatory requirement for production RAG.

---
## Consequences Of Violation
No source attribution, untraceable answers, impossible access control enforcement, citation fabrication by the LLM.

---

## Test Multiple Chunking Strategies

---
## Category
Testing | Reliability

---
## Rule
Benchmark multiple chunking strategies against retrieval quality metrics before selecting one for production; never deploy a chunking strategy without measuring its impact.

---
## Reason
Chunking strategy is the most impactful RAG optimization. What works for one corpus may fail for another. Measurement-driven selection prevents deploying a suboptimal strategy and missing easy quality gains.

---
## Bad Example
```php
// Deployed without testing — may be suboptimal
$chunker = new SemanticChunker(maxTokens: 512, overlapTokens: 64);
```

---
## Good Example
```php
class ChunkingBenchmark {
    public function run(array $strategies, array $testQueryPairs): array {
        $results = [];
        foreach ($strategies as $name => $strategy) {
            $pipeline = new RetrievalPipeline(
                chunker: $strategy,
                embedder: $this->embedder,
                vectorStore: $this->vectorStore,
            );
            $metrics = $this->evaluator->evaluate($pipeline, $testQueryPairs);
            $results[$name] = $metrics;
        }
        return $results;
    }
}

// Usage:
$strategies = [
    'fixed_256' => new FixedSizeChunker(256),
    'fixed_512' => new FixedSizeChunker(512),
    'semantic_512' => new SemanticChunker(512, 64),
    'semantic_1024' => new SemanticChunker(1024, 128),
];
$results = $benchmark->run($strategies, $testCollection);
// Pick the best-performing strategy
```

---
## Exceptions
Prototype systems may start with the recommended default (semantic, 512 tokens, 64 overlap) and benchmark later.

---
## Consequences Of Violation
Suboptimal retrieval quality, missed easy improvements, wasted costs from over-chunking or under-chunking.
