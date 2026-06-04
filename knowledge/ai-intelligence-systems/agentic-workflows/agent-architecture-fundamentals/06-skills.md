# Skill: Create a Single-Responsibility Agent Class
## Purpose
Build a focused, testable agent class implementing the `Agent` contract with single-responsibility instructions, relevant tools, and appropriate output schema.
## When To Use
- Implementing any AI feature within Laravel using the laravel/ai SDK
- Decomposing complex AI tasks into focused agent classes
- Replacing ad-hoc LLM calls with structured agent patterns
## When NOT To Use
- Simple stateless LLM calls that don't need instructions, tools, or memory
- Prototypes where direct provider calls suffice
## Prerequisites
- Laravel AI SDK installed and configured
- Understanding of Agent, Promptable, HasTools, HasStructuredOutput contracts
- Provider and model configured for the application
## Inputs
- Agent purpose/domain description
- Provider/model configuration (via attributes)
- Tool definitions (if agent needs them)
- Output schema (if agent needs structured output)
- Instructions/system prompt template
## Workflow (numbered)
1. Create a single agent class per distinct capability (e.g., `SupportAgent`, `SearchAgent`, `WriterAgent`)
2. Add `#[Provider]` and `#[Model]` attributes for static configuration
3. Add `#[Temperature]`, `#[MaxTokens]`, `#[MaxSteps]` attributes as needed
4. Use `Promptable` trait to enable `prompt()`, `stream()`, `queue()` execution methods
5. Implement `instructions(): string|Stringable` returning focused system prompt
6. Optionally implement `HasTools` with `tools(): array` for tool-calling agents
7. Optionally implement `HasStructuredOutput` with `schema(): JsonSchema` for typed output
8. Accept dynamic context (userId, tenantId) via constructor injection
9. Register stateless agents as singletons in the service container
10. Test with `Ai::fake()` using `preventStrayPrompts()`
## Validation Checklist
- [ ] Agent follows single-responsibility (one domain, one purpose)
- [ ] `Promptable` trait is applied
- [ ] Static configuration uses attributes, not properties
- [ ] Dynamic configuration uses methods (instructions, tools, schema)
- [ ] Agent tested with `Ai::fake()` — no real API calls in unit tests
- [ ] Stateless agents registered as singletons
- [ ] Stateful agents use constructor injection for context
## Common Failures
- Creating monolithic agents handling multiple domains — degrades output quality
- Not using `MaxSteps` — agent loops indefinitely on complex tool chains
- Passing mutable state via constructor — agent lifetime may be longer than expected
- Forgetting `Promptable` trait — execution methods unavailable
- Testing without fakes — real API calls in CI, accruing costs
## Decision Points
- **Class-per-agent vs configuration-driven**: Dedicated PHP class for DI support, testability, single responsibility
- **Attributes vs methods**: Attributes for static config (provider, model), methods for dynamic config (instructions, tools)
- **Singleton vs factory**: Register as singleton if stateless; use factory if stateful
## Performance Considerations
- Agent class resolution via container — cached in production
- Conversation history loading — consider summarization or sliding window for long histories
- Tool execution — synchronous tools block agent loop; queue long-running tools
- `MaxSteps` attribute limits iterations — prevents runaway token consumption
## Security Considerations
- Register agents as singletons if stateless (no constructor parameters)
- Test with `Ai::fake()` and `preventStrayPrompts()` — catch unintended API calls in test suite
- Configure `AI_PROVIDER` per environment — Ollama in dev, production provider in production
- Monitor conversation table size — implement pruning jobs
## Related Rules (from 05-rules.md)
- One Agent, One Responsibility
- Use Attributes for Configuration, Methods for Behavior
- Register Agents as Singletons When Stateless
- Include Promptable Trait
- Test Agents Using Ai::fake()
## Related Skills
- Implement Multi-Agent Patterns
- Implement Queued Agent Execution
- Test AI Features with Fakes
## Success Criteria
- Agent produces focused, high-quality output for its domain
- Tests pass deterministically without real API calls
- Agent can be used via `prompt()`, `stream()`, or `queue()` interchangeably
- Adding a new capability requires creating a new agent class, not modifying existing ones

---

# Skill: Test AI Features with Fakes
## Purpose
Write deterministic, fast, cost-free tests for AI-powered features using `Ai::fake()`, `preventStrayPrompts()`, and response fixtures.
## When To Use
- Unit and feature tests for any agent or AI-powered feature
- CI pipelines where real API calls are unacceptable (cost, flakiness, network dependency)
- TDD workflow for AI features — define expected responses before implementing agents
## When NOT To Use
- Dedicated integration tests requiring end-to-end provider validation (annotated with `@group integration`)
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
- Avoid committing API keys to CI — fakes eliminate the need for provider credentials in CI
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
- Error handling paths are tested with appropriate error fixtures
- CI pipeline runs without API keys
