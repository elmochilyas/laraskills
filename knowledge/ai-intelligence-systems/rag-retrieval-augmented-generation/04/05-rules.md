## Format Retrieved Documents with Clear Delimiters

---
## Category
Design | Reliability

---
## Rule
Wrap each retrieved document in clear, consistent delimiters (XML tags, numbered markdown blocks) with source metadata; never dump raw chunks without structure.

---
## Reason
Structured delimiters help the LLM distinguish between separate documents, evaluate their sources, and cite them correctly. Raw concatenated chunks blend together, making it impossible for the LLM to attribute information.

---
## Bad Example
```php
$context = implode("\n\n", array_column($documents, 'content'));
// No structure — LLM cannot distinguish or cite documents
```

---
## Good Example
```php
function formatDocument(DocumentChunk $doc, int $index): string {
    return "<document index=\"{$index}\">\n" .
           "Source: {$doc->metadata['title']}\n" .
           "URL: {$doc->metadata['source_url']}\n" .
           "Relevance: {$doc->metadata['score']}\n" .
           "---\n" .
           "{$doc->content}\n" .
           "</document>";
}

$context = '';
foreach ($documents as $i => $doc) {
    $context .= formatDocument($doc, $i + 1) . "\n\n";
}
```

---
## Exceptions
Single-document context (one retrieved result) may skip delimiters.

---
## Consequences Of Violation
LLM ignores context, cannot cite sources, produces ungrounded or incorrectly attributed answers.

---

## Instruct the LLM to Use Retrieved Context

---
## Category
Reliability | Design

---
## Rule
Include explicit instructions in the system prompt telling the LLM to use the retrieved context, cite sources, and admit when information is not found; never assume the LLM will naturally prioritize retrieved context over its training data.

---
## Reason
Without explicit instructions, the LLM may rely on its training data instead of the retrieved context, defeating the purpose of RAG. Explicit instructions ground the response in the provided documents.

---
## Bad Example
```php
public function instructions(): string {
    return 'You are a helpful assistant.';
    // No RAG instructions — LLM may ignore retrieved context
}
```

---
## Good Example
```php
public function instructions(): string {
    return 'You are a helpful assistant. When answering:\n' .
           '- Use the retrieved documents below as your primary source.\n' .
           '- Cite the document index when using information: [1], [2].\n' .
           '- If documents do not contain the answer, say "I don\'t have that information."\n' .
           '- If documents contradict each other, note the contradiction.\n';
}
```

---
## Exceptions
When the LLM is specifically asked to answer from general knowledge (not RAG), omit RAG instructions.

---
## Consequences Of Violation
LLM ignores provided context, hallucinates answers not in the documents, produces ungrounded responses.

---

## Enforce a Context Token Budget

---
## Category
Performance | Cost

---
## Rule
Allocate a maximum token budget for retrieved context and truncate when exceeded; never inject more context than the allocated budget.

---
## Reason
Retrieved context that exceeds the budget pushes out conversation history or forces the model to truncate its response. A controlled budget ensures balanced context allocation between documents, history, and the response.

---
## Bad Example
```php
public function formatContext(array $documents): string {
    $context = '';
    foreach ($documents as $doc) {
        $context .= $doc->content . "\n\n";
    }
    return $context; // No budget — may consume entire context window
}
```

---
## Good Example
```php
class ContextFormatter {
    public function __construct(
        private int $maxContextTokens = 3000,
        private Tokenizer $tokenizer,
    ) {}

    public function format(array $documents): string {
        $context = '';
        $remaining = $this->maxContextTokens;

        foreach ($documents as $i => $doc) {
            $formatted = $this->wrapDocument($doc, $i + 1);
            $tokens = $this->tokenizer->count($formatted);
            if ($tokens > $remaining) break;
            $context .= $formatted . "\n\n";
            $remaining -= $tokens;
        }

        return $context;
    }
}
```

---
## Exceptions
Models with very large context windows (200K tokens) and tasks needing many documents may adjust the budget upward.

---
## Consequences Of Violation
Context window overflow, truncated responses, degraded answer quality from missing conversation history.

---

## Order Documents by Relevance

---
## Category
Design | Reliability

---
## Rule
Order retrieved documents by descending relevance score before injecting into context; never inject documents in arbitrary order.

---
## Reason
LLMs pay more attention to content appearing earlier in the context. Ordering by relevance ensures the most useful information is processed first and is less likely to be cut off by truncation.

---
## Bad Example
```php
public function formatContext(array $documents): string {
    // Order depends on database or search — may be arbitrary
    return implode("\n\n", array_map(fn($d) => $d->content, $documents));
}
```

---
## Good Example
```php
public function formatContext(array $documents): string {
    $sorted = collect($documents)
        ->sortByDesc(fn($doc) => $doc->metadata['score'])
        ->values();

    $context = '';
    foreach ($sorted as $i => $doc) {
        $context .= $this->wrapDocument($doc, $i + 1) . "\n\n";
    }
    return $context;
}
```

---
## Exceptions
When ordering by recency or source authority is more important than relevance (e.g., news retrieval), sort by the appropriate criterion.

---
## Consequences Of Violation
LLM may miss the most relevant document if it appears late in the context, especially with budget-based truncation.

---

## Handle the No-Results Case

---
## Category
Reliability

---
## Rule
Provide explicit instructions for what the LLM should do when no relevant documents are retrieved or the documents don't contain the answer; never leave the no-context case unhandled.

---
## Reason
Without handling the no-results case, the LLM is forced to either hallucinate an answer or produce a confusing response. Explicit instructions ensure graceful degradation.

---
## Bad Example
```php
$context = $this->retriever->search($query);
if (empty($context)) {
    // No handling — LLM may hallucinate
    return $this->llm->chat($query);
}
```

---
## Good Example
```php
$context = $this->retriever->search($query);

if (empty($context)) {
    $systemPrompt = 'Answer the question based on your knowledge. ' .
                    'If you do not know the answer, say "I don\'t have that information."';
    return $this->llm->chat($systemPrompt, $query);
}

$systemPrompt = 'Use the retrieved documents to answer. ' .
                'Cite sources. If documents lack the answer, say so.';
return $this->llm->chat($systemPrompt . "\n\nContext:\n" . $context, $query);
```

---
## Exceptions
When the application requires an answer even without context (opinion, general knowledge), omit the "don't know" instruction.

---
## Consequences Of Violation
LLM hallucinates answers not supported by any document, misleading users, eroding trust in the system.

---

## Validate Citations Post-Generation

---
## Category
Reliability | Security

---
## Rule
Post-process the LLM response to validate that cited document indices exist in the retrieved set; never trust the LLM's citations without verification.

---
## Reason
LLMs may fabricate citations (cite document indices that were not retrieved, or hallucinate source titles). Post-processing verification ensures that every citation is grounded in an actual retrieved document.

---
## Bad Example
```php
$response = $this->llm->chat($prompt, $query);
return $response->content;
// LLM may cite documents that weren't retrieved
```

---
## Good Example
```php
class CitationValidator {
    public function validate(string $response, array $retrievedDocs): string {
        // Extract citations [1], [2], etc.
        preg_match_all('/\[(\d+)\]/', $response, $matches);
        $citedIndices = array_unique($matches[1]);

        foreach ($citedIndices as $index) {
            $docIndex = (int) $index - 1;
            if (!isset($retrievedDocs[$docIndex])) {
                $this->logger->warning('Fabricated citation', [
                    'index' => $index,
                    'retrieved_count' => count($retrievedDocs),
                ]);
                return $this->stripCitation($response, $index);
            }
        }

        return $response;
    }
}
```

---
## Exceptions
When citations are not required (internal tools, summarization), skip validation.

---
## Consequences Of Violation
User sees citations to non-existent sources, eroding trust, potential liability from fabricated references.
