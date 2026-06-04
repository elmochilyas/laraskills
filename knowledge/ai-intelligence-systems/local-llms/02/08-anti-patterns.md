# Anti-Patterns: Development Workflow with Local Models

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | ku-02 |
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Local LLMs |
| **Type** | Implementation |
| **Version** | 1.0.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [No Fixture Strategy for Tests](#1-no-fixture-strategy-for-tests)
2. [Production-Local Divergence](#2-production-local-divergence)
3. [Manual Prompt Testing Without Automation](#3-manual-prompt-testing-without-automation)
4. [Local-Only Prompt Patterns](#4-local-only-prompt-patterns)
5. [Ignoring Token Costs in Development](#5-ignoring-token-costs-in-development)

---

## 1. No Fixture Strategy for Tests

### Category
Test Reliability Failure

### Description
Running tests that call real LLM models (local or cloud) on every execution instead of recording and replaying responses. This makes tests slow (seconds per test), flaky (network-dependent), expensive (API costs for cloud models), and non-deterministic (model updates change responses). Every CI run calls the real model, wasting time and money.

### Why It Happens
- Initial test written against real model "just to see it work"
- No awareness of VCR/fixture recording patterns
- Team doesn't see LLM call tests as different from other integration tests
- No fixture recording infrastructure set up
- "It's a local model, so it's free" — ignoring speed and determinism benefits

### Warning Signs
- Tests that call LLMs take >1 second per test
- Tests fail intermittently due to model latency or unavailability
- CI pipeline incurs API costs from cloud model test calls
- Test results change when models are updated
- No fixture files exist in the repository
- Developers run tests that wait for real model responses

### Why Harmful
- Slow tests discourage running the full suite
- Flaky tests reduce trust in the test suite
- CI costs scale linearly with test count and frequency
- Tests are non-deterministic: same code, different results
- Cannot reproduce issues because model responses change

### Real-World Consequences
- Test suite takes 45 minutes (30s per test × 90 tests calling real LLM)
- CI bill includes $500/month in LLM API costs for test runs
- Test fails on Monday but passes on Tuesday (model behavior changed)
- Debugging a test failure requires knowing which model version was running

### Preferred Alternative
Record LLM responses as test fixtures. Use a VCR-like pattern: first run records the real response, subsequent runs replay the recorded fixture. Separate unit tests (fast, deterministic fixtures) from integration tests (real model, limited scope).

### Refactoring Strategy
1. Implement a fixture recorder that captures LLM request/response pairs
2. Store fixtures as JSON files in the test repository
3. Create a mock provider that replays fixtures
4. Run unit tests with fixtures (fast, deterministic)
5. Run a limited set of real-model integration tests on a schedule

### Detection Checklist
- [ ] Tests use fixture replay (not real model calls by default)
- [ ] Fixture files are stored in version control
- [ ] Unit tests are fast (<100ms) and deterministic
- [ ] Real-model tests are separate and limited

### Related Rules/Skills/Trees
- Skill: Implement Development Workflow with Local Models

---

## 2. Production-Local Divergence

### Category
Configuration Drift

### Description
Allowing the development AI configuration to drift significantly from the production setup—different providers, different models, different prompt structures, different feature sets. Over time, the development environment becomes so different from production that issues are only discovered after deployment, creating a "works on my machine" problem for AI features.

### Why It Happens
- No standardized development environment setup
- Developers configure AI providers differently on their machines
- Production configuration is updated without updating development configs
- Feature flags enabled in production but not in development
- Teams don't consider AI config drift as a risk

### Warning Signs
- Different developers use different local models and providers
- Production uses Claude Sonnet, dev uses Llama 3.2 (not systematically tested)
- Production has features (tools, streaming, structured output) not tested in dev
- Environment-specific configuration files have drifted
- Code works in production but fails locally, or vice versa
- No CI validation that dev and prod configs produce compatible results

### Why Harmful
- Production-only issues require deploy-revert cycles to fix
- Developers cannot reproduce production bugs locally
- New features work in dev but fail in production
- Onboarding: new developers cannot set up an environment that matches production
- Deployments feel risky because dev/prod parity is poor

### Real-World Consequences
- Feature tested on Llama 3.2 fails on Claude Sonnet in production
- Tool calling feature works in dev (with mock) but fails in production (real model)
- Production incident requires revert; can't reproduce locally
- Developer spends days debugging environment differences

### Preferred Alternative
Maintain parity: the development and production environments should use the same provider abstraction layer and similar model capabilities. Document the differences explicitly. Use a staging environment with a production-like provider to catch divergence before production deploy.

### Refactoring Strategy
1. Standardize the development AI setup: same provider, similar model
2. Document differences between dev and production configurations
3. Add CI validation that catches dev/prod config drift
4. Use staging environment with production-like provider
5. Test critical features in both dev and production configurations

### Detection Checklist
- [ ] Dev and prod use same provider abstraction
- [ ] Dev model approximates production model capabilities
- [ ] Configuration differences are documented
- [ ] CI validates dev/prod parity for critical paths

### Related Rules/Skills/Trees
- Skill: Implement Development Workflow with Local Models

---

## 3. Manual Prompt Testing Without Automation

### Category
Quality Assurance Failure

### Description
Testing prompts only by manually typing them in a playground or running ad-hoc commands, without an automated regression test suite for prompt quality. Prompt changes are evaluated subjectively by the developer rather than against a defined set of test cases with expected outputs. Each prompt iteration requires manual verification, so fewer iterations happen and quality suffers.

### Why It Happens
- Prompt testing seems "too subjective" to automate
- No prompt evaluation framework exists
- "I can tell if it's good" overconfidence
- Automated evaluation is perceived as too complex
- No budget for building evaluation infrastructure
- Team hasn't experienced the pain of untracked prompt changes (yet)

### Warning Signs
- Prompts are changed without corresponding test updates
- No canonical test input set for prompt evaluation
- Prompt quality is evaluated by eyeballing a few examples
- Team cannot answer "does prompt X work better than prompt Y?" objectively
- Prompt changes are not reviewed in code review
- No regression when prompts are subtly changed

### Why Harmful
- Prompt changes introduce regressions that go undetected
- Prompt quality degrades over time as changes accumulate
- Cannot objectively compare prompt strategies (A/B requires automation)
- Knowledge loss: why a prompt is written a certain way is undocumented
- Developer replaces a working prompt with a broken one, ships to production

### Real-World Consequences
- Prompt change that broke output format goes undetected for a week
- Regression introduced by prompt optimization that "felt better" to the developer
- Cannot determine which prompt version caused a production issue
- New hire breaks prompts without realizing it

### Preferred Alternative
Create a prompt evaluation suite: a set of canonical test inputs with expected output characteristics. Automate evaluation so every prompt change runs against the suite. Use objective metrics: format compliance, keyword presence, response length, classification accuracy.

### Refactoring Strategy
1. Define canonical test inputs for each prompt
2. Define expected output characteristics: format, content constraints, length
3. Implement automated prompt evaluation tests
4. Run prompt tests in CI on every prompt change
5. Version prompt templates alongside their tests

### Detection Checklist
- [ ] Prompt evaluation test suite exists
- [ ] Prompt changes run against the evaluation suite in CI
- [ ] Expected output characteristics are defined
- [ ] Prompt templates are version-controlled with tests

### Related Rules/Skills/Trees
- Skill: Implement Development Workflow with Local Models

---

## 4. Local-Only Prompt Patterns

### Category
Model-Specific Coupling

### Description
Writing prompts that rely on specific quirks or capabilities of the local development model—format preferences, tokenization patterns, or behavior characteristics—that don't transfer to the production model. When the provider switches to production, prompts that worked beautifully in development produce nonsensical or incorrectly formatted output.

### Why It Happens
- Intimate familiarity with the local model's behavior
- No testing against the production model during prompt development
- Prompt patterns that happen to work well with the local model
- Local model's quirks become implicit prompt requirements
- Different prompt structures for different models not anticipated

### Warning Signs
- Prompts use format instructions that match the local model's output style
- Prompt contains model-specific references or formatting
- No dual-provider prompt validation in the development workflow
- Team says "our prompts work on Llama" without mentioning production model
- Production model integration tests are absent

### Why Harmful
- Prompts must be re-engineered when switching providers
- Production deployment blocked by prompt compatibility issues
- Multiple prompt versions to maintain (one per model)
- Local model prompt optimization is wasted effort
- Inconsistent user experience between dev and prod

### Real-World Consequences
- Prompt that includes "Respond in JSON format" works on Llama 3.2 but GPT-4o adds markdown formatting
- Local model accepts lowercase instructions; production model requires explicit case
- Structured output request works on local but parsed differently on cloud model

### Preferred Alternative
Write prompts in a model-agnostic way. Use standard formatting that works across model families. Test each prompt against both the development model and a production-representative model. Document model-specific adjustments separately.

### Refactoring Strategy
1. Audit prompts for model-specific patterns
2. Refactor to use standard, model-agnostic prompt structures
3. Test prompts against both local and production models
4. Document any required model-specific adjustments
5. Maintain a prompt compatibility matrix

### Detection Checklist
- [ ] Prompts are tested against both local and production models
- [ ] No model-specific formatting in prompts
- [ ] Prompt compatibility matrix exists
- [ ] Production model integration tests pass

### Related Rules/Skills/Trees
- Skill: Implement Development Workflow with Local Models

---

## 5. Ignoring Token Costs in Development

### Category
Cost Management Blind Spot

### Description
Not tracking token usage during development and testing, even though prompt optimization in development directly drives production costs. Developers iterate on prompts without knowing their token consumption, leading to unnecessarily verbose prompts that cost more in production than optimized alternatives.

### Why It Happens
- Local models are free, so token cost awareness doesn't develop
- No token counting integrated into the development workflow
- Cost optimization is seen as a "production concern," not a development one
- Team has never calculated the cost impact of their prompt decisions
- No feedback loop showing token counts per prompt

### Warning Signs
- Developers can't tell you how many tokens their prompts consume
- No token counting in the development environment
- Prompt structure is verbose with no cost consideration
- Team optimizes for quality only, ignoring token efficiency
- Production cost surprises from "optimized" prompts

### Why Harmful
- Production costs are higher than necessary due to verbose prompts
- Unnecessary context and instructions burn tokens on every request
- Token optimization becomes a separate project instead of being built in
- Developers don't develop cost-aware prompt engineering habits
- Production cost per request could be 2-5x lower with development optimization

### Real-World Consequences
- Developer's "comprehensive" system prompt costs $0.05 per call instead of $0.01
- 50K daily users × $0.04 extra = $2,000/day wasted
- Prompt optimization project launched after production costs exceed estimates
- No one notices until the monthly bill arrives

### Preferred Alternative
Integrate token counting into the development workflow. Show token counts for prompts during development. Set token budgets per feature. Make token efficiency a development metric, not just a production concern.

### Refactoring Strategy
1. Add token counting to the development provider wrapper
2. Display token counts in development logs or IDE
3. Set per-feature token budget guidelines
4. Include token efficiency in code review for prompt changes
5. Calculate cost-per-request during development, not after production

### Detection Checklist
- [ ] Token counting is integrated into development workflow
- [ ] Developers see token counts during prompt development
- [ ] Per-feature token budgets exist
- [ ] Token efficiency is reviewed alongside prompt quality
