| Metadata | |
|---|---|
| Knowledge Unit ID | ku-03 |
| Subdomain | hybrid-search |
| Topic | RRF - Reciprocal Rank Fusion |
| Source | Cormack et al., SIGIR 2009 |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-RRF2-01 | Using RRF with a Single Result List | Design |
| AP-RRF2-02 | Adding External RRF Library Dependency | Maintainability |
| AP-RRF2-03 | Fusing Unranked Results | Design |
| AP-RRF2-04 | Ignoring Rank Normalization for Unequal List Lengths | Performance |
| AP-RRF2-05 | Optimizing k Parameter Without Data | Testing |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-04: Using raw scores without score normalization across different engines (`keyword-vector-fusion/04-standardized-knowledge.md:68`)
- RAP-SEARCH-03: Missing graceful degradation for partial search path failures (`hybrid-search-concept/05-rules.md:108`)

---

### AP-RRF2-01: Using RRF with a Single Result List

**Category:** Design

**Description:** Applying RRF fusion when only a single ranked result list exists, producing the same output as the input with unnecessary computation.

**Why It Happens:** Generic fusion wrapper code always calls RRF regardless of how many retrieval paths are active. No guard for the single-path case.

**Warning Signs:**
- RRF called with one-element array: `rrf([$singleList], k: 60)`
- Fusion code doesn't check `count($lists) <= 1` before processing
- RRF output identical to input list

**Why Harmful:** RRF with a single list is a no-op — the sum of reciprocals is monotonically decreasing with rank, preserving the original order. The computation is wasted.

**Consequences:**
- Unnecessary function call overhead on every search query
- Dead code obscuring the fact that only one path is active
- Misleading log lines showing "fusion" when no fusion occurs

**Alternative:** Check the number of lists before applying RRF. If ≤ 1, return the list directly.

**Refactoring Strategy:**
1. Add early return in fusion function: `if (count($lists) <= 1) return $lists[0] ?? [];`
2. Log when fusion is skipped due to single path
3. Verify behavior with both single-path and multi-path calls
4. Consider whether the single-path caller should even invoke fusion

**Detection Checklist:**
- [ ] Fusion function checks count of lists before processing
- [ ] Single-path queries skip RRF computation
- [ ] Logging distinguishes fused vs unfused results

**Related Rules/Skills/Trees:**
- Rule: Use RRF Only When Multiple Ranked Lists Exist (`rrf-reciprocal-rank-fusion/05-rules.md:71`)
- Decision Tree: Hybrid Search Fusion Strategy (`rrf-reciprocal-rank-fusion/07-decision-trees.md:20`)

---

### AP-RRF2-02: Adding External RRF Library Dependency

**Category:** Maintainability

**Description:** Installing a Composer package or external library for RRF fusion instead of implementing the trivial ~15-line pure PHP function.

**Why It Happens:** Habitual dependency installation. Teams assume "there must be a package for this" without evaluating implementation complexity.

**Warning Signs:**
- `composer.json` includes an RRF or fusion library
- Fusion class extends an external abstract fusion class
- Version conflicts from fusion library dependencies

**Why Harmful:** RRF is ~15 lines of PHP. External dependencies introduce version constraints, security updates, and additional maintenance burden for trivial functionality.

**Consequences:**
- Dependency update notifications for trivial code
- Version conflicts with other packages
- Build pipeline bloat

**Alternative:** Implement RRF as a standalone pure PHP function in the application.

**Refactoring Strategy:**
1. Write RRF function: 15 lines of PHP
2. Remove external RRF library from composer.json
3. Remove any package-specific configuration
4. Update all fusion references to use the local function
5. Run `composer remove vendor/rrf-library`
6. Add unit tests for the local implementation

**Detection Checklist:**
- [ ] No external RRF library in composer.json
- [ ] RRF implemented as local pure PHP function
- [ ] Unit tests cover the RRF implementation
- [ ] No fusion functionality depends on external package

**Related Rules/Skills/Trees:**
- Rule: Implement RRF in Under 20 Lines (`rrf-reciprocal-rank-fusion/05-rules.md:1`)
- Skill: Configure and Implement Rrf Reciprocal Rank Fusion (`rrf-reciprocal-rank-fusion/06-skills.md:1`)

---

### AP-RRF2-03: Fusing Unranked Results

**Category:** Design

**Description:** Passing unranked result lists (where all items have equal rank or random order) into RRF, producing meaningless fusion output.

**Why It Happens:** Both retrieval paths produce unsorted results (e.g., both return results with equal scores). RRF treats unranked items as rank 0, giving them all equal score.

**Warning Signs:**
- All items in an input list have the same RRF contribution
- Fused results don't reflect item relevance
- Items from different lists appear interleaved in no discernible pattern

**Why Harmful:** RRF requires ranked inputs to produce meaningful output. Unranked inputs result in all items from each list receiving the same score, degrading to arbitrary ordering.

**Consequences:**
- Fused ranking is essentially random
- Users see poorly ordered results
- Debugging fusion is difficult because inputs are valid but unranked

**Alternative:** Ensure both retrieval paths return ranked results. If a path cannot rank, assign sequential ranks based on any available ordering (score, date, ID).

**Refactoring Strategy:**
1. Verify each retrieval path returns results with meaningful rank positions
2. If a path returns unranked results, assign ranks based on a deterministic ordering (score descending, then ID ascending)
3. Ensure both lists have the same ordering semantics (higher rank = more relevant)
4. Re-benchmark fusion quality after rank assignment
5. Document ranking requirements for each retrieval path

**Detection Checklist:**
- [ ] Both retrieval paths return ranked results
- [ ] Rank positions reflect meaningful relevance ordering
- [ ] RRF inputs have varied ranks (not all same)
- [ ] Fused results show meaningful ordering

**Related Rules/Skills/Trees:**
- Rule: Use RRF for Most Fusion Scenarios (`reciprocal-rank-fusion/05-rules.md:1`)
- Skill: Configure and Implement Rrf Reciprocal Rank Fusion (`rrf-reciprocal-rank-fusion/06-skills.md:1`)

---

### AP-RRF2-04: Ignoring Rank Normalization for Unequal List Lengths

**Category:** Performance

**Description:** Fusing result lists of significantly different lengths (e.g., 100 items vs 10 items) without normalizing ranks, causing systematic bias toward the longer list.

**Why It Happens:** RRF example code typically shows lists of equal length. The bias from unequal lengths is subtle and easy to miss.

**Warning Signs:**
- Input lists have consistently different lengths
- Longer list provides most of the fused results
- Shorter list's items rarely appear in fused top-20 despite high relevance

**Why Harmful:** RRF scores are cumulative across ranks. A 100-item list gives each item scores at positions 0-99. A 10-item list gives items scores at positions 0-9 only. The 100-item list's tail items (rank 10-99) accumulate more RRF score than the 10-item list's items, systematically biasing against the shorter list.

**Consequences:**
- Systematic bias favoring the longer result list
- Better items from the shorter list are suppressed
- Hybrid quality is degraded despite both paths being individually good

**Alternative:** Trim or pad lists to equal length before fusion, or use list-length-normalized RRF variants.

**Refactoring Strategy:**
1. Identify lists with consistently unequal lengths
2. Option A: Trim all lists to the shortest list's length before fusion
3. Option B: Pad shorter lists with "virtual" items at rank (length) that contribute decreasing scores
4. Benchmark normalizing vs not normalizing
5. Document the normalization strategy

**Detection Checklist:**
- [ ] Input list lengths checked before fusion
- [ ] Unequal list lengths handled (trim or pad)
- [ ] No systematic bias toward longer list in fused results
- [ ] Both paths contribute proportionally to fused results

**Related Rules/Skills/Trees:**
- Rule: Normalize Input Ranks for Unequal List Lengths (`rrf-reciprocal-rank-fusion/05-rules.md:40`)
- Decision Tree: Hybrid Search Fusion Strategy (`rrf-reciprocal-rank-fusion/07-decision-trees.md:20`)

---

### AP-RRF2-05: Optimizing k Parameter Without Data

**Category:** Testing

**Description:** Spending time tuning the RRF k parameter without a benchmark dataset or quality metrics to evaluate the effect of different k values.

**Why It Happens:** Developers want to optimize every parameter. Without a benchmark, tuning is based on intuition and manual inspection, which is unreliable.

**Warning Signs:**
- RRF k value is tuned manually by observing sample queries
- No formal benchmark (NDCG, MRR) used to evaluate k values
- Different team members prefer different k values without objective comparison
- k value changes frequently without documented improvement

**Why Harmful:** k=60 is the empirically established default that works well across diverse domains. Tuning k without data is guesswork, likely producing no improvement or worse results.

**Consequences:**
- Wasted development time tuning a parameter that's already optimal
- Potentially worse fusion quality from non-standard k values
- No data to support the chosen parameter

**Alternative:** Use k=60 as default. Only tune k if you have a representative benchmark dataset and formal quality metrics (NDCG, MRR).

**Refactoring Strategy:**
1. Set k=60 as default in all RRF calls
2. If tuning is desired, create a benchmark dataset of at least 100 representative queries with relevance judgments
3. Implement NDCG or MRR evaluation
4. Test k values [30, 60, 100] against the benchmark
5. Only change default k if statistically significant improvement is measured
6. Document benchmark results and final k value

**Detection Checklist:**
- [ ] Default k=60 used unless tuned with data
- [ ] Benchmark dataset exists if k is non-default
- [ ] Quality metrics document improvement from non-default k
- [ ] k value not changed frequently without data

**Related Rules/Skills/Trees:**
- Rule: Use k=60 as Default for RRF (`reciprocal-rank-fusion/05-rules.md:34`)
- Skill: Optimize and Monitor Rrf Reciprocal Rank Fusion Production Search (`rrf-reciprocal-rank-fusion/06-skills.md:81`)
- Decision Tree: Hybrid Search Fusion Strategy (`rrf-reciprocal-rank-fusion/07-decision-trees.md:20`)
