# Anti-Patterns: Query Rewriting & Expansion

## Metadata

| | |
|---|---|
| **KU ID** | ku-03 |
| **Subdomain** | rag-search-pipelines |
| **Topic** | Query Rewriting & Expansion |
| **Source** | Industry / Academic |
| **Maturity** | New |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 14-rag-search-pipelines |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Rewriting Before Baseline Validation | Architecture | High |
| 2 | Aggressive Expansion for Rare Terms | Quality | Medium |
| 3 | No Fallback to Original Query | Reliability | High |
| 4 | Expensive LLM Rewriting for All Queries | Performance | Medium |

## Repository-Wide Anti-Patterns

- **Premature Rewriting**: Investing in query rewriting before establishing baseline retrieval quality
- **Over-Expansion**: Adding too many synonyms or related terms that introduce noise into retrieval
- **Rewrite-and-Forget**: Replacing the original query entirely without preserving it as fallback

---

## 1. Rewriting Before Baseline Validation

**Category:** Architecture

**Description:** Implementing query rewriting and expansion before measuring and optimizing baseline retrieval quality.

**Why It Happens:** Query rewriting feels like an obvious improvement. Teams assume rewriting will help without first understanding how retrieval performs with raw queries.

**Warning Signs:**
- No baseline retrieval metrics for unmodified queries
- Query rewriting implemented before chunking or embedding tuning
- Cannot measure whether rewriting improves or degrades results

**Why Harmful:** If baseline retrieval is poor (wrong chunking, bad embeddings, suboptimal search parameters), query rewriting masks the real problem and adds complexity without addressing root causes.

**Consequences:**
- Wasted effort on rewriting that compensates for fixable retrieval issues
- Harder to diagnose whether rewriting helps or hurts
- Increased pipeline latency without proven benefit

**Alternative:** Fix retrieval first — tune chunking, embedding, and search parameters. Measure baseline. Only add rewriting if there's a measurable gap.

**Refactoring Strategy:**
1. Establish baseline retrieval metrics with raw queries
2. Optimize chunking and embedding until recall targets are met
3. Only then assess whether query rewriting provides additional improvement

**Detection Checklist:**
- [ ] Are baseline retrieval metrics established?
- [ ] Is rewriting's impact measured against baseline?
- [ ] Are simpler optimizations exhausted before rewriting is added?

**Related Rules/Skills/Trees:**
- Rule: Measure Baseline Before Adding Rewriting (`04-standardized-knowledge.md:36-37`)

---

## 2. Aggressive Expansion for Rare Terms

**Category:** Quality

**Description:** Adding broad synonyms or related terms for rare or domain-specific terms, causing retrieval to match unrelated documents.

**Why It Happens:** Expansion seems harmless — more query terms should improve recall. Teams apply the same expansion strategy to all terms without considering term specificity.

**Warning Signs:**
- Rare technical terms get broad synonyms (e.g., "PostgreSQL" → "database" + "SQL" + "relational")
- Expanded queries return many irrelevant results
- Precision drops significantly after expansion

**Why Harmful:** Rare terms are already highly discriminative. Expanding them dilutes specificity and retrieves documents about related but incorrect topics.

**Consequences:**
- Lower precision from expanded queries matching unrelated content
- User sees irrelevant results for specific queries
- Harder to debug why irrelevant results appear

**Alternative:** Use domain-specific synonym lists. Apply expansion selectively — expand common terms, leave rare/specific terms untouched.

**Refactoring Strategy:**
1. Identify rare terms (low corpus frequency) in your domain
2. Create domain-specific synonym lists instead of generic ones
3. Test expansion's impact on precision for each term category

**Detection Checklist:**
- [ ] Are synonym lists domain-specific, not generic?
- [ ] Is expansion tested for precision impact?
- [ ] Are rare terms exempt from aggressive expansion?

**Related Rules/Skills/Trees:**
- Rule: Test Expansion for Precision Impact (`04-standardized-knowledge.md:39-40`)

---

## 3. No Fallback to Original Query

**Category:** Reliability

**Description:** Replacing the user's original query with a rewritten version without keeping the original as backup, potentially degrading results.

**Why It Happens:** Teams assume the rewritten query is always superior. The original query is discarded after rewriting.

**Warning Signs:**
- Only the rewritten query is sent to retrieval
- No A/B comparison of original vs rewritten results
- When rewriting degrades results, there's no recovery path

**Why Harmful:** Rewriting can introduce errors, change query intent, or expand in the wrong direction. Without the original query as fallback, degraded retrieval goes undetected and unrecoverable.

**Consequences:**
- Silent degradation when rewriting introduces errors
- No way to compare rewritten vs original performance
- Harder to debug rewriting issues in production

**Alternative:** Always search with both original and rewritten queries. Use fusion (RRF) to combine results. Or use the original query as fallback when rewriting confidence is low.

**Refactoring Strategy:**
1. Run retrieval with both original and rewritten queries
2. Use RRF or weighted fusion to combine result sets
3. Monitor rewritten query quality against baseline

**Detection Checklist:**
- [ ] Is the original query preserved as fallback?
- [ ] Are original + rewritten results compared?
- [ ] Is there monitoring for rewriting degradation?

**Related Rules/Skills/Trees:**
- Rule: Preserve Original Query as Fallback (`04-standardized-knowledge.md:40-41`)

---

## 4. Expensive LLM Rewriting for All Queries

**Category:** Performance

**Description:** Using an LLM for query rewriting on every single query, including simple ones that don't benefit from rewriting.

**Why It Happens:** LLM-based rewriting produces the best results in benchmarks. Teams apply it uniformly without cost stratification.

**Warning Signs:**
- Every query goes through LLM rewriting regardless of complexity
- Rewriting costs approach or exceed generation costs
- Simple queries (e.g., "weather today") go through expensive rewriting

**Why Harmful:** LLM rewriting adds 200-500ms and per-query API costs. For simple, well-formed queries, rule-based rewriting (spelling correction, synonym expansion) is faster, cheaper, and equally effective.

**Consequences:**
- Unnecessary latency (200-500ms) on every query
- API costs that could be avoided for simple queries
- Lower throughput from LLM call overhead

**Alternative:** Use a tiered approach — rule-based rewriting for simple queries, LLM-based rewriting only for complex or poorly performing ones.

**Refactoring Strategy:**
1. Implement rule-based rewriting first (spelling, synonyms)
2. Flag queries where rule-based rewriting is insufficient
3. Route only flagged queries to LLM-based rewriting
4. Cache rewritten queries to avoid repeated work

**Detection Checklist:**
- [ ] Are simple queries exempt from LLM rewriting?
- [ ] Is there a cost-per-query budget for rewriting?
- [ ] Is rewriting caching implemented?

**Related Rules/Skills/Trees:**
- Rule: Use Tiered Rewriting for Cost Optimization (`04-standardized-knowledge.md:40-41`)
