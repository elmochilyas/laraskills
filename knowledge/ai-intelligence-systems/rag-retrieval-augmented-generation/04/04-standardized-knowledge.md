---
id: ku-04
title: "Context Injection & Prompt Design for RAG"
subdomain: "retrieval-augmented-generation"
ku-type: "prompting"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/retrieval-augmented-generation/ku-04/04-standardized-knowledge.md"
---

# Context Injection & Prompt Design for RAG

## Overview

Context injection is the process of formatting retrieved documents and injecting them into the LLM prompt in a way that maximizes the model's ability to use them effectively. Poor context formatting — dumping raw chunks, missing citations, unclear relevance — leads to the LLM ignoring the context or using it incorrectly. Effective context injection makes the retrieved information clear, attributable, and actionable for the LLM, directly determining the quality of the grounded response.

## Core Concepts

- **Context Window Budget:** Allocating a specific portion of the LLM's context window to retrieved documents. Typically 30-70% of the available context.
- **Document Formatting:** Structuring each retrieved document with clear delimiters, source labels, and relevance signals.
- **Citation Injection:** Including source metadata (title, URL, position) with each chunk so the LLM can cite sources in its response.
- **Relevance Ranking:** Ordering retrieved documents by relevance score (most relevant first). The LLM pays more attention to early content.
- **Instruction Tuning for RAG:** The system prompt must explicitly instruct the LLM to use the retrieved context and how to handle missing information.
- **Negative Instruction:** "If the retrieved documents don't contain the answer, say you don't know" — prevents hallucination from context gaps.
- **Multi-Document Synthesis:** Instructions for the LLM to compare, contrast, or synthesize information across multiple retrieved documents.

## When To Use

- Every RAG system — context formatting is as important as retrieval quality.
- When the LLM is ignoring retrieved context — poor formatting may be the cause.
- When users need source attribution — citations require properly formatted context.

## When NOT To Use

- Non-RAG applications (no context to inject).
- When the context is a single short document — simple wrapping suffices.

## Best Practices

- **Wrap each document in clear delimiters.** Use XML tags, markdown blocks, or numbered lists. `<document index="1">...</document>`.
- **Include metadata with each document.** Title, source URL, date, and relevance score help the LLM evaluate authority.
- **Instruct the LLM to cite sources.** "Cite the document index when using information from the context."
- **Set a token budget for context.** Truncate or compress context when it exceeds the budget. Never exceed the model's context window.
- **Handle the "no context" case.** The prompt must instruct the LLM on what to do when retrieved documents are insufficient.
- **Use the system prompt for RAG instructions.** Don't repeat RAG-specific instructions in every user message.

## Architecture Guidelines

- Implement context formatting as a **dedicated service** `ContextFormatter` with pluggable format strategies.
- The formatter should accept a list of `DocumentChunk` objects and produce a formatted string with token count tracking.
- Use a **context budget enforcer** that truncates or compresses context when it exceeds the allocated budget.
- For multi-turn conversations, maintain a **context cache** — retrieved documents that are still relevant don't need re-retrieval.
- Implement **citation extraction** post-generation — parse citations from the LLM response and validate them against the retrieved documents.

## Performance Considerations

- Context formatting adds <0.1ms — negligible.
- Token counting for budget enforcement: use the same tokenizer as the LLM model. Cache token counts for repeated context.
- Context compression (summarizing retrieved documents) adds significant latency (500ms+). Use only when context exceeds budget.
- Multi-turn context caching: store retrieved document IDs and skip re-retrieval for identical queries (improves latency by 200-500ms).
- Citation validation: lightweight regex check (<0.1ms) to verify cited indices exist in the retrieved set.

## Security Considerations

- **Context sanitization:** Retrieved documents may contain injection payloads. Sanitize before formatting into context.
- **Metadata integrity:** Don't include metadata that reveals internal information (internal URLs, access levels).
- **Citation validation:** The LLM may fabricate citations (cite documents that weren't retrieved). Post-process to verify citations.
- **Context budget enforcement:** If context exceeds the budget, the system must decide which documents to drop — ensure access control rules are respected.
- **Multi-turn context:** In multi-turn conversations, retrieved context from earlier turns persists. Ensure stale or revoked documents are removed.

## Common Mistakes

- Dumping all retrieved documents as raw text without delimiters or structure.
- Not including source metadata — the LLM can't cite sources or evaluate authority.
- Exceeding the context window — the model either truncates or errors.
- Not instructing the LLM to use the context — it may rely on its training data instead.
- Including irrelevant documents in the context — distracts the LLM from relevant information.
- Not handling the case where retrieval returns zero results — the model hallucinates instead of saying "I don't know."

## Anti-Patterns

- **Context Dump:** Retrieving 20 documents and injecting all of them without relevance filtering.
- **Citation Overload:** Forcing citations for every sentence — cluttered responses. Cite only key claims.
- **Ignoring Context Order:** Injecting documents in arbitrary order instead of by relevance.
- **Repeated Context:** Sending the same context across multiple turns in a conversation without deduplication.
- **No Context Budget:** Allowing retrieved context to consume the entire context window, leaving no room for conversation history.

## Examples

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
## Using Retrieved Context
The following documents were retrieved to help answer the user's question.
- Use information from these documents to answer. Do not rely on your own knowledge.
- Cite the document index when using information: "According to [1]..."
- If the documents don't contain the answer, say "I don't have that information."
- If documents contradict each other, note the contradiction.
INSTRUCTIONS;
```

## Related Topics

- ku-01 (RAG Architecture Fundamentals): Context injection is part of the query pipeline.
- ku-05 (Retrieval Quality): Better retrieval means better context.
- prompt-engineering-systems/ku-01: Prompt fundamentals for RAG.
- prompt-engineering-systems/ku-02: System prompt design with RAG instructions.
- ai-safety-security/ku-01: Sanitizing retrieved context for injection.

## AI Agent Notes

- When asked to improve RAG answer quality, context formatting is the second thing to check (after chunking).
- For context injection bugs, check: delimiter structure, metadata inclusion, token budget enforcement, and citation format.
- Prefer reading the context formatter and prompt template together — they must be consistent.
- When generating RAG context code, include: formatting, budget enforcement, citation support, and no-context handling.

## Verification

- [ ] Retrieved documents are formatted with clear delimiters and source metadata.
- [ ] Context token budget is configured and enforced (truncation or compression).
- [ ] System prompt includes explicit instructions to use the retrieved context and cite sources.
- [ ] "I don't know" case is handled when retrieved documents are insufficient.
- [ ] Documents are ordered by relevance (most relevant first).
- [ ] Citation post-processing verifies that cited indices exist in the retrieved set.
- [ ] Multi-turn conversation has context cache/dedup to avoid redundant retrieval.
