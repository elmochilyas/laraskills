# Anti-Patterns: Search Appliance Comparison

## Metadata

| | |
|---|---|
| **KU ID** | ku-04 |
| **Subdomain** | dedicated-search-appliances |
| **Topic** | Search Appliance Comparison |
| **Source** | Meilisearch / Typesense / Algolia / Scout Docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 16-search-system-decision-guides |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Switching Engines as First Optimization | Architecture | High |
| 2 | Running Multiple Engines Without Clear Need | Architecture | Medium |
| 3 | Ignoring Scout's Database Engine Capability | Architecture | High |
| 4 | Assuming Cloud Is Always Better | Cost | Medium |

## Repository-Wide Anti-Patterns

- **Engine-Swap Quick Fix**: Changing the search engine provider to solve problems that should be fixed with relevance tuning
- **Engine Proliferation**: Running multiple search engines simultaneously without a clear use case for each
- **Over-Engineering Complexity**: Adding a dedicated search appliance when the built-in Scout database engine would suffice

---

## 1. Switching Engines as First Optimization

**Category:** Architecture

**Description:** Changing the search engine to a different provider as the first response to search quality or performance issues, before tuning relevance or indexing parameters.

**Why It Happens:** Switching engines feels like a clean solution. It's easier to advocate for a change than to deeply tune the current engine's relevance settings.

**Warning Signs:**
- Search quality issues immediately attributed to "engine limitations"
- No attempt to tune ranking rules, synonyms, or filters before switching
- History of switching engines without documenting lessons learned

**Why Harmful:** Engine migration is expensive and time-consuming. Most search quality issues are fixable within the current engine through relevance tuning, ranking rules, and data optimization.

**Consequences:**
- Months of migration effort when tuning would have solved the problem
- Potential data loss or schema changes during migration
- New engine brings its own set of issues to discover

**Alternative:** Before switching engines, exhaust tuning options: ranking rules, synonyms, faceting, custom ranking, and relevance configuration.

**Refactoring Strategy:**
1. Document specific search quality issues with examples
2. Research whether the current engine can address them through configuration
3. Tune relevance before evaluating engine alternatives
4. Benchmark before and after each tuning change

**Detection Checklist:**
- [ ] Has relevance tuning been fully explored?
- [ ] Are search quality issues documented specifically?
- [ ] Is there evidence that the current engine cannot meet requirements?

**Related Rules/Skills/Trees:**
- Rule: Tune Before Switching (`04-standardized-knowledge.md:37-38`)

---

## 2. Running Multiple Engines Without Clear Need

**Category:** Architecture

**Description:** Operating two or more search engines simultaneously without a clear, justified need for each, adding infrastructure complexity.

**Why It Happens:** Teams try multiple engines for different features and never consolidate. Different developers choose different engines for different projects.

**Warning Signs:**
- Two search engines running for the same application
- No documented criteria for which engine handles which queries
- Increased operational burden from maintaining multiple systems

**Why Harmful:** Each engine requires infrastructure, monitoring, backup, and expertise. Multiple engines multiply operational costs and split team knowledge.

**Consequences:**
- Higher infrastructure and operational costs
- Fragmented search expertise across the team
- Inconsistent search behavior across the application
- Harder to maintain and debug

**Alternative:** Consolidate to a single search engine that meets the majority of use cases. Use additional engine only if there's a clear, measurable need.

**Refactoring Strategy:**
1. Document what each search engine handles
2. Identify overlap — where could one engine serve both needs?
3. Plan migration to consolidate on the primary engine
4. Only keep multiple engines if there's a distinct, non-overlapping requirement

**Detection Checklist:**
- [ ] How many search engines are running in production?
- [ ] Is each engine's purpose documented and justified?
- [ ] Could a single engine serve all use cases?

**Related Rules/Skills/Trees:**
- Rule: Consolidate to One Engine When Possible (`04-standardized-knowledge.md:40-41`)

---

## 3. Ignoring Scout's Database Engine Capability

**Category:** Architecture

**Description:** Deploying a dedicated search appliance (Meilisearch, Typesense, Algolia) for applications with small datasets where the built-in Scout database engine would suffice.

**Why It Happens:** Dedicated search engines are more powerful and feature-rich. Teams assume they're always the right choice.

**Warning Signs:**
- Dataset <50K records
- No requirement for full-text search features beyond basic LIKE queries
- Infrastructure budget spent on search server for small application

**Why Harmful:** For small datasets, the Scout database engine provides adequate search at zero additional infrastructure cost. Dedicated engines add operational complexity, cost, and maintenance burden.

**Consequences:**
- Unnecessary monthly hosting costs ($10-100+)
- Operational overhead of managing another service
- No noticeable search quality improvement over database engine

**Alternative:** Start with the Scout database engine for small datasets (<50K records). Migrate to a dedicated engine only when dataset size or feature requirements exceed its capability.

**Refactoring Strategy:**
1. Benchmark Scout database engine against current dedicated engine on small dataset
2. If database engine meets requirements, plan migration
3. Use the saved infrastructure budget for other improvements

**Detection Checklist:**
- [ ] What is the dataset size?
- [ ] Has the Scout database engine been evaluated?
- [ ] Does the application actually need a dedicated search appliance?

**Related Rules/Skills/Trees:**
- Rule: Start with Scout Database Engine (`04-standardized-knowledge.md:38-39`)

---

## 4. Assuming Cloud Is Always Better

**Category:** Cost

**Description:** Choosing a cloud-managed search service (Algolia, Meilisearch Cloud, Typesense Cloud) without evaluating self-hosted alternatives, assuming managed is always superior.

**Why It Happens:** Cloud-managed services reduce operational burden. Teams don't calculate the long-term cost comparison or consider data sovereignty requirements.

**Warning Signs:**
- No self-hosted cost analysis performed
- Monthly search costs growing faster than application growth
- Data residency/compliance requirements conflict with cloud provider regions

**Why Harmful:** Cloud-managed search services charge per query or per document — costs scale with usage in ways that may exceed self-hosted infrastructure costs significantly.

**Consequences:**
- Unpredictable or ballooning search costs
- Inability to control cost growth
- Data sovereignty or compliance violations
- Vendor lock-in making migration expensive

**Alternative:** Evaluate both cloud-managed and self-hosted options with total cost of ownership (infrastructure + operations + scalability) over a 3-year horizon.

**Refactoring Strategy:**
1. Calculate 3-year TCO for both cloud and self-hosted options
2. Factor in team ops capability and time
3. Consider data residency and compliance requirements
4. Choose based on total cost, not just operational simplicity

**Detection Checklist:**
- [ ] Is self-hosted TCO compared with cloud managed?
- [ ] Are data residency requirements considered?
- [ ] Is vendor lock-in risk assessed?

**Related Rules/Skills/Trees:**
- Rule: Compare Cloud vs Self-Hosted TCO (`04-standardized-knowledge.md:40-41`)
