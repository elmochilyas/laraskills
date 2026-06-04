# Anti-Patterns: Model Selection & Quantization

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | ku-03 |
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Local LLMs |
| **Type** | Implementation |
| **Version** | 1.0.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Bigger-is-Better Model Selection](#1-bigger-is-better-model-selection)
2. [Quantization Obsession](#2-quantization-obsession)
3. [No Benchmark Baseline for Model Changes](#3-no-benchmark-baseline-for-model-changes)
4. [Vendor Lock-In to One Model Family](#4-vendor-lock-in-to-one-model-family)
5. [Stale Model Selection](#5-stale-model-selection)

---

## 1. Bigger-is-Better Model Selection

### Category
Selection Bias

### Description
Always choosing the largest model that can barely fit into available memory, regardless of whether the additional parameters improve quality for the specific task. A 70B model at 2-bit quantization that barely runs may produce worse results than a 7B model at 8-bit that runs efficiently. The "bigger is better" heuristic ignores diminishing returns, quantization quality loss, and latency impact.

### Why It Happens
- Parameter count fetishism: "70B" sounds better than "7B"
- General benchmarks favor larger models, masking task-specific diminishing returns
- No application-specific quality evaluation
- "Future-proofing" by getting the most capable model
- Pride in running "the big model"

### Warning Signs
- Model selection criteria is "largest that fits in RAM"
- No quality comparison between different model sizes on the specific task
- Latency is unacceptably high but "the model is bigger"
- Frequent OOM crashes because model barely fits
- Quantization below 4-bit to fit the model
- Users complain about quality despite "70B" label

### Why Harmful
- Higher latency and infrastructure cost than a smaller, faster model
- Output quality may be worse than a properly-precisioned smaller model
- Frequent crashes from memory pressure
- Poorer user experience due to latency
- Higher operational complexity (GPU requirements, monitoring)

### Real-World Consequences
- 70B at 2-bit produces garbled output; 7B at 8-bit would have been fine
- Model crashes every hour due to memory pressure
- Response latency makes features unusable
- Team buys expensive GPU that 7B model doesn't need

### Preferred Alternative
Choose the smallest model that meets quality requirements. Benchmark multiple model sizes on the application task. Consider total cost of ownership: model size × hardware cost × latency impact.

### Refactoring Strategy
1. Benchmark the current model on the application task
2. Compare with a 2-3x smaller model at higher precision
3. Evaluate quality, latency, memory, and cost tradeoffs
4. Select the smallest model that meets quality requirements
5. Document the decision process and revisit quarterly

### Detection Checklist
- [ ] Model selection is based on task-specific benchmarks, not parameter count
- [ ] Smaller models at higher precision have been evaluated
- [ ] Latency and memory requirements are documented
- [ ] Model size is justified by quality requirements

### Related Rules/Skills/Trees
- Skill: Implement Model Selection
- KU-01: Local LLM Setup

---

## 2. Quantization Obsession

### Category
Optimization Misallocation

### Description
Spending excessive time and effort optimizing quantization levels for marginal quality improvements (1-2% perplexity difference) that users will never notice, while ignoring higher-impact optimizations like prompt efficiency, model architecture selection, or hardware upgrades. The team obsesses over Q4_K_M vs. Q5_K_M vs. Q6_K when the model choice itself matters far more.

### Why It Happens
- Quantization is a technical optimization that engineers enjoy tuning
- Perplexity metrics provide a false sense of precision
- Diminishing returns aren't obvious from benchmark numbers
- No user-facing quality metrics to ground optimization decisions
- "Every percentage point matters" mindset without cost-benefit analysis

### Warning Signs
- Multiple days spent comparing quantization levels
- Discussion focuses on perplexity differences <1%
- No user-facing quality improvement from quantization changes
- Quantization benchmarking is prioritized over prompt optimization
- Team debates Q4 vs. Q5 while using the wrong model family
- No quality metrics from actual user interactions

### Why Harmful
- Engineering time wasted on marginal improvements
- Higher-impact optimizations (prompt design, model selection) are delayed
- Perplexity is not correlated with user-perceived quality
- Quantization complexity adds maintenance burden
- False optimization: "we improved quant" but users don't notice

### Real-World Consequences
- Week spent comparing Q4_K_M vs. Q5_K_M vs. Q6_K; no user-perceptible difference
- Prompt optimization (which could improve quality 30%) not started
- New model release made quantization work obsolete
- Users still complain about quality despite "optimized" quantization

### Preferred Alternative
Pick a standard quantization level (Q4_K_M for consumer GPUs, Q8_0 for datacenter) and move on. Invest optimization effort where it has higher impact: prompt engineering, model selection, caching, or latency optimization.

### Refactoring Strategy
1. Standardize on a quantization level for all models
2. Document the quantization decision with one benchmark comparison
3. Redirect optimization effort to higher-impact areas
4. Set a policy: quantization changes only when there's a clear user-perceptible benefit
5. Stop measuring perplexity; measure user-facing quality instead

### Detection Checklist
- [ ] Standard quantization level is defined and used
- [ ] Quantization optimization effort is proportional to impact
- [ ] Higher-impact optimizations are prioritized
- [ ] User-facing quality metrics justify quantization changes

### Related Rules/Skills/Trees
- Skill: Implement Model Selection

---

## 3. No Benchmark Baseline for Model Changes

### Category
Improvement Measurement Failure

### Description
Making model changes (new model versions, different architectures, quantization adjustments) without having a quality baseline to compare against. Without before/after measurements on the application-specific task, it's impossible to know whether a model change improved, degraded, or maintained quality.

### Why It Happens
- No application-specific evaluation dataset exists
- "New model must be better" (it's newer, so it's better)
- General benchmarks (MMLU) used as substitute for task-specific evaluation
- No automated evaluation pipeline
- Team trusts model release notes over their own testing

### Warning Signs
- Model version changes without documented impact analysis
- No canonical test inputs for evaluating model quality
- Team cannot answer "did the model update improve or degrade our feature?"
- Model update post-mortem: "quality changed but we can't say how"
- No before/after comparison when changing models

### Why Harmful
- Quality regressions from model updates go undetected
- Team doesn't learn which models work best for their use case
- Investment in model changes may not deliver value
- Users experience quality changes without warning
- Cannot make data-driven model selection decisions

### Real-World Consequences
- Model update silently reduced output quality for two weeks
- Team upgraded to "better" model that produced worse results for their specific task
- Cannot prove to stakeholders that a model change improved quality
- Third-party model removed from registry, team doesn't know the impact

### Preferred Alternative
Create an application-specific evaluation dataset before any model change. Establish a quality baseline with the current model. Compare new models against the baseline using the same dataset. Document every model change with its impact on the evaluation metrics.

### Refactoring Strategy
1. Create a task-specific evaluation dataset (50-100 representative inputs)
2. Define quality metrics: accuracy, format compliance, response length, etc.
3. Evaluate the current model to establish a baseline
4. Require baseline comparison for all model changes
5. Automate evaluation so it's easy to run on any model

### Detection Checklist
- [ ] Application-specific evaluation dataset exists
- [ ] Quality baseline is established for the current model
- [ ] Model changes require baseline comparison
- [ ] Evaluation is automated and repeatable

### Related Rules/Skills/Trees
- Skill: Implement Model Selection

---

## 4. Vendor Lock-In to One Model Family

### Category
Architectural Risk

### Description
Only considering and testing models from one family (e.g., only LLaMA models) when multiple model families (Mistral, Phi, Qwen, DeepSeek) might offer better quality, performance, or efficiency for the specific task. The team becomes dependent on a single ecosystem's quirks and roadmap.

### Why It Happens
- Familiarity: team knows LLaMA models and doesn't want to learn others
- Initial success with one model family leads to inertia
- No systematic evaluation of alternative model families
- "We're a LLaMA shop" identity
- Migration cost seems high (different tokenizers, architectures, prompt formats)

### Warning Signs
- Only models from one family (LLaMA) are ever considered
- No evaluation of Mistral, Phi, Qwen, or DeepSeek exists
- Inability to answer "would model X be better for our use case?"
- Prompt format is specific to one model family
- Tokenizer is optimized for one family's vocabulary
- Team dismisses other model families without evaluation

### Why Harmful
- May miss significantly better model for the specific task
- Vulnerable to roadmap changes or licensing shifts in one family
- No price competition between model families
- Cannot easily switch if the chosen family falls behind
- Community innovation in other families is ignored

### Real-World Consequences
- Mistral model 2x faster with same quality for 6 months, never evaluated
- LLaMA license change forces emergency migration
- Qwen model handles tool calling better; feature implemented with worse experience
- DeepSeek model released with 3x longer context; feature not upgraded

### Preferred Alternative
Regularly evaluate models from multiple families on the application's specific task. Maintain a model benchmark matrix showing quality/speed/memory/cost across families. Don't commit to one family until you've ruled out alternatives.

### Refactoring Strategy
1. Identify 3-4 model families to evaluate (LLaMA, Mistral, Qwen, Phi)
2. Run the application's evaluation dataset against each
3. Document quality, latency, memory, and cost for each
4. Choose the best model for each dimension (quality, speed, efficiency)
5. Schedule quarterly re-evaluation of all model families

### Detection Checklist
- [ ] Multiple model families have been evaluated
- [ ] Model benchmark matrix exists and is current
- [ ] No single-family dependency in prompt format
- [ ] Switching models requires minimal code changes

### Related Rules/Skills/Trees
- Skill: Implement Model Selection

---

## 5. Stale Model Selection

### Category
Technical Debt

### Description
Choosing a model once at project inception and never revisiting the decision. The open-source model landscape evolves rapidly—every few months, new models outperform previous ones in quality, speed, context length, or efficiency. A model that was the best choice six months ago may now be significantly outperformed by newer options.

### Why It Happens
- "If it works, don't touch it" mentality
- No budget for model evaluation work
- Team doesn't track the open-source model release landscape
- Migration effort seems high for uncertain benefit
- No one is responsible for model evaluation

### Warning Signs
- Model hasn't been changed in 6+ months
- No one on the team follows new model releases
- Team cannot name any models released in the last 3 months
- No model evaluation process or schedule exists
- Competitors have better quality (users notice)
- Feature requests blocked by model limitations that newer models solve

### Why Harmful
- Application quality falls behind as better models become available
- Miss out on efficiency improvements (newer models often faster/smaller)
- Competitors with newer models deliver better user experience
- Model family may become deprecated or unsupported
- Context window, tool calling, or other capabilities stagnate

### Real-World Consequences
- Competitor launched with Qwen model offering 128K context while app stuck with 8K
- New Mistral model is 3x faster but app still on old LLaMA version
- Model family discontinued, emergency migration required
- Users complain about quality that newer models would improve

### Preferred Alternative
Establish a quarterly model review cadence. Track the open-source model release landscape. Evaluate new models against the application-specific benchmark dataset. Schedule model upgrades as part of regular maintenance.

### Refactoring Strategy
1. Assign model evaluation responsibility to a team member
2. Set up quarterly model review on the team calendar
3. Create a lightweight evaluation process (run benchmark dataset)
4. Track new model releases in a shared document or feed
5. Schedule model upgrades as standard technical debt items

### Detection Checklist
- [ ] Model review cadence exists (quarterly)
- [ ] New model releases are tracked and evaluated
- [ ] Evaluation dataset is updated as new use cases emerge
- [ ] Model upgrades are planned, not reactive
