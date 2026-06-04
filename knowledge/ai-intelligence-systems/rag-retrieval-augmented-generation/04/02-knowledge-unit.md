# Knowledge Unit: Context Injection & Prompt Design for RAG

## Metadata

- **ID:** ku-04
- **Subdomain:** Retrieval-Augmented Generation
- **Slug:** context-injection---prompt-design-for-rag
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Context injection is the process of formatting retrieved documents and injecting them into the LLM prompt in a way that maximizes the model's ability to use them effectively. Poor context formatting â€” dumping raw chunks, missing citations, unclear relevance â€” leads to the LLM ignoring the context or using it incorrectly. Effective context injection makes the retrieved information clear, attributable, and actionable for the LLM, directly determining the quality of the grounded response.

## Core Concepts

- **Context Window Budget:** Allocating a specific portion of the LLM's context window to retrieved documents. Typically 30-70% of the available context.
- **Document Formatting:** Structuring each retrieved document with clear delimiters, source labels, and relevance signals.
- **Citation Injection:** Including source metadata (title, URL, position) with each chunk so the LLM can cite sources in its response.
- **Relevance Ranking:** Ordering retrieved documents by relevance score (most relevant first). The LLM pays more attention to early content.
- **Instruction Tuning for RAG:** The system prompt must explicitly instruct the LLM to use the retrieved context and how to handle missing information.
- **Negative Instruction:** "If the retrieved documents don't contain the answer, say you don't know" â€” prevents hallucination from context gaps.
- **Multi-Document Synthesis:** Instructions for the LLM to compare, contrast, or synthesize information across multiple retrieved documents.

## Mental Models

- **Context Window Budget:** Allocating a specific portion of the LLM's context window to retrieved documents. Typically 30-70% of the available context.
- **Document Formatting:** Structuring each retrieved document with clear delimiters, source labels, and relevance signals.
- **Citation Injection:** Including source metadata (title, URL, position) with each chunk so the LLM can cite sources in its response.


## Internal Mechanics

The internal mechanics of Context Injection & Prompt Design for RAG follow established patterns within the Retrieval-Augmented Generation domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Wrap each document in clear delimiters.** Use XML tags, markdown blocks, or numbered lists. `<document index="1">...</document>`.
- **Include metadata with each document.** Title, source URL, date, and relevance score help the LLM evaluate authority.
- **Instruct the LLM to cite sources.** "Cite the document index when using information from the context."
- **Set a token budget for context.** Truncate or compress context when it exceeds the budget. Never exceed the model's context window.
- **Handle the "no context" case.** The prompt must instruct the LLM on what to do when retrieved documents are insufficient.
- **Use the system prompt for RAG instructions.** Don't repeat RAG-specific instructions in every user message.

## Patterns

- **Wrap each document in clear delimiters.** Use XML tags, markdown blocks, or numbered lists. `<document index="1">...</document>`.
- **Include metadata with each document.** Title, source URL, date, and relevance score help the LLM evaluate authority.
- **Instruct the LLM to cite sources.** "Cite the document index when using information from the context."
- **Set a token budget for context.** Truncate or compress context when it exceeds the budget. Never exceed the model's context window.
- **Handle the "no context" case.** The prompt must instruct the LLM on what to do when retrieved documents are insufficient.
- **Use the system prompt for RAG instructions.** Don't repeat RAG-specific instructions in every user message.

## Architectural Decisions

- Implement context formatting as a **dedicated service** `ContextFormatter` with pluggable format strategies.
- The formatter should accept a list of `DocumentChunk` objects and produce a formatted string with token count tracking.
- Use a **context budget enforcer** that truncates or compresses context when it exceeds the allocated budget.
- For multi-turn conversations, maintain a **context cache** â€” retrieved documents that are still relevant don't need re-retrieval.
- Implement **citation extraction** post-generation â€” parse citations from the LLM response and validate them against the retrieved documents.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Context formatting adds <0.1ms â€” negligible.
- Token counting for budget enforcement: use the same tokenizer as the LLM model. Cache token counts for repeated context.
- Context compression (summarizing retrieved documents) adds significant latency (500ms+). Use only when context exceeds budget.
- Multi-turn context caching: store retrieved document IDs and skip re-retrieval for identical queries (improves latency by 200-500ms).
- Citation validation: lightweight regex check (<0.1ms) to verify cited indices exist in the retrieved set.

## Production Considerations

- **Context sanitization:** Retrieved documents may contain injection payloads. Sanitize before formatting into context.
- **Metadata integrity:** Don't include metadata that reveals internal information (internal URLs, access levels).
- **Citation validation:** The LLM may fabricate citations (cite documents that weren't retrieved). Post-process to verify citations.
- **Context budget enforcement:** If context exceeds the budget, the system must decide which documents to drop â€” ensure access control rules are respected.
- **Multi-turn context:** In multi-turn conversations, retrieved context from earlier turns persists. Ensure stale or revoked documents are removed.

## Common Mistakes

- Dumping all retrieved documents as raw text without delimiters or structure.
- Not including source metadata â€” the LLM can't cite sources or evaluate authority.
- Exceeding the context window â€” the model either truncates or errors.
- Not instructing the LLM to use the context â€” it may rely on its training data instead.
- Including irrelevant documents in the context â€” distracts the LLM from relevant information.
- Not handling the case where retrieval returns zero results â€” the model hallucinates instead of saying "I don't know."

## Failure Modes

- **Context Dump:** Retrieving 20 documents and injecting all of them without relevance filtering.
- **Citation Overload:** Forcing citations for every sentence â€” cluttered responses. Cite only key claims.
- **Ignoring Context Order:** Injecting documents in arbitrary order instead of by relevance.
- **Repeated Context:** Sending the same context across multiple turns in a conversation without deduplication.
- **No Context Budget:** Allowing retrieved context to consume the entire context window, leaving no room for conversation history.

## Ecosystem Usage

### Context Formatter
```php
class ContextFormatter {
    public function format(array $documents, int $maxTokens): string {
        $context = '';
        $budgetRemaining = $maxTokens;

        foreach ($documents as $i => $doc) {
            $formatted = $this->formatDocument($doc, $i + 1);
            $tokens = $this->countTokens($formatted);

            if ($tokens > $budgetRemaining) break;

            $context .= $formatted . "\n\n";
            $budgetRemaining -= $tokens;
        }

        return trim($context);
    }

    private function formatDocument(DocumentChunk $doc, int $index): string {
        return <<<DOC
<document index="{$index}">
Source: {$doc->metadata['title'] ?? 'Unknown'}
Relevance: {$doc->metadata['score'] ?? 'N/A'}
---
{$doc->content}
</document>
DOC;
    }
}
```

### RAG System Prompt Section
```php
$ragInstructions = <<<INSTRUCTIONS

## Related Knowledge Units

- ku-01 (RAG Architecture Fundamentals): Context injection is part of the query pipeline.
- ku-05 (Retrieval Quality): Better retrieval means better context.
- prompt-engineering-systems/ku-01: Prompt fundamentals for RAG.
- prompt-engineering-systems/ku-02: System prompt design with RAG instructions.
- ai-safety-security/ku-01: Sanitizing retrieved context for injection.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

