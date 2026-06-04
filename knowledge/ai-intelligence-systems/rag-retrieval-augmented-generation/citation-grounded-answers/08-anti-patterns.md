# ECC Anti-Patterns — Citation-Grounded Answers

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | RAG & Retrieval-Augmented Generation |
| **Knowledge Unit** | Citation-Grounded Answers |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Citations — Unverifiable LLM Claims
2. LLM Generating Fake Citations (Hallucinated Sources)
3. Citations Without Specific Location (Page/Paragraph)
4. No Citation Verification Post-Generation
5. Citations in Generated Text Not Linked to Source Documents

---

## Repository-Wide Anti-Patterns

- Citations not rendered in the UI — user can't click through to source
- Citation format inconsistent across agent responses

---

## Anti-Pattern 1: No Citations

### Category
Reliability

### Description
LLM answers based on retrieved documents but doesn't cite sources — user cannot verify claims.

### Preferred Alternative
Instruct the LLM to cite which retrieved document supports each claim. Include chunk ID and document title.

### Detection Checklist
- [ ] No source citations in responses
- [ ] Answers unverifiable
- [ ] No citation instruction in agent prompt

---

## Anti-Pattern 2: LLM Generating Fake Citations

### Category
Security

### Description
LLM produces citations to documents not in the retrieved set — hallucinated sources.

### Preferred Alternative
Validate citations post-generation. Check that each cited chunk ID exists in the retrieved set.

### Detection Checklist
- [ ] Citations to non-existent documents
- [ ] No citation validation
- [ ] Hallucinated sources in output
