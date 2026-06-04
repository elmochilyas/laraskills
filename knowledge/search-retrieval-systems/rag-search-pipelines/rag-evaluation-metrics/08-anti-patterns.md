# Anti-Patterns: RAG Evaluation Metrics

## Metadata

| | |
|---|---|
| **KU ID** | ku-04 |
| **Subdomain** | rag-search-pipelines |
| **Topic** | RAG Evaluation Metrics |
| **Source** | Academic / Industry |
| **Maturity** | New |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 14-rag-search-pipelines |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Evaluating Without Ground Truth | Testing | High |
| 2 | Only Measuring Generation Quality | Testing | Medium |
| 3 | No Online Monitoring | Observability | High |
| 4 | Treating Evaluation as One-Time | Process | Medium |

## Repository-Wide Anti-Patterns

- **Ground Truth Fallacy**: Believing evaluation metrics are reliable without a curated ground truth dataset
- **Generation-Only Focus**: Measuring only LLM answer quality while ignoring retrieval metrics
- **Offline-Only Evaluation**: Relying entirely on offline benchmarks without production monitoring

---

## 1. Evaluating Without Ground Truth

**Category:** Testing

**Description:** Reporting evaluation metrics (recall, precision, NDCG) without a ground truth dataset of relevant documents per query.

**Why It Happens:** Creating ground truth requires manual effort. Teams use automated metrics (e.g., RAGAS scores) as proxy and assume they're reliable.

**Warning Signs:**
- No curated test set with known relevant documents
- Metrics reported without any notion of "ground truth relevance"
- Relying entirely on LLM-judged metrics without validation

**Why Harmful:** Without ground truth, metrics like recall and precision cannot be reliably computed. LLM-based judges have their own biases and errors, making metrics unreliable for tracking improvement or regression.

**Consequences:**
- False confidence in system quality
- Unable to detect regressions reliably
- Metric improvements may not correspond to real quality gains

**Alternative:** Invest in creating a ground truth test set of 100-200 queries with human-judged relevant documents. Use this for all offline evaluation.

**Refactoring Strategy:**
1. Curate 100-200 queries with diverse coverage
2. Manually identify relevant documents for each query
3. Use this ground truth set for all offline metrics
4. Periodically refresh the test set to prevent overfitting

**Detection Checklist:**
- [ ] Is there a ground truth test set?
- [ ] Are metrics validated against ground truth?
- [ ] Is LLM-judged evaluation cross-checked with human judgment?

**Related Rules/Skills/Trees:**
- Rule: Create Ground Truth Test Set (`04-standardized-knowledge.md:38-39`)

---

## 2. Only Measuring Generation Quality

**Category:** Testing

**Description:** Evaluating only LLM answer quality (faithfulness, relevance) without measuring retrieval quality (recall, precision, MRR).

**Why It Happens:** Generation metrics feel more meaningful — they measure what users actually see. Retrieval metrics seem like lower-level implementation details.

**Warning Signs:**
- Dashboards show only answer-level metrics
- No retrieval recall or precision metrics tracked
- Unable to answer if poor answers are from retrieval gaps or generation errors

**Why Harmful:** If generation quality is poor but you don't measure retrieval, you can't determine whether the problem is missing context or poor LLM reasoning. This makes debugging a guessing game.

**Consequences:**
- Slow debugging cycles (can't isolate retrieval vs generation issues)
- Wrong optimizations applied (tuning prompts when retrieval is the problem)
- Incomplete understanding of system quality

**Alternative:** Always evaluate retrieval and generation separately. Track recall, MRR, and NDCG for retrieval. Track faithfulness and relevance for generation.

**Refactoring Strategy:**
1. Add retrieval-specific metrics (recall@K, MRR, NDCG) to evaluation
2. Separate dashboards for retrieval and generation quality
3. Debug retrieval first when quality degrades

**Detection Checklist:**
- [ ] Are retrieval metrics tracked separately from generation metrics?
- [ ] Is there a dashboard showing both?
- [ ] Can you identify whether quality issues are retrieval or generation related?

**Related Rules/Skills/Trees:**
- Rule: Evaluate Retrieval and Generation Separately (`04-standardized-knowledge.md:39-40`)

---

## 3. No Online Monitoring

**Category:** Observability

**Description:** Relying only on offline evaluation metrics without monitoring real-world RAG performance in production.

**Why It Happens:** Offline evaluation is easier to implement and control. Online monitoring requires logging, storage, and dashboard infrastructure.

**Warning Signs:**
- No production logging of queries, chunks, or answers
- No user feedback tracking (thumbs up/down)
- Production issues discovered only through user complaints

**Why Harmful:** Offline test sets can't capture all real-world query patterns. Production data drift, LLM API changes, and evolving user behavior are invisible without online monitoring.

**Consequences:**
- Blind to production degradation
- Delayed incident detection (users notice before team does)
- No data to prioritize improvements

**Alternative:** Implement production monitoring — log queries, retrieved chunks, generation latency, and user feedback. Alert on metric degradation.

**Refactoring Strategy:**
1. Add logging for every RAG query (original, rewritten, retrieved chunks, answer, latency, user feedback)
2. Build dashboard for online metrics (answer rate, faithfulness, user satisfaction)
3. Configure alerts for metric degradation

**Detection Checklist:**
- [ ] Are RAG queries logged in production?
- [ ] Is user feedback (thumbs up/down) tracked?
- [ ] Are alerts configured for metric degradation?

**Related Rules/Skills/Trees:**
- Rule: Monitor RAG Quality Online (`04-standardized-knowledge.md:40-41`)

---

## 4. Treating Evaluation as One-Time

**Category:** Process

**Description:** Performing RAG evaluation once before launch and never re-evaluating, assuming quality remains constant.

**Why It Happens:** Evaluation is effort-intensive. After launch, teams shift focus to feature development and deprioritize ongoing measurement.

**Warning Signs:**
- Last evaluation was before production launch
- No scheduled re-evaluation (weekly, nightly)
- Quality degradation goes unnoticed for weeks

**Why Harmful:** RAG quality degrades over time due to data drift (new documents, changed content), LLM API changes (model updates, deprecation), and shifting user query patterns.

**Consequences:**
- Silent quality degradation over time
- Inability to attribute quality changes to specific timeline events
- Reactive (user complaint-driven) rather than proactive quality management

**Alternative:** Automate nightly evaluation runs against the test set. Track metric trends over time with alerting on significant changes.

**Refactoring Strategy:**
1. Set up nightly evaluation pipeline
2. Store evaluation results in time-series database
3. Configure alerts for metric drops beyond threshold
4. Review evaluation trends weekly

**Detection Checklist:**
- [ ] Is evaluation automated and scheduled?
- [ ] Are metric trends tracked over time?
- [ ] Are alerts configured for metric degradation?

**Related Rules/Skills/Trees:**
- Rule: Automate Ongoing Evaluation (`04-standardized-knowledge.md:41-42`)
