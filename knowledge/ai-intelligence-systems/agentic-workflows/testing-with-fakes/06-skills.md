# Skill: Test AI Features with Fakes
## Purpose
Write deterministic, fast, cost-free tests for AI-powered features using `Ai::fake()`, `preventStrayPrompts()`, and response fixtures.
## When To Use
- Unit and feature tests for any agent or AI-powered feature
- CI pipelines where real API calls are unacceptable (cost, flakiness, network dependency)
- TDD workflow for AI features — define expected responses before implementing agents
## When NOT To Use
- Dedicated integration tests requiring end-to-end provider validation (annotated `@group integration`)
- Provider adapter response parsing tests (use fixture-based tests instead)
## Prerequisites
- Laravel AI SDK installed
- Agent class or AI feature to test
- Understanding of `Ai::fake()`, `AiResponse`, `Ai::assertPromptSent()`
## Inputs
- Agent or AI feature under test
- Array of `AiResponse` fixture objects for expected AI calls
- Test input data for the agent
## Workflow (numbered)
1. Call `Ai::fake([$response1, $response2, ...])` at the start of each test method
2. Call `Ai::preventStrayPrompts()` to catch any unexpected AI calls
3. Register one fixture per expected AI call (count carefully for multi-turn agents)
4. Call the agent/AI feature under test
5. Assert on the response text or structured output
6. Optionally assert on the prompt sent: `Ai::assertPromptSent(fn($p) => str_contains($p, 'expected text'))`
7. Test error scenarios with fixtures simulating timeouts, errors, or malformed responses
8. Add `preventStrayPrompts()` to base `TestCase::setUp()` globally
## Validation Checklist
- [ ] `Ai::fake()` called in every test that invokes AI
- [ ] `preventStrayPrompts()` active (ideally in base TestCase)
- [ ] Fixture count matches expected AI call count
- [ ] Error scenarios tested with error fixtures
- [ ] Prompt assertions verify correct instruction construction
- [ ] No real API calls made during test execution
- [ ] Test suite runs in CI without API keys configured
## Common Failures
- Forgetting to call `Ai::fake()` — test makes real API calls, accruing costs
- Insufficient fixtures for multi-turn agents — fixture exhaustion causes test failure
- Asserting prompt content too strictly — minor instruction changes break tests
- Not testing error scenarios — only happy path tested
- Order sensitivity — refactoring call order breaks fixture sequence
## Decision Points
- **Sequential fixtures vs prompt-matching**: Sequential (FIFO) for deterministic call order; prompt-matching for non-deterministic call counts
- **Response format granularity**: Full `AiResponse` objects vs simple text strings
- **Base TestCase setup**: Global `Ai::fake()` vs per-test method setup
## Performance Considerations
- Fake responses are instant — no network latency
- Test suite with AI fakes is as fast as any regular PHPUnit test
- No rate limits, no cost, no flakiness from network failures
## Security Considerations
- Always call `Ai::fake()` or `preventStrayPrompts()` to prevent accidental real API calls
- Avoid committing API keys to CI — fakes eliminate need for provider credentials in CI
- Test error handling by providing fixture responses that throw exceptions
## Related Rules (from 05-rules.md)
- Always Call `Ai::fake()` Before Agent Tests
- Provide Sufficient Fixtures for Multi-Turn Agents
- Test Error Scenarios with Fixtures
- Verify Prompts with Assertions
## Related Skills
- Create a Single-Responsibility Agent Class
- Implement Multi-Agent Patterns
- Test Adapter Response Parsing with Fixtures
## Success Criteria
- All AI feature tests run deterministically without network calls
- No accidental real API calls in test suite (preventStrayPrompts enforces this)
- Error handling paths tested with appropriate error fixtures
- CI pipeline runs without API keys
