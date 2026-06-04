# Knowledge Unit: Testing with Fakes

## Metadata

- **ID:** KU-016
- **Subdomain:** Agent Architecture & Orchestration
- **Slug:** testing-with-fakes
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

The Laravel AI SDK provides a comprehensive testing layer via `FakeAi` and `AgentFake` classes. `Ai::fake()` intercepts all AI calls and returns pre-defined responses, while `preventStrayPrompts()` asserts that no real API calls leak during tests. This enables deterministic, fast, cost-free testing of AI-powered features without mocking HTTP clients or using real provider credentials.

## Core Concepts

- `Ai::fake()`: Replaces the real AI driver with a fake — all `Ai::call()` and agent prompts return fixture responses
- `Ai::fake([$responses])`: Pre-register sequential responses for specific prompts or patterns
- `AgentFake`: Fake implementation of Agent contracts — returns configured responses
- `preventStrayPrompts()`: Asserts that the test doesn't invoke any unexpected AI calls
- `Ai::assertPromptSent()`: Assert that a specific prompt was sent during test
- `Ai::assertNothingPrompted()`: Assert no AI calls were made
- Response fixture: Array of `AiResponse` objects that the fake returns sequentially

## Mental Models

- **Http::fake() for AI**: Same pattern as `Http::fake()` — intercept outgoing calls, return fixtures. Assert what was sent.
- **Database factory for AI**: Predefined response factories — know exactly what the AI will "say" in tests.
- **Mocking by contract**: Just as you mock Eloquent models with factories, you fake AI responses with fixtures.

## Internal Mechanics

When `Ai::fake()` is called:
1. The facade's underlying `AiManager` instance is swapped with `FakeAi`
2. `FakeAi` maintains a queue of pre-registered response fixtures
3. During test, each `Ai::call()` or agent `->prompt()` call dequeues the next fixture
4. If `preventStrayPrompts()` is active and the queue is empty, test fails
5. Assertions (`assertPromptSent`, `assertNothingPrompted`) inspect the fake's internal log of all prompts received

`AgentFake` works similarly but at the agent level — test a specific agent's behavior without initializing its full provider/tool chain.

## Patterns

- **Fixture-based testing**: Predefine expected responses for each test scenario
- **Sequential responses**: Use ordered fixture arrays for multi-turn conversations
- **Error scenario testing**: Register fixtures that simulate provider errors, timeouts, or malformed responses
- **Assertion validation**: Verify the prompt sent to the "AI" contains expected instructions
- **Contract testing**: Test that agents correctly format prompts and handle responses, without real AI

## Architectural Decisions

- **Decision**: Full provider fake vs. partial mock → Full fake replaces entire AI stack. Reason: Prevents any real API calls, guarantees determinism, works across all providers.
- **Decision**: Sequential fixture queue vs. prompt-matching → Sequential queue (FIFO). Reason: Simpler, predictable; prompt-matching would require complex regex/pattern matching.
- **Decision**: Built-in vs. package → Built into Laravel AI SDK. Reason: Critical for adoption — developers need to trust they can test AI features without network calls.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Sequential fixtures | Simple, predictable | Test breaks if agent call order changes |
| Full stack replacement | Guarantees no real calls | Can't test provider-specific behavior |
| Assertions on prompts only | Verifies input to AI | Can't easily assert on tool call arguments |

## Performance Considerations

- Fake responses are instant — no network latency
- Test suite with AI fakes is as fast as any regular PHPUnit test
- No rate limits, no cost, no flakiness from network failures

## Production Considerations

- Always call `Ai::fake()` in test setup or `preventStrayPrompts()` to prevent accidental real API calls
- Add `preventStrayPrompts()` to your `TestCase::setUp()` globally
- Register response fixtures at the start of each test method
- Test error handling by providing fixture responses that throw exceptions
- Use `Ai::assertPromptSent()` to verify prompt construction logic

## Common Mistakes

- Forgetting to call `Ai::fake()` — test makes real API calls, accruing costs and failures
- Insufficient fixtures for multi-turn agents — running out of fixtures triggers `preventStrayPrompts` failure
- Asserting prompt content too strictly — minor instruction changes break tests
- Not testing error scenarios — only testing "happy path" leaves error handling untested
- Using real provider in CI by mistake — `preventStrayPrompts()` catches this in local tests but CI without fakes will call APIs

## Failure Modes

- **Fixture exhaustion**: Agent makes more calls than fixtures provided — `preventStrayPrompts()` throws
- **Response mismatch**: Test relies on specific response format that fixture doesn't match — test silently passes but code breaks in production
- **Order sensitivity**: Refactoring changes agent call order — all fixture-based tests need updating
- **Real API leak**: Global `Ai::fake()` in base test case is accidentally removed — entire test suite hits real APIs

## Ecosystem Usage

- `phpunit` integration — all test assertions are standard PHPUnit methods
- CI/CD pipelines — fakes mean no API keys needed in CI
- TDD for AI features — write tests with fakes first, then implement agent
- Regression testing — fixture-based tests catch prompt changes that break output format

## Related Knowledge Units

- KU-001: Laravel AI SDK Architecture
- KU-011: Agent Architecture Fundamentals
- KU-005: Structured Output with JSON Schema

## Research Notes

- `Ai::fake()` added in v0.1.0, `AgentFake` added in v0.3.0
- `preventStrayPrompts()` was originally `preventStrayAiCalls()` — renamed for clarity
- Sequential fixture queue means tests must know exact call order — documentation recommends keeping test agent calls simple
- No built-in support for streaming response fakes — streaming tests require custom mocking
