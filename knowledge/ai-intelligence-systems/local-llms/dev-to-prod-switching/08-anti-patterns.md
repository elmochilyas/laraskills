# Anti-Patterns: Dev-to-Prod Switching Strategy

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | KU-052 |
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Local LLM Development |
| **Type** | Implementation |
| **Version** | 1.0.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Assuming Local Model Behavior Matches Production](#1-assuming-local-model-behavior-matches-production)
2. [No Fallback for Production Provider Outage](#2-no-fallback-for-production-provider-outage)
3. [Testing Only with Local Models](#3-testing-only-with-local-models)
4. [Mixed Embedding Dimensions Across Environments](#4-mixed-embedding-dimensions-across-environments)
5. [Provider Override Conflict Surprises](#5-provider-override-conflict-surprises)

---

## 1. Assuming Local Model Behavior Matches Production

### Category
Quality Parity Failure

### Description
Developing and testing prompts exclusively with a local model (e.g., Llama 3.2) under the assumption that it will behave identically to the production cloud model (e.g., GPT-4o or Claude). Prompts that work perfectly on the local model produce different results, fail entirely, or trigger different formatting/capabilities when switched to the production model.

### Why It Happens
- Convenience: local model is faster and cheaper for iteration
- Lack of awareness about model-specific behavior differences
- No dual-prompt testing process in the development workflow
- Assumption that "prompt engineering is universal" across models
- No staging environment with a production-like model

### Warning Signs
- Prompts are developed and tested only with local models before production deploy
- No CI step validates prompts against the production model
- Production incidents where "prompts worked in dev but not in prod"
- Team has no documented model behavior differences between local and production
- No staging environment with a cheap production-like model (GPT-4o-mini)

### Why Harmful
- Production quality degrades when prompts are optimized for a different model
- Feature-breaking behavior differences discovered after deployment
- Increased latency from prompt patterns that work on local but are inefficient on cloud
- Output format differences cause parsing failures in production

### Real-World Consequences
- Prompt that works on Llama 3.2 but produces Markdown on GPT-4o when JSON was expected
- Tool calling that works locally but fails on production model due to schema format differences
- Production deploy reverted because prompts produce unusable output

### Preferred Alternative
Test every prompt against both the local development model and a production-representative model before deployment. Use a cheap production-like model (GPT-4o-mini, Claude Haiku) in a staging environment for final validation.

### Refactoring Strategy
1. Establish a staging environment that uses a cheap production-like model
2. Run prompt tests against the production model in CI (with limited quota)
3. Document known behavior differences between local and production models
4. Create a prompt compatibility matrix
5. Use prompt patterns that are robust across model families

### Detection Checklist
- [ ] Prompts are tested on both local and production-representative models
- [ ] Known behavior differences are documented
- [ ] CI includes production model validation for critical prompts
- [ ] Staging environment mirrors production provider

### Related Rules/Skills/Trees
- Skill: Implement Dev-to-Prod Switching
- Decision Tree: Implementation Approach

---

## 2. No Fallback for Production Provider Outage

### Category
Resilience Failure

### Description
Relying entirely on a single cloud provider for production AI features with no fallback mechanism when that provider is unavailable. If OpenAI or Anthropic experiences an outage, all AI features in the application become unavailable, even though a local model (or alternative provider) could serve as a degraded fallback.

### Why It Happens
- Simplicity: one provider is easier to configure and maintain
- Assumption that cloud providers have 100% uptime
- No observed provider outages during development
- Complexity aversion: fallback logic adds code and testing burden
- Quality concerns: local model quality is lower than cloud

### Warning Signs
- Only one AI provider is configured in production
- No `#[BackupProvider]` or fallback logic exists
- Provider outages cause complete loss of AI features
- No alerting when the primary provider is unavailable
- No degraded mode UX for when AI features are down
- Team discovers provider dependency during an actual outage

### Why Harmful
- Complete feature loss during provider outages
- User-facing errors instead of graceful degradation
- Missed opportunity to provide reduced-but-functional service
- Brand damage when core features are unavailable
- No ability to control cost during peak pricing

### Real-World Consequences
- 4-hour OpenAI outage takes down all AI features
- Saturday afternoon provider incident with no on-call engineer to switch providers
- Customer-facing SLA violation for AI-powered features
- Revenue loss from AI-powered features during outage

### Preferred Alternative
Implement a fallback chain: primary provider → secondary provider → local model (if available). Use graceful degradation: alert the user that AI features are degraded rather than failing entirely.

### Refactoring Strategy
1. Configure a secondary cloud provider as first fallback
2. Add a local model (Ollama) as a last-resort fallback for development environments
3. Implement the fallback chain in the provider factory
4. Add monitoring for provider fallback events
5. Design a degraded-mode UX that explains reduced capabilities

### Detection Checklist
- [ ] Fallback provider is configured
- [ ] Fallback logic is tested
- [ ] Provider fallback events are monitored and alerted
- [ ] Degraded mode UX exists

### Related Rules/Skills/Trees
- Skill: Implement Dev-to-Prod Switching
- Decision Tree: Reliability & Error Handling

---

## 3. Testing Only with Local Models

### Category
Test Coverage Gap

### Description
Running the entire test suite exclusively against local models, with no integration tests that validate behavior against the production cloud model. This means all tests pass in CI but critical behavior differences between local and production models go undetected until deployment.

### Why It Happens
- Cost avoidance: running tests against cloud models incurs API costs
- Speed: local model tests are fast (no network)
- CI environment may not have access to cloud APIs
- No API keys configured for testing environment
- "The tests pass locally, so they'll pass in production" assumption

### Warning Signs
- All LLM tests use mock providers or local models
- No integration tests call the actual production provider
- Production incidents with "tested locally but failed on production model"
- CI pipeline has no production model validation step
- No canary or staged rollout for provider changes

### Why Harmful
- Production model behavior that differs from local goes undetected
- Quality regressions from model updates aren't caught in tests
- False confidence from passing tests that don't validate production behavior
- Production model-specific features (tools, structured output) aren't tested

### Real-World Consequences
- Deploy passes tests but production generates unusable output
- Model update by provider breaks prompts that passed local tests
- Tool calling feature works locally but not on production model
- Structured output failures discovered by users, not tests

### Preferred Alternative
Use local/mock providers for unit tests (fast, deterministic) and a limited set of integration tests against the actual production provider for critical prompts. Run integration tests as a separate CI step with cost budget.

### Refactoring Strategy
1. Identify critical prompt paths that must be validated against production model
2. Create a focused integration test suite for production model validation
3. Schedule integration tests to run less frequently (daily, not per-commit)
4. Use canary deployments to validate production model behavior
5. Set up alerting for integration test failures

### Detection Checklist
- [ ] Integration tests validate against production provider
- [ ] Critical prompts have production model test coverage
- [ ] Integration tests have cost budget and run schedule
- [ ] CI pipeline includes production model validation (separate from unit tests)

### Related Rules/Skills/Trees
- Skill: Implement Dev-to-Prod Switching

---

## 4. Mixed Embedding Dimensions Across Environments

### Category
Data Integrity Failure

### Description
Using different embedding models across development and production environments, resulting in mismatched vector dimensions. Local development uses an embedding model with 384 or 768 dimensions, while production uses a cloud embedding model with 1536 or 3072 dimensions. This causes vector database queries to fail when switching environments because the index expects different vector dimensions.

### Why It Happens
- Local embedding model chosen for speed (smaller), production model chosen for quality (larger)
- No documented embedding dimension requirements
- Embedding provider is not included in the env-based switch
- One team chooses development tooling, another chooses production tooling
- Vector database schema isn't explicitly configured for specific dimensions

### Warning Signs
- Vector database errors about dimension mismatch between environments
- Different `AI_EMBEDDING_PROVIDER` values in dev vs. production without dimension awareness
- RAG search quality differs dramatically between environments
- Embedding dimension is not documented in the codebase
- Vector index rebuilds required when switching environments

### Why Harmful
- RAG system doesn't work when switching environments
- Vector database index must be rebuilt for each environment
- Cross-environment data migration impossible (vectors incompatible)
- Development RAG testing is meaningless if dimensions differ
- Cost of storing and querying mismatched vectors

### Real-World Consequences
- Vector DB throws dimension mismatch on first query after environment switch
- RAG search returns zero results (different dimension spaces are meaningless for similarity)
- Weeks of development testing wasted because local RAG used different embedding space
- Emergency database migration required before launch

### Preferred Alternative
Use the same embedding model family across all environments. If production uses `text-embedding-3-small` (1536 dimensions), use it in development too (with smaller batch sizes or a local alternative that produces the same dimension). Standardize on one embedding model for the application lifecycle.

### Refactoring Strategy
1. Document the required embedding dimension for the application
2. Choose one embedding model family to use across all environments
3. Configure embedding provider in the environment-based switch alongside the LLM provider
4. Add CI validation that embedding dimension matches expectations
5. Rebuild vector indexes with the standardized embedding model

### Detection Checklist
- [ ] Same embedding model used across all environments
- [ ] Embedding dimension is documented in the codebase
- [ ] CI validates embedding dimension
- [ ] Vector index schema specifies expected dimension

### Related Rules/Skills/Trees
- Skill: Implement Dev-to-Prod Switching

---

## 5. Provider Override Conflict Surprises

### Category
Configuration Mismanagement

### Description
Using `#[Provider]` attributes on specific agents to pin them to a particular provider, while also relying on the environment variable `AI_PROVIDER` for global switching. When the global switch changes, pinned agents don't switch, creating unexpected behavior where some agents use the new provider and others don't. Conversely, developers may forget about pinned agents and assume all traffic switched to the new provider.

### Why It Happens
- Attribute-based overrides are a powerful feature that's easy to overuse
- No documentation of which agents have provider overrides
- Provider overrides added for one-off reasons and never revisited
- Team members unaware of override conventions
- No visible indicator that an agent is using a non-default provider

### Warning Signs
- `#[Provider]` attributes exist on multiple agents without clear documentation
- After switching `AI_PROVIDER`, some agents still use the old provider
- No centralized list of provider-pinned agents
- Developers add provider overrides without code review
- Incidents where "we switched providers but some features didn't"

### Why Harmful
- Partial provider migration: some agents don't switch, causing inconsistency
- Debugging confusion: "I changed the env but nothing happened" for pinned agents
- Cost surprises: pinned agents may use expensive providers unexpectedly
- Feature incompatibility: pinned agents may miss new provider capabilities
- Hard to reason about which provider serves which feature

### Real-World Consequences
- After switching AI_PROVIDER from OpenAI to Anthropic, agents pinned to OpenAI still run
- Developer spends hours debugging why an agent won't switch providers
- Cost overrun because an expensive provider-pinned agent was forgotten
- Two providers billed simultaneously after "full migration"

### Preferred Alternative
Minimize the use of `#[Provider]` overrides. Use environment-based selection as the primary mechanism. Reserve provider overrides for truly provider-specific features (image generation, audio processing). Document all overrides centrally. Review overrides quarterly.

### Refactoring Strategy
1. Audit all `#[Provider]` attributes and document their purpose
2. Remove overrides that can be handled by environment-based selection
3. Create a central registry of provider-pinned agents
4. Add validation that warns when environment-based switch doesn't affect all agents
5. Review pinned agents quarterly for removal or replacement

### Detection Checklist
- [ ] Provider overrides are documented centrally
- [ ] Overrides exist only for truly provider-specific features
- [ ] No override surprises when switching AI_PROVIDER
- [ ] Overrides are reviewed regularly
