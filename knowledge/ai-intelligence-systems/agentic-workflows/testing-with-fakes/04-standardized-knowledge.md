---
id: KU-016
title: "Testing with Fakes"
subdomain: "agentic-workflows"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/03-agentic-workflows/testing-with-fakes/04-standardized-knowledge.md"
---

# Testing with Fakes

## Overview

The Laravel AI SDK provides a comprehensive testing layer via `FakeAi` and `AgentFake` classes. `Ai::fake()` intercepts all AI calls and returns pre-defined responses, while `preventStrayPrompts()` asserts that no real API calls leak during tests. This enables deterministic, fast, cost-free testing of AI-powered features without mocking HTTP clients or using real provider credentials.

## Core Concepts

- `Ai::fake()`: Replaces the real AI driver with a fake â€” all `Ai::call()` and agent prompts return fixture responses
- `Ai::fake([$responses])`: Pre-register sequential responses for specific prompts or patterns
- `AgentFake`: Fake implementation of Agent contracts â€” returns configured responses
- `preventStrayPrompts()`: Asserts that the test doesn't invoke any unexpected AI calls
- `Ai::assertPromptSent()`: Assert that a specific prompt was sent during test
- `Ai::assertNothingPrompted()`: Assert no AI calls were made
- Response fixture: Array of `AiResponse` objects that the fake returns sequentially

## When To Use

- Production applications requiring Testing with Fakes functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Fixture-based testing**: Predefine expected responses for each test scenario
- **Sequential responses**: Use ordered fixture arrays for multi-turn conversations
- **Error scenario testing**: Register fixtures that simulate provider errors, timeouts, or malformed responses
- **Assertion validation**: Verify the prompt sent to the "AI" contains expected instructions
- **Contract testing**: Test that agents correctly format prompts and handle responses, without real AI

- **Http::fake() for AI**: Same pattern as `Http::fake()` â€” intercept outgoing calls, return fixtures. Assert what was sent.
- **Database factory for AI**: Predefined response factories â€” know exactly what the AI will "say" in tests.
- **Mocking by contract**: Just as you mock Eloquent models with factories, you fake AI responses with fixtures.

## Architecture Guidelines

- **Decision**: Full provider fake vs. partial mock â†’ Full fake replaces entire AI stack. Reason: Prevents any real API calls, guarantees determinism, works across all providers.
- **Decision**: Sequential fixture queue vs. prompt-matching â†’ Sequential queue (FIFO). Reason: Simpler, predictable; prompt-matching would require complex regex/pattern matching.
- **Decision**: Built-in vs. package â†’ Built into Laravel AI SDK. Reason: Critical for adoption â€” developers need to trust they can test AI features without network calls.

## Performance Considerations

- Fake responses are instant â€” no network latency
- Test suite with AI fakes is as fast as any regular PHPUnit test
- No rate limits, no cost, no flakiness from network failures

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Sequential fixtures | Simple, predictable | Test breaks if agent call order changes |
| Full stack replacement | Guarantees no real calls | Can't test provider-specific behavior |
| Assertions on prompts only | Verifies input to AI | Can't easily assert on tool call arguments |

## Security Considerations

- Always call `Ai::fake()` in test setup or `preventStrayPrompts()` to prevent accidental real API calls
- Add `preventStrayPrompts()` to your `TestCase::setUp()` globally
- Register response fixtures at the start of each test method
- Test error handling by providing fixture responses that throw exceptions
- Use `Ai::assertPromptSent()` to verify prompt construction logic

## Common Mistakes

- Forgetting to call `Ai::fake()` â€” test makes real API calls, accruing costs and failures
- Insufficient fixtures for multi-turn agents â€” running out of fixtures triggers `preventStrayPrompts` failure
- Asserting prompt content too strictly â€” minor instruction changes break tests
- Not testing error scenarios â€” only testing "happy path" leaves error handling untested
- Using real provider in CI by mistake â€” `preventStrayPrompts()` catches this in local tests but CI without fakes will call APIs

## Anti-Patterns

- **Fixture exhaustion**: Agent makes more calls than fixtures provided â€” `preventStrayPrompts()` throws
- **Response mismatch**: Test relies on specific response format that fixture doesn't match â€” test silently passes but code breaks in production
- **Order sensitivity**: Refactoring changes agent call order â€” all fixture-based tests need updating
- **Real API leak**: Global `Ai::fake()` in base test case is accidentally removed â€” entire test suite hits real APIs

## Examples

The following ecosystem packages provide reference implementations:

- `phpunit` integration â€” all test assertions are standard PHPUnit methods
- CI/CD pipelines â€” fakes mean no API keys needed in CI
- TDD for AI features â€” write tests with fakes first, then implement agent
- Regression testing â€” fixture-based tests catch prompt changes that break output format

## Related Topics

- KU-001: Laravel AI SDK Architecture
- KU-011: Agent Architecture Fundamentals
- KU-005: Structured Output with JSON Schema

## AI Agent Notes

- When asked about Testing with Fakes, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

