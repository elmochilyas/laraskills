# Skills

## Skill 1: Build a development workflow with local models using fixture-based testing and regression tracking

### Purpose
Establish a development workflow using local LLMs for rapid iteration, fixture-based testing (recorded responses replayed in CI) to avoid LLM calls in automated tests, and regression tracking to monitor prompt quality changes over time.

### When To Use
- Use during AI feature development to iterate on prompts without provider API costs
- Use when you need deterministic test fixtures that don't require LLM calls in CI
- Use when tracking prompt quality regressions across code changes
- Use when local models approximate production model behavior for testing
- Use when setting up CI/CD for AI-powered features

### When NOT To Use
- Do NOT use when local models are too different from production models to be useful
- Do NOT use for testing features that require exact production model behavior
- Do NOT use when the development workflow adds more overhead than the alternative

### Prerequisites
- Local LLM (Ollama, LM Studio) configured for development
- Production LLM configured for staging/production
- Test infrastructure (PHPUnit/Pest with fixture support)
- Git-based version control for prompt tracking
- Understanding of model fidelity gap between local and production models

### Inputs
- Development prompts for iteration
- Production model responses (for comparison)
- Test case inputs and expected outputs
- Fixture recording from real LLM calls
- Prompt version history for regression tracking

### Workflow
1. Set up local LLM as the development provider (Ollama with a capable 7B+ model)
2. Create fixture recording infrastructure:
   - On first run, make real LLM call and record response to a fixture file
   - On subsequent runs, replay the fixture without making an LLM call
   - Invalidate fixtures when prompts change (hash-based invalidation)
3. Establish the development loop:
   - Iterate on prompts with local LLM (fast, free, offline)
   - Record fixtures from production model for CI testing
   - Run tests against fixtures in CI (no LLM calls, deterministic)
4. Implement regression tracking:
   - Log prompt version with each response
   - Compare new responses against historical baselines
   - Alert on quality degradation in prompt changes
5. Run periodic dual-model tests: local vs. production, compare output quality
6. Document the model fidelity gap: what differs between local and production models

### Validation Checklist
- [ ] Local LLM is the development provider (fast iteration)
- [ ] Fixture recording replays recorded responses without LLM calls
- [ ] Fixtures are invalidated when prompts change
- [ ] CI runs tests against fixtures (no LLM calls in automated tests)
- [ ] Periodic dual-model tests compare local vs. production quality
- [ ] Model fidelity gap is documented
- [ ] Regression tracking monitors prompt quality over time
- [ ] Prompt version is logged with every response
- [ ] Development loop is documented for the team

### Common Failures
- **Model fidelity gap too large**: Local model produces very different outputs — adjust prompt or accept gap
- **Stale fixtures**: Fixtures not regenerated when prompts change — tests pass with old responses
- **Flaky fixture tests**: Recorded responses include random elements — normalize before recording
- **Over-reliance on local model**: Local model works but production model fails — always dual-test
- **No regression baseline**: Can't tell if a new prompt is better or worse — track history

### Decision Points
- **Fixture storage**: Git-tracked files (simple) vs. database (queryable) — git is standard
- **Fixture invalidation**: Hash-based (prompt hash) vs. timestamp-based — hash is deterministic
- **Dual-test frequency**: Per CI run (thorough but slow) vs. nightly (balance)
- **Model fidelity acceptance threshold**: What % output difference is acceptable? Document threshold

### Performance Considerations
- Local model iteration: 5-30s per prompt (vs. 1-5s for cloud — acceptable for dev)
- Fixture replay: <1ms per test (vs. 1-5s for real LLM call)
- Fixture storage: ~1KB per response — negligible for hundreds of fixtures
- Dual-model testing doubles CI time — run in parallel
- Regression tracking adds negligible overhead (hash comparison only)

### Security Considerations
- Fixtures may contain sensitive data from recorded responses — scrub before committing
- Production model API keys should not be in development environment
- Local models process data on-device — privacy-safe development
- Fixtures should be reviewed before committing (may contain unexpected content)
- Dual-testing with production models incurs API costs — track spending

### Related Rules
- R1: Build a task-specific evaluation dataset before evaluating any model
- R2: Evaluate models on both quality AND latency/cost, using a weighted score

### Related Skills
- Implement dev-to-prod provider switching strategy
- Integrate Ollama for local LLM inference in Laravel
- Design few-shot examples and chain-of-thought prompts
- Implement prompt versioning with version-controlled prompt files

### Success Criteria
- Development iteration uses local LLM without API costs or rate limits
- CI tests run against fixtures without making real LLM calls
- Fixtures are automatically invalidated when prompts change
- Dual-model tests run periodically to detect model fidelity issues
- Prompt regression history tracks quality changes over time
- Development workflow is documented and reproducible by the team
