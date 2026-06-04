# Decomposition: Context Injection & Prompt Design for RAG

## Topic Overview

Context injection is the process of formatting retrieved documents and injecting them into the LLM prompt in a way that maximizes the model's ability to use them effectively. Poor context formatting â€” dumping raw chunks, missing citations, unclear relevance â€” leads to the LLM ignoring the context or using it incorrectly. Effective context injection makes the retrieved information clear, attributable, and actionable for the LLM, directly determining the quality of the grounded response.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-04/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Context Injection & Prompt Design for RAG
- **Purpose:** Context injection is the process of formatting retrieved documents and injecting them into the LLM prompt in a way that maximizes the model's ability to use them effectively. Poor context formatting â€” dumping raw chunks, missing citations, unclear relevance â€” leads to the LLM ignoring the context or using it incorrectly. Effective context injection makes the retrieved information clear, attributable, and actionable for the LLM, directly determining the quality of the grounded response.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-05, ku-01, ku-02, ku-01

## Dependency Graph
**Depends on:**
- ku-01
- ku-05
- ku-01
- ku-02
- ku-01

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Context Window Budget:** Allocating a specific portion of the LLM's context window to retrieved documents. Typically 30-70% of the available context.
- **Document Formatting:** Structuring each retrieved document with clear delimiters, source labels, and relevance signals.
- **Citation Injection:** Including source metadata (title, URL, position) with each chunk so the LLM can cite sources in its response.
- **Relevance Ranking:** Ordering retrieved documents by relevance score (most relevant first). The LLM pays more attention to early content.
- **Instruction Tuning for RAG:** The system prompt must explicitly instruct the LLM to use the retrieved context and how to handle missing information.
- **Negative Instruction:** "If the retrieved documents don't contain the answer, say you don't know" â€” prevents hallucination from context gaps.
- **Multi-Document Synthesis:** Instructions for the LLM to compare, contrast, or synthesize information across multiple retrieved documents.

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-05 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs
- ku-02 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

