| Metadata | |
|---|---|
| Knowledge Unit ID | ku-03 |
| Subdomain | rag-search-pipelines |
| Topic | Query Rewriting & Expansion |
| Source | Industry / Academic |
| Maturity | New |

## Overview

Query rewriting and expansion improve retrieval quality by transforming user queries before search. Techniques include: query expansion (adding related terms), HyDE (Hypothetical Document Embeddings), query decomposition (breaking complex questions into sub-questions), and query normalization (spelling correction, stop word removal). These are especially valuable in RAG pipelines where retrieval quality directly affects answer quality.

## Core Concepts

- **Query Expansion**: Add synonyms, related terms, or LLM-generated expansions to original query
- **HyDE**: Generate a hypothetical ideal document, embed it, and use that embedding for retrieval
- **Query Decomposition**: Split complex multi-part questions into simpler sub-queries
- **Step-Back Prompting**: Generate a broader "step-back" question for better context retrieval
- **Spelling Correction**: Fix typos before retrieval using edit distance or LLM

## When To Use

- RAG pipelines where retrieval recall is below requirements
- Short or ambiguous user queries needing context
- Multi-part questions requiring information from different documents
- Specialized domains with unique terminology

## When NOT To Use

- Queries are already well-formed and specific
- Latency budget very tight (rewriting adds time)
- Simple keyword search already provides good results
- Users are trained to formulate detailed queries

## Best Practices

1. **Start with spelling correction**: Highest impact for lowest complexity.
2. **Use HyDE for improving semantic retrieval**: Generates better query embeddings.
3. **Test expansion before deploying**: Poor expansions degrade results.
4. **Cache rewritten queries**: Same query → same rewriting → cache.
5. **Monitor expansion quality**: Track if transformed queries improve or degrade results.

## Architecture Guidelines

- Pre-retrieval: Apply normalization → spelling correction → expansion → HyDE
- Post-retrieval: Query decomposition → retrieve per sub-query → merge results
- LLM-based rewriting: Use small/cheap LLM for rewriting, larger for generation
- Cache layer: Store rewritten queries for reuse

## Performance Considerations

- Query rewriting adds 50-500ms depending on method (LLM-based is slowest)
- Spelling correction: <5ms using Levenshtein dictionaries
- HyDE: ~100-300ms (one embedding + generation)
- Query expansion: ~10-50ms (dictionary lookup or embedding similarity)
- Cache frequently rewritten queries to reduce overhead

## Security Considerations

- LLM-based rewriting may expose query intent to third-party API
- Expanded queries could inadvertently include sensitive terms
- Cache rewritten queries carefully (may contain PII)
- Validation: Ensure rewrites don't change query semantics to inappropriate content

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Over-expansion with irrelevant terms | Broad synonyms | Retrieval noise | Test expansions per domain |
| HyDE without validation | Assumption improvement | May degrade retrieval | Compare with/without HyDE |
| Ignoring original query | Over-optimizing rewrite | Lose user intent | Use original + expanded together |
| LLM rewriting for every query | Not caching | Unnecessary latency | Cache frequent rewrites |

## Anti-Patterns

- **Rewriting before understanding baseline retrieval quality**: Fix retrieval first
- **Aggressive expansion for rare terms**: May match completely unrelated documents
- **No fallback to original query**: If rewriting degrades, original should still work
- **Expensive LLM rewriting for all queries**: Use rules-based for common patterns

## Examples

`php
class QueryRewriter
{
    public function rewrite(string ): string
    {
        // Step 1: Spelling correction
         = ->correctSpelling();
        
        // Step 2: Query expansion (add synonyms)
         = ->expandTerms();
        
        // Step 3: Return both original and expanded
        return " ";
    }
}
`

## Related Topics

- K067 (Embedding generation strategies)
- K069 (RAG pipeline architecture)
- K061 (RRF - Reciprocal Rank Fusion)

## AI Agent Notes

- Query rewriting is an advanced RAG technique — optimize retrieval before adding it
- HyDE is particularly effective for improving semantic retrieval
- Start with spelling correction, add complexity only if needed
- For agents: implement basic expansion first, then HyDE for specific quality gaps

## Verification

- [ ] Spelling correction implemented and tested
- [ ] Query expansion tested (not degrading results)
- [ ] HyDE evaluated (improvement over baseline)
- [ ] Cache layer for rewritten queries
- [ ] Fallback to original query on rewriting failure
- [ ] Rewriting latency measured and acceptable
