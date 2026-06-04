| Metadata | |
|---|---|
| Knowledge Unit ID | ku-05 |
| Subdomain | hybrid-search |
| Topic | Laravel Hybrid Implementation |
| Source | Community / Laravel |
| Maturity | Emerging |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-LHI-01 | Custom Scout Engine Before Trying Native Hybrid | Architecture |
| AP-LHI-02 | Application-Level Fusion When Engine Provides Native | Architecture |
| AP-LHI-03 | Sequential Dual Retrieval | Performance |
| AP-LHI-04 | Tightly Coupled Retrieval Paths | Maintainability |
| AP-LHI-05 | Ignoring Scout for the Keyword Path | Design |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-01: Deploying vector search without establishing a keyword baseline (`hybrid-search-concept/04-standardized-knowledge.md:37`)
- RAP-SEARCH-02: Skipping parallel retrieval in multi-path search (`hybrid-search-concept/05-rules.md:41`)
- RAP-SEARCH-03: Missing graceful degradation for partial search path failures (`hybrid-search-concept/05-rules.md:108`)

---

### AP-LHI-01: Custom Scout Engine Before Trying Native Hybrid

**Category:** Architecture

**Description:** Building a custom Scout engine that wraps both keyword and vector backends without first evaluating whether a single-engine hybrid solution (Meilisearch, Typesense, Qdrant) would suffice.

**Why It Happens:** Developers assume Laravel needs a custom Scout driver for hybrid search. Meilisearch/Typesense native hybrid capabilities are underrecognized.

**Warning Signs:**
- Custom Scout Engine class implementing hybrid search
- Multiple backend connections managed in a single engine
- No evaluation of single-engine hybrid alternatives documented

**Why Harmful:** Custom Scout engines require significant development, testing, and maintenance. A Meilisearch or Typesense native hybrid works with zero custom code.

**Consequences:**
- Months of custom engine development
- Ongoing maintenance burden for each Scout upgrade
- Two infrastructure dependencies instead of one

**Alternative:** Evaluate engine-level hybrid options first. Use Meilisearch/Typesense native hybrid if it meets requirements. Only build custom Scout engine as last resort.

**Refactoring Strategy:**
1. Audit current search engine capabilities for native hybrid support
2. If using Meilisearch/Typesense/Qdrant, switch to native hybrid configuration
3. Benchmark native hybrid against custom engine
4. If native hybrid meets requirements, deprecate custom Scout engine
5. If custom engine still needed, document why native was insufficient

**Detection Checklist:**
- [ ] Engine-level hybrid support evaluated
- [ ] Decision documented if native hybrid was rejected
- [ ] No custom Scout engine for simple hybrid use cases

**Related Rules/Skills/Trees:**
- Rule: Use Engine-Level Hybrid When Available (`laravel-hybrid-implementation/05-rules.md:1`)
- Decision Tree: Built-in vs Custom Hybrid Implementation (`laravel-hybrid-implementation/07-decision-trees.md:129`)

---

### AP-LHI-02: Application-Level Fusion When Engine Provides Native

**Category:** Architecture

**Description:** Implementing application-level PHP fusion (two API calls, custom RRF logic) when the underlying search engine already supports native hybrid search in a single call.

**Why It Happens:** Teams are unaware of engine capabilities. Legacy code written before the engine added hybrid support is never refactored.

**Warning Signs:**
- Two separate API calls to the same engine
- Custom RRF/weighted fusion code in PHP
- Engine documentation shows native hybrid support

**Why Harmful:** Application-level fusion doubles API calls, adds custom code, introduces more failure modes, and increases latency compared to a single native hybrid call.

**Consequences:**
- ~2x latency vs single engine call
- Extra PHP code to maintain and test
- Two points of failure instead of one

**Alternative:** Use engine-native hybrid (Meilisearch `hybrid` parameter, Typesense, Qdrant hybrid queries) which handles fusion server-side in a single request.

**Refactoring Strategy:**
1. Check if current search engine supports native hybrid
2. Replace dual API calls with single native hybrid call
3. Remove application-level fusion code
4. Verify results quality matches or exceeds previous implementation
5. Update documentation to reflect simplified architecture

**Detection Checklist:**
- [ ] Engine's native hybrid API tested
- [ ] Single-call hybrid benchmarked against application-level
- [ ] Application-level fusion code removed or deprecated

**Related Rules/Skills/Trees:**
- Rule: Use Engine-Level Hybrid When Available (`laravel-hybrid-implementation/05-rules.md:1`)
- Skill: Configure and Implement Laravel Hybrid Implementation (`laravel-hybrid-implementation/06-skills.md:1`)

---

### AP-LHI-03: Sequential Dual Retrieval

**Category:** Performance

**Description:** Running keyword and vector queries sequentially in application-level hybrid search, causing latency to be the sum of both paths.

**Why It Happens:** Simple linear PHP code. Async/await patterns are less familiar in Laravel. Developers don't consider parallelism at implementation time.

**Warning Signs:**
- Search service makes two sequential API calls
- No `async()`, `Http::pool()`, or queued dispatch in search
- Latency measurement = keyword_time + vector_time + fusion_time

**Why Harmful:** Latency becomes keyword + vector instead of max(keyword, vector), degrading user experience unnecessarily.

**Consequences:**
- Slow search page load times
- Higher p95/p99 latency under load
- User abandonment on search-heavy pages

**Alternative:** Execute both queries concurrently using Laravel's `Http::pool()`, `async()` helper, or queued jobs with batch dispatch.

**Refactoring Strategy:**
1. Wrap keyword query in async closure or dispatch
2. Wrap vector query in async closure or dispatch
3. Use `await()` or job batching to run both
4. Collect results and fuse
5. Benchmark: confirm latency ≈ max(keyword, vector) + fusion

**Detection Checklist:**
- [ ] Both queries execute concurrently in code
- [ ] Latency benchmark confirms concurrent behavior
- [ ] Async infrastructure tested under production load

**Related Rules/Skills/Trees:**
- Rule: Parallelize Application-Level Retrieval (`laravel-hybrid-implementation/05-rules.md:37`)
- Decision Tree: Hybrid Search Fusion Strategy (`laravel-hybrid-implementation/07-decision-trees.md:20`)

---

### AP-LHI-04: Tightly Coupled Retrieval Paths

**Category:** Maintainability

**Description:** Hard-coding specific SDK classes and engine implementations directly in search services, making engine switches costly and risky.

**Why It Happens:** Pragmatic first implementation. Developers directly use `MeiliSearch::search()` or `QdrantClient::search()` without abstraction layers.

**Warning Signs:**
- Search service imports specific vendor SDK classes
- Switching from pgvector to Qdrant requires rewriting search service
- Unit tests connect to real engines due to coupling

**Why Harmful:** Changing search engines (pgvector → Qdrant, Algolia → Meilisearch) becomes a full rewrite. Testing requires real infrastructure because there's no mockable interface.

**Consequences:**
- High switching cost between providers
- Slow test suite (hitting real infrastructure)
- Vendor lock-in avoidance requires expensive refactors

**Alternative:** Abstract each retrieval path behind a PHP interface (`SearchProvider` contract). Inject concrete implementations via service container.

**Refactoring Strategy:**
1. Define `SearchProvider` interface with `search(string $query, int $limit): array`
2. Create concrete implementation for current keyword provider
3. Create concrete implementation for current vector provider
4. Refactor search service to depend on interfaces
5. Add factory or service provider registration for engine selection
6. Write unit tests with mock implementations

**Detection Checklist:**
- [ ] SearchProvider interface exists
- [ ] Current engines implement the interface
- [ ] Search service depends on interface, not concrete class
- [ ] Unit tests pass without real infrastructure

**Related Rules/Skills/Trees:**
- Rule: Abstract Retrieval Paths Behind an Interface (`laravel-hybrid-implementation/05-rules.md:72`)
- Decision Tree: Built-in vs Custom Hybrid Implementation (`laravel-hybrid-implementation/07-decision-trees.md:129`)

---

### AP-LHI-05: Ignoring Scout for the Keyword Path

**Category:** Design

**Description:** Building a custom keyword retrieval implementation instead of using Laravel Scout's built-in keyword search capabilities.

**Why It Happens:** Teams developing hybrid search from scratch may not realize Scout already handles the keyword path with queues, pagination, and `whereIn` scoping.

**Warning Signs:**
- Raw Meilisearch/Typesense SDK calls for keyword search
- Custom pagination logic for search results
- Manual queue management for index updates

**Why Harmful:** Scout provides searchable model traits, automatic queueing of index updates, pagination helpers, and `whereIn` support. Rebuilding these wastes development time.

**Consequences:**
- Duplicated effort implementing Scout's built-in features
- Missing pagination, `whereIn` scoping, or soft delete handling
- Inconsistent search API across the application

**Alternative:** Use Scout's `Searchable` trait for keyword search, leveraging its built-in pagination, queueing, and query scoping.

**Refactoring Strategy:**
1. Add `Searchable` trait to models used in keyword path
2. Configure Scout driver for keyword engine
3. Replace raw SDK keyword calls with `Model::search($query)`
4. Use Scout's `paginate()` and `whereIn()` for results
5. Remove custom keyword search code

**Detection Checklist:**
- [ ] Models use Scout's `Searchable` trait
- [ ] Keyword search uses `Model::search()` not raw SDK
- [ ] Pagination handled by Scout
- [ ] Queueing configured for index updates

**Related Rules/Skills/Trees:**
- Rule: Use Scout for the Keyword Path (`laravel-hybrid-implementation/05-rules.md:108`)
- Skill: Configure and Implement Laravel Hybrid Implementation (`laravel-hybrid-implementation/06-skills.md:1`)
