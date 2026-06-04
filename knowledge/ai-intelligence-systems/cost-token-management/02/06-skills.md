# Skills

## Skill 1: Optimize AI costs using model routing and task-based model selection

### Purpose
Reduce LLM API spending by routing each request to the cheapest model that meets the task's quality requirements, using a model router service and cost data analysis to prioritize high-ROI optimizations.

### When To Use
- Use when AI costs are a significant line item in your budget
- Use when you have multiple AI features with different quality requirements
- Use after collecting 30+ days of cost tracking data
- Use when preparing to scale AI usage across many users or features

### When NOT To Do
- Do NOT use before collecting cost data — optimize the right bottlenecks first
- Do NOT use for one-feature applications where a single model suffices
- Do NOT use when latency is the only concern and cost is not a factor

### Prerequisites
- 30+ days of cost tracking data (from ku-01 cost tracking setup)
- Identified cost drivers: top models, features, users by spend
- At least two model options per task type (cheap + expensive)
- A way to measure output quality for each task (automated evaluation)
- Model fallback configuration for quality-critical paths

### Inputs
- Cost tracking data (cost per feature, model, user)
- Task-to-model routing configuration
- Quality evaluation scores per model per task
- Provider pricing tables

### Workflow
1. Collect and analyze 30+ days of cost tracking data to identify the largest cost drivers
2. Create a `ModelRouter` service that maps task types to model configurations:
   - `simple_chat` → gpt-4o-mini
   - `analysis` → gpt-4o with claude-sonnet fallback
   - `embedding` → text-embedding-3-small
3. Implement prompt compression to reduce token counts:
   - Summarize retrieved documents before including in context
   - Truncate conversation history to last N turns
   - Extract only relevant sections from large documents
4. Implement semantic caching for repetitive queries (20-50% cache hit rate expected)
5. Configure fallback chains: try cheap model first, fall back to expensive on quality failure
6. Set up continuous monitoring to detect cost regressions after optimizations
7. Periodically re-evaluate model routing as new models become available

### Validation Checklist
- [ ] Cost optimization targets confirmed by data, not assumptions
- [ ] Model router covers all AI features and task types
- [ ] Cheap model quality is validated per task (automated evaluation)
- [ ] Semantic caching is working with measurable cache hit rate
- [ ] Prompt compression reduces token count without information loss
- [ ] Fallback chains work correctly in production
- [ ] Cost per request has measurable reduction (target: 40-80%)
- [ ] No quality regression from model changes

### Common Failures
- **Wrong optimization target**: Optimizing prompt tokens when model selection is the real cost driver
- **Quality regression**: Cheap model fails on complex tasks — always validate with automated evaluation
- **Cache pollution**: Semantic cache returns stale responses — implement data version-aware invalidation
- **Fallback not triggered**: Quality check doesn't detect when cheap model output is poor
- **Brittle routing**: Hardcoded model names break when models are deprecated or pricing changes

### Decision Points
- **Cost vs. quality threshold**: What quality score is acceptable for each task type?
- **Cache TTL**: How long to cache responses based on data volatility?
- **Compression aggressiveness**: How much prompt compression before information loss is unacceptable?

### Performance Considerations
- Semantic cache hit reduces latency (cached response < 100ms vs. LLM call 1-5s)
- Model routing adds <1ms overhead per request
- Prompt compression adds latency proportional to document size — use streaming or async
- Batching multiple requests to the same model is not supported by all providers

### Security Considerations
- Cached responses may contain sensitive information — encrypt cache entries
- Model routing should not reveal internal infrastructure details to users
- Fallback to different providers must maintain the same data privacy guarantees

### Related Rules
- R1: Measure cost data for at least 30 days before implementing any cost optimization
- R2: Always implement a model router that selects the cheapest adequate model per task type

### Related Skills
- Implement server-side cost tracking with attribution
- Implement budget enforcement and cost limits
- Implement semantic caching for LLM responses
- Set up usage metering and billing integration

### Success Criteria
- AI spend reduced by 40-80% through model selection optimization
- Semantic cache achieves 20-50% hit rate within 2 weeks of deployment
- No measurable quality regression on any AI feature
- Cost per request metrics show sustained improvement
- Optimization decisions are data-driven, not based on assumptions
