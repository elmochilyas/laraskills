# ECC Anti-Patterns — RAG Context Injection

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | RAG & Retrieval-Augmented Generation |
| **Knowledge Unit** | RAG Context Injection |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Injecting Raw Retrieved Chunks Without Formatting
2. Context Overload — More Retrieved Chunks Than Model Can Process
3. No Structured Context Format — LLM Can't Distinguish Context from Query
4. Context Injection After User Message — LLM Already Started Reasoning
5. No Deduplication — Same Document Retrieved Multiple Times

---

## Repository-Wide Anti-Patterns

- Retrieved chunks not ordered by relevance
- Context size not monitored against model token limit

---

## Anti-Pattern 1: Raw Chunks Without Formatting

### Category
Reliability

### Description
Injecting raw text chunks directly into prompt without delimiters, numbering, or source attribution.

### Preferred Alternative
Format context: numbered chunks with source labels, clear delimiters separating context from instructions.

### Detection Checklist
- [ ] Raw chunk text in prompt
- [ ] No source attribution
- [ ] LLM cannot distinguish chunks
