---
id: ku-02
title: "Model Selection & Benchmarking - Rules"
subdomain: "local-llms"
ku-type: "strategic"
date-created: "2026-06-02"
---

## Rules for Model Selection & Benchmarking

### R1: Build a task-specific evaluation dataset before evaluating any model
- **Category:** Strategy
- **Rule:** Create a labeled evaluation dataset of 50-200 examples representing the actual production use case (inputs + expected outputs); score all candidate models against this dataset before selection; never select a model without task-specific evaluation.
- **Reason:** Model performance on general benchmarks does not predict task-specific performance. A model that scores 90% on MMLU may score 50% on your specific JSON entity extraction task.
- **Bad Example:** Choosing Mistral over Llama based on MMLU scores — Llama actually performs 20% better on the application's specific customer support routing task.
- **Good Example:** A dataset of 100 support queries with expected routing category labels; each model scored on routing accuracy; the best model scores 94%, the worst 68%.
- **Exceptions:** When only one model is available for the hardware configuration.
- **Consequences of Violation:** Incorrect model selection reduces application quality; poor model choice not discovered until production complaints emerge.

### R2: Evaluate models on both quality AND latency/cost, using a weighted score
- **Category:** Strategy
- **Rule:** For each candidate model, compute a weighted score = quality_metric × w1 + (1 - normalized_latency) × w2 + (1 - normalized_cost) × w3; never choose a model on quality alone.
- **Reason:** The best quality model may be 10x slower — making it unacceptable for real-time applications. The weight schedule reflects production requirements: real-time chat weights latency highly; batch processing weights quality highly.
- **Bad Example:** Choosing Llama 3.1 70B because it scores highest on quality — at 3 tokens/second on available hardware, it's unusable for a chatbot requiring <3s response time.
- **Good Example:** Evaluation results: Model A (quality: 0.95, latency: 200ms, cost: $0) → weighted score: 0.95×0.4 + 0.9×0.4 + 1.0×0.2 = 0.84. Model B (quality: 0.98, latency: 5000ms, cost: $0) → weighted score: 0.392 + 0 + 0.2 = 0.59.
- **Exceptions:** Applications where only one dimension matters (e.g., quality-only for offline analysis).
- **Consequences of Violation:** A model selected for quality produces unacceptable user experience due to latency, or a cost-effective model is rejected because its quality score (without latency/cost context) is slightly lower.

### R3: Re-benchmark models quarterly — the local LLM landscape changes rapidly
- **Category:** Strategy
- **Rule:** Schedule quarterly re-evaluations of available local models against the task-specific dataset; upgrade the production model if a newer release scores >10% better on the weighted score.
- **Reason:** The open-source LLM ecosystem releases significantly better models every 2-4 months (Llama 3 → 3.1 → 3.2 → 4, Mistral 0.1 → 0.2 → 0.3). Sticking with a 6-month-old model means leaving substantial quality/latency improvements unused.
- **Bad Example:** A team using Llama 2 (released July 2023) in March 2025 — they're using a model 3 generations behind, with markedly worse quality and speed.
- **Good Example:** A quarterly "model bakeoff" GitHub issue that runs the eval suite against 5 new models and recommends upgrades.
- **Exceptions:** Highly regulated environments where model change requires lengthy approval.
- **Consequences of Violation:** Application uses a model with significantly worse quality/latency than available alternatives; competitors leveraging newer models deliver better user experiences.
