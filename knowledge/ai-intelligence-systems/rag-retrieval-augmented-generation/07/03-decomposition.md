# Decomposition: RAG Security & Data Governance

## Topic Overview

RAG security and data governance covers the controls, policies, and practices for safely managing data in a RAG system â€” from document ingestion through retrieval to generation. Because RAG systems combine a knowledge base (potentially containing sensitive information) with an LLM, the attack surface is broader than either component alone: documents can be poisoned, retrieval can expose unauthorized content, and the LLM can leak information from retrieved context.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-07/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### RAG Security & Data Governance
- **Purpose:** RAG security and data governance covers the controls, policies, and practices for safely managing data in a RAG system â€” from document ingestion through retrieval to generation. Because RAG systems combine a knowledge base (potentially containing sensitive information) with an LLM, the attack surface is broader than either component alone: documents can be poisoned, retrieval can expose unauthorized content, and the LLM can leak information from retrieved context.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-04, ku-01, ku-04, ku-04

## Dependency Graph
**Depends on:**
- ku-01
- ku-04
- ku-01
- ku-04
- ku-04

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Document-Level Access Control:** Restricting which documents (and which chunks) a user can retrieve based on their permissions.
- **Index Security:** Protecting the vector index from unauthorized access, modification, or extraction.
- **Retrieval Authorization:** Checking user permissions against document access control lists (ACLs) during retrieval.
- **Context-Level Filtering:** Removing sensitive content from retrieved context before injection (even if the user has access to the document).
- **Document Provenance:** Tracking the source, ingestion date, and integrity of each document in the knowledge base.
- **Index Poisoning:** An attacker injecting malicious documents into the knowledge base that, when retrieved, influence LLM outputs.
- **Retrieval Audit Trail:** Logging which documents were retrieved for which queries, by which users.
- **Data Retention:** Policies for how long documents and their embeddings are retained, and how deletion propagates.

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs

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

