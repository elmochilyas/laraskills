# Anti-Patterns: Vector Search in Laravel AI

## Metadata

| | |
|---|---|
| **KU ID** | ku-05 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Vector Search in Laravel AI |
| **Source** | Community / Laravel |
| **Maturity** | Emerging |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Over-Engineering the First Implementation | Architecture | Medium |
| 2 | No Embedding Caching | Performance | High |
| 3 | Synchronous Bulk Embedding | Performance | High |
| 4 | No Cost Monitoring from Day One | Scalability | Medium |

## Repository-Wide Anti-Patterns

- **Architecture-Astronaut Starting Point**: Deploying Qdrant + FastEmbed + cross-encoder before proving need with pgvector + OpenAI
- **Request-Cycle Embedding**: Generating embeddings synchronously in HTTP requests for bulk operations
- **Cost Blindness**: Running embedding pipelines for weeks without monitoring API costs

---

## 1. Over-Engineering the First Implementation

**Category:** Architecture

**Description:** Starting vector search with a complex multi-engine architecture (Qdrant + FastEmbed + cross-encoder) before validating the approach with simple API embeddings + pgvector.

**Why It Happens:** Teams plan for scale from day one. The excitement of building an "enterprise-grade" vector search leads to premature infrastructure decisions.

**Warning Signs:**
- First implementation uses multiple vector-related services
- No simple baseline exists (API embeddings + pgvector)
- Team can't articulate why simpler approach is insufficient

**Why Harmful:** Complex architectures slow iteration, increase deployment friction, and make it harder to validate whether vector search solves the actual problem.

**Consequences:**
- Months of setup before first vector search query
- Unnecessary infrastructure costs
- Difficulty debugging across multiple services

**Alternative:** Start with API embeddings + pgvector. Add complexity only when benchmarks prove it necessary.

**Refactoring Strategy:**
1. Replace complex stack with API embeddings + pgvector
2. Benchmark quality
3. Only add complexity if needed

**Detection Checklist:**
- [ ] Is the first implementation the simplest viable?
- [ ] Was a simple baseline evaluated?

**Related Rules/Skills/Trees:**
- Rule: Start Simple: API Embeddings + pgvector (`05-rules.md:1-32`)
