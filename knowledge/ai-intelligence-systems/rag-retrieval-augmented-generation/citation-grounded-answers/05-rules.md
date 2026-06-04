## Use Structured Output for Citations
---
## Category
Reliability | Design
---
## Rule
Implement citation fields as a structured output array (not inline text) in the agent's `schema()`; always validate citations against the retrieved chunk set.
---
## Reason
Structured citations are machine-parseable, verifiable, and can be highlighted in the UI. Inline text citations (`[1]`, `[Source: doc.pdf]`) are fragile and cannot be programmatically validated. Post-processing validation rejects fabricated citations.
---
## Bad Example
```php
// No citation schema — LLM may or may not cite sources
public function instructions(): string {
    return 'Cite your sources in brackets like [1].';
}
```
---
## Good Example
```php
public function schema(): JsonSchema {
    return JsonSchema::object([
        'answer' => JsonSchema::string(),
        'citations' => JsonSchema::array(
            JsonSchema::object([
                'chunk_id' => JsonSchema::string(),
                'relevance' => JsonSchema::string(),
            ])
        ),
    ]);
}
```
---
## Exceptions
Chat applications where citations are displayed inline in markdown may use both inline format and a parallel structured array.
---
## Consequences Of Violation
Unverifiable citations, citation hallucination goes undetected, user trust erosion.

## Validate Citations Against Retrieved Chunks
---
## Category
Security | Reliability
---
## Rule
Post-process the agent response to verify that every `chunk_id` in the citations array exists in the set of chunks that were actually retrieved; reject fabricated citations.
---
## Reason
LLMs frequently fabricate citations ("citation hallucination") — they reference chunks that were never retrieved or don't exist. Without validation, users see plausible-sounding but false source references. Validation ensures every citation is traceable to an actual retrieved document.
---
## Bad Example
```php
// Citations are taken at face value — no verification
$response = $agent->prompt($query);
return $response->structured();
```
---
## Good Example
```php
$response = $agent->prompt($query);
$data = $response->structured();

$retrievedIds = $chunks->pluck('id')->toArray();
$validCitations = array_filter($data['citations'], fn($c) =>
    in_array($c['chunk_id'], $retrievedIds)
);
if (count($validCitations) < count($data['citations'])) {
    Log::warning('Fabricated citations detected', [
        'invalid' => array_diff(
            array_column($data['citations'], 'chunk_id'),
            $retrievedIds
        ),
    ]);
}
$data['citations'] = array_values($validCitations);
```
---
## Exceptions
Creative writing or brainstorming agents where factual accuracy is not critical may skip citation validation.
---
## Consequences Of Violation
Fabricated sources in user-facing answers, compliance violations for regulated domains, legal liability.

## Include Chunk Metadata in Context
---
## Category
Reliability
---
## Rule
Prefix each retrieved chunk with its metadata (`[Source: document.pdf, section: 3.2]`) when injecting into the LLM context; never strip source identifiers from chunks.
---
## Reason
The LLM cannot cite what it cannot identify. Without source metadata, the LLM has no way to reference specific chunks — it either makes up citations or provides no attribution. Metadata enables the LLM to produce accurate, verifiable citations.
---
## Bad Example
```php
// Metadata stripped — LLM has no source information to cite
$context = $chunks->pluck('content')->implode("\n\n");
```
---
## Good Example
```php
// Metadata attached to each chunk
$context = $chunks->map(fn($c) =>
    "[Source: {$c->document_name}, section: {$c->section}]\n{$c->content}"
)->implode("\n\n");
```
---
## Exceptions
Simple Q&A where source attribution is not required (general knowledge, creative tasks) may omit metadata.
---
## Consequences Of Violation
LLM cannot cite sources, citation hallucination increases, response traceability is lost.
