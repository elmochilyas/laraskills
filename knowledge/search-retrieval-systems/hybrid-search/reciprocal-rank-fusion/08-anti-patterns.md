| Metadata | |
|---|---|
| KU ID | K061 |
| Subdomain | hybrid-search |
| Topic | RRF (Reciprocal Rank Fusion) |
| Source | Academic (Cormack et al., SIGIR 2009) |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-RRF-01 | Using k < 10 for RRF | Performance |
| AP-RRF-02 | Expecting RRF to Fix Poor Retrieval Paths | Design |
| AP-RRF-03 | Fusing Unlimited Candidate Pools | Performance |
| AP-RRF-04 | Not Handling Empty Result Lists | Reliability |
| AP-RRF-05 | Modifying the RRF Formula Unnecessarily | Design |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-03: Missing graceful degradation for partial search path failures (`hybrid-search-concept/05-rules.md:108`)
- RAP-SEARCH-04: Using raw scores without score normalization across different engines (`keyword-vector-fusion/04-standardized-knowledge.md:68`)

---

### AP-RRF-01: Using k < 10 for RRF

**Category:** Performance

**Description:** Setting the RRF damping parameter k to a value below 10, causing the top-ranked result in each list to dominate the fused result.

**Why It Happens:** Developers see `score = 1/(k + rank)` and assume lower k means more influence from ranking, not understanding the damping purpose.

**Warning Signs:**
- `k` parameter set to 1, 3, or 5
- Top-1 result from each path always dominates final ranking
- Changing k has minimal effect (because it's already near 0)

**Why Harmful:** Low k values give extreme weight to the top-ranked item in each list: `1/(1+0) = 1.0` vs `1/(1+9) = 0.1`. The top-1 dominates and lower-ranked items from either list cannot contribute meaningfully.

**Consequences:**
- Effectively single-result fusion from each path
- Missed relevant results that rank slightly lower in either list
- RRF behaves more like "take the best single result" than true fusion

**Alternative:** Use k=60 as the empirically established default. Only tune k with specific data and benchmarks.

**Refactoring Strategy:**
1. Set k=60 in all RRF calls
2. If previous k < 10 was used, benchmark k=60 against previous results
3. Verify that lower-ranked results now contribute to final ranking
4. If k=60 produces worse results for specific data, tune k in 30-100 range with benchmark validation
5. Document chosen k value and rationale

**Detection Checklist:**
- [ ] k value is 60 (or validated alternative in 30-100 range)
- [ ] No RRF calls with k < 10
- [ ] Lower-ranked results contribute to final ranking

**Related Rules/Skills/Trees:**
- Rule: Use k=60 as Default for RRF (`reciprocal-rank-fusion/05-rules.md:34`)
- Decision Tree: Hybrid Search Fusion Strategy (`reciprocal-rank-fusion/07-decision-trees.md:20`)

---

### AP-RRF-02: Expecting RRF to Fix Poor Retrieval Paths

**Category:** Design

**Description:** Relying on RRF fusion to compensate for one or both retrieval paths having fundamentally low recall or poor result quality.

**Why It Happens:** Misunderstanding of what fusion does. RRF combines rankings — it cannot create relevant results that neither path found.

**Warning Signs:**
- One retrieval path has recall < 50%
- Team attributes poor hybrid results to RRF algorithm rather than path quality
- Fusion tuning activities dominate over path optimization

**Why Harmful:** RRF cannot fix broken retrieval. If neither path finds relevant documents, fusion produces nothing. If one path has poor recall, fusion amplifies its irrelevant results.

**Consequences:**
- Persistent poor search quality despite fusion tuning
- Wasted effort on RRF parameter optimization
- False conclusion that hybrid search doesn't work

**Alternative:** Benchmark and optimize each retrieval path individually before relying on RRF fusion.

**Refactoring Strategy:**
1. Measure each path's recall independently (keyword-only, vector-only)
2. Identify which path(s) have below-threshold recall
3. Fix path-level issues: improve indexing, embedding model, query preprocessing
4. Re-benchmark individual paths until each meets minimum recall threshold
5. Only then evaluate RRF fusion improvement over individual paths
6. Document each path's contribution to final fused results

**Detection Checklist:**
- [ ] Each path's recall measured independently
- [ ] Each path meets minimum recall threshold
- [ ] Fusion improvement measured over best single path
- [ ] Both paths contribute to fused results

**Related Rules/Skills/Trees:**
- Rule: Use RRF for Most Fusion Scenarios (`reciprocal-rank-fusion/05-rules.md:1`)
- Rule: Limit RRF Candidate Pool to Top-100 (`reciprocal-rank-fusion/05-rules.md:63`)
- Decision Tree: Hybrid Search Fusion Strategy (`reciprocal-rank-fusion/07-decision-trees.md:20`)

---

### AP-RRF-03: Fusing Unlimited Candidate Pools

**Category:** Performance

**Description:** Passing very large result lists (top-1000+) from each retrieval path into RRF, causing unnecessary computation with negligible recall improvement.

**Why It Happens:** Assumption that more candidates always improves recall. Lack of awareness of diminishing returns beyond top-100.

**Warning Signs:**
- RRF receives result lists of 1000+ items per path
- Fusion step takes measurable time (milliseconds instead of microseconds)
- Memory usage spikes during fusion
- Final top-20 results rarely include items beyond rank-100 from any path

**Why Harmful:** RRF computation is O(m × n). Processing 1000 items from 2 paths is 10x more work than 100 items, with negligible impact on final top-20 results.

**Consequences:**
- Wasted CPU cycles on every search query
- Higher memory usage per request
- Reduced throughput under load

**Alternative:** Cap candidate pools at top-100 per path before RRF fusion.

**Refactoring Strategy:**
1. Set each retrieval path's limit to top-100 (or equivalent)
2. Benchmark recall at top-100 vs top-1000
3. Verify that top-100 captures sufficient recall for final top-20
4. If recall loss is unacceptable, increase gradually while monitoring performance
5. Document the pool size and tradeoffs

**Detection Checklist:**
- [ ] Candidate pool size limited to top-100 per path
- [ ] Recall at top-100 vs larger pools validated
- [ ] Fusion computation time measured and acceptable

**Related Rules/Skills/Trees:**
- Rule: Limit RRF Candidate Pool to Top-100 (`reciprocal-rank-fusion/05-rules.md:63`)
- Rule: Cap Candidate Pool at Top-100 Per Path (`hybrid-search-concept/05-rules.md:71`)
- Skill: Optimize and Monitor Reciprocal Rank Fusion Production Search (`reciprocal-rank-fusion/06-skills.md:81`)

---

### AP-RRF-04: Not Handling Empty Result Lists

**Category:** Reliability

**Description:** RRF implementation that crashes or produces errors when one or more input result lists are empty.

**Why It Happens:** RRF examples typically show happy-path code. Error handling for empty lists is omitted for brevity and never added later.

**Warning Signs:**
- RRF function throws `Division by zero` or array index errors when one path returns empty
- Hybrid search fails entirely when keyword or vector path returns zero results
- No `if (empty($list))` guards in RRF implementation

**Why Harmful:** A single retrieval path returning zero results (index missing, filter mismatch, temporary outage) causes the entire search to fail, even though results from the other path are available.

**Consequences:**
- Complete search outage when one path silently returns empty
- Unnecessary 500 errors for users
- Emergency debugging during path-related incidents

**Alternative:** Add empty array detection at the start of RRF: skip empty lists, return results from surviving lists, or return empty if all lists empty.

**Refactoring Strategy:**
1. Add `array_filter` or explicit check at start of RRF function
2. Remove empty lists before fusion: `$lists = array_filter($lists, fn($l) => !empty($l));`
3. If all lists empty after filtering, return empty array
4. If only one list remains, return it directly (no fusion needed)
5. Test with empty keyword, empty vector, and both empty scenarios

**Detection Checklist:**
- [ ] RRF handles empty input lists gracefully
- [ ] Surviving path results returned when one list empty
- [ ] Empty array returned when all lists empty
- [ ] Unit tests cover empty list scenarios

**Related Rules/Skills/Trees:**
- Rule: Handle Empty Result Lists Gracefully (`reciprocal-rank-fusion/05-rules.md:96`)
- Rule: Implement Graceful Degradation for Path Failures (`hybrid-search-concept/05-rules.md:103`)

---

### AP-RRF-05: Modifying the RRF Formula Unnecessarily

**Category:** Design

**Description:** Making non-standard modifications to the RRF formula (changing the score calculation, adding custom weights, introducing non-linear transformations) without proven benefit.

**Why It Happens:** Teams feel the need to customize rather than use a standard algorithm. The simple formula invites "improvements."

**Warning Signs:**
- RRF implementation uses non-standard formula: `1 / (k + rank^n)` or similar
- Custom weights applied per engine: `w1 * 1/(k+rank) + w2 * 1/(k+rank)`
- Additional transformations (log, sqrt) applied to RRF scores

**Why Harmful:** The RRF formula is empirically established and theoretically justified. Modifications introduce unknown behavior, may degrade fusion quality, and break compatibility with engine-native RRF implementations.

**Consequences:**
- Fusion results inconsistent with engine-native RRF
- Harder to debug and reason about fusion behavior
- Modifications may introduce bias or degrade quality
- Vendor lock-in by custom formula (hard to switch to engine-native RRF)

**Alternative:** Use the standard RRF formula as published. If custom behavior is needed, use weighted fusion or cross-encoder re-ranking as explicit alternatives.

**Refactoring Strategy:**
1. Audit RRF implementation for non-standard modifications
2. Revert to standard formula: `score += 1 / ($k + $rank + 1)`
3. If custom behavior was providing value, implement it as a separate fusion algorithm (not modification of RRF)
4. Benchmark standard RRF against modified version
5. If standard RRF performs equally or better, remove modifications

**Detection Checklist:**
- [ ] RRF follows standard formula: `1/(k + rank)`
- [ ] No custom modifications to the core algorithm
- [ ] Modifications (if any) are benchmarked and justified

**Related Rules/Skills/Trees:**
- Rule: Use RRF for Most Fusion Scenarios (`reciprocal-rank-fusion/05-rules.md:1`)
- Skill: Configure and Implement Reciprocal Rank Fusion (`reciprocal-rank-fusion/06-skills.md:1`)
