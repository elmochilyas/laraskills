## Always Call `Ai::fake()` Before Agent Tests
---
## Category
Testing
---
## Rule
Call `Ai::fake()` in every test that invokes an agent or `Ai::call()`; never write a test that makes real API calls without explicit opt-in.
---
## Reason
Real API calls make tests slow (seconds vs. milliseconds), expensive (per-token cost), non-deterministic (provider changes behavior), and flaky (network issues). Fakes return instant, deterministic responses. Add `Ai::preventStrayPrompts()` to catch accidental real calls.
---
## Bad Example
```php
public function test_agent_responds(): void {
    // Makes a real API call — slow, costly, flaky
    $response = (new SupportAgent)->prompt('Help');
}
```
---
## Good Example
```php
public function test_agent_responds(): void {
    Ai::fake([new AiResponse('How can I help you today?')]);
    Ai::preventStrayPrompts();
    
    $response = (new SupportAgent)->prompt('Help');
    $this->assertStringContainsString('help', $response->text);
}
```
---
## Exceptions
Dedicated integration test suites with explicit `@group integration` annotation may bypass fakes for end-to-end provider testing.
---
## Consequences Of Violation
Accruing API costs in CI ($100s/month), flaky test suites, slow test feedback loops, accidental production API key usage.

## Provide Sufficient Fixtures for Multi-Turn Agents
---
## Category
Testing
---
## Rule
Register one fixture response per expected AI call in sequence; ensure the fixture count matches the expected call count for the test scenario.
---
## Reason
Agents may make multiple calls (tool calls, follow-ups) during a single `prompt()` invocation. If fixtures are exhausted mid-sequence, `preventStrayPrompts()` throws, failing the test. Counting expected calls before writing tests prevents fixture exhaustion.
---
## Bad Example
```php
Ai::fake([new AiResponse('What order number?')]); // Only 1 fixture
$agent->prompt('Find my order'); // Agent may make 3 calls
```
---
## Good Example
```php
Ai::fake([
    new AiResponse('What order number?'),
    new AiResponse('I found order #42', toolCalls: ['searchOrders']),
    new AiResponse('Your order has been shipped.'),
]);
$response = $agent->prompt('Find my order');
```
---
## Exceptions
Agents with non-deterministic call counts should use `Ai::fake($responses, matchOnPrompt: true)` for prompt-matching fixtures.
---
## Consequences Of Violation
TestAssertionFailed from stray prompt detection, brittle tests that break when agent behavior changes call count.

## Test Error Scenarios with Fixtures
---
## Category
Testing
---
## Rule
Register fixture responses that simulate provider errors, timeouts, and malformed responses; test that agents handle errors gracefully.
---
## Reason
Happy-path-only testing leaves error-handling code untested. Provider failures are inevitable in production. Testing error scenarios ensures agents degrade gracefully (retry, fallback, user-friendly error messages) rather than crashing or returning confusing output.
---
## Bad Example
```php
Ai::fake([new AiResponse('Success')]);
// No test for error scenarios
```
---
## Good Example
```php
public function test_agent_retries_on_timeout(): void {
    Ai::fake([
        new AiResponse(timeout: true),
        new AiResponse(timeout: true),
        new AiResponse('Success on third attempt'),
    ]);
    $response = $agent->prompt('Process this');
    $this->assertStringContainsString('Success', $response->text);
}
```
---
## Exceptions
Prototype agents that are not yet error-handling aware may delay error-scenario testing until robustness requirements are defined.
---
## Consequences Of Violation
Production errors unhandled, agent returns confusing error output to users, silent failures in edge cases.

## Verify Prompts with Assertions
---
## Category
Testing
---
## Rule
Use `Ai::assertPromptSent()` to verify that the correct prompt was constructed and sent to the AI; test prompt construction logic independently.
---
## Reason
Agent testing should verify not only that the response is correct, but that the right input was sent to the provider. Prompt construction bugs (missing context, wrong instructions, malformed format) are common and can only be caught by asserting on the prompt.
---
## Bad Example
```php
// Tests only the output, not the input
$response = $agent->prompt('Explain laravel/ai');
```
---
## Good Example
```php
$response = $agent->prompt('Explain laravel/ai');
Ai::assertPromptSent(function (string $prompt): bool {
    return str_contains($prompt, 'laravel/ai')
        && str_contains($prompt, 'senior developer');
});
```
---
## Exceptions
Simple agents with trivial prompt construction may skip prompt assertions if the prompt is a direct passthrough of user input.
---
## Consequences Of Violation
Prompt construction bugs missed in testing, deployed agents display wrong instructions, silent behavior degradation.
