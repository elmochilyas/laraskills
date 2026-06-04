# Knowledge Unit: Development Workflow with Local Models

## Metadata

- **ID:** ku-02
- **Subdomain:** Local LLMs
- **Slug:** development-workflow-with-local-models
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Using local LLMs during development enables rapid iteration without provider API costs, rate limits, or network dependencies. The development workflow covers setting up local models, configuring the application to use them in development environments, creating effective test fixtures, benchmarking against production models, and establishing CI/CD practices for prompt and model changes. The key insight is that local models should be "close enough" to production models for development, with the understanding that quality differences exist.

## Core Concepts

- **Development vs. Production Parity:** Local models used in dev should approximate production model behavior for the specific use case.
- **Model Fidelity Gap:** The quality and behavior difference between the local dev model and the production cloud model.
- **Prompt Testing:** Iterating on prompts with a local model before testing on expensive production models.
- **Mock Provider:** A fake provider that returns canned responses for deterministic testing (not a real LLM call).
- **Fixture-Based Testing:** Recording real LLM responses and replaying them in tests to avoid LLM calls in CI.
- **Regression Testing:** Tracking prompt changes and their impact on output quality over time.
- **Cost-Free Iteration:** The developer can run unlimited tests and experiments without incurring API costs.

## Mental Models

- **Development vs. Production Parity:** Local models used in dev should approximate production model behavior for the specific use case.
- **Model Fidelity Gap:** The quality and behavior difference between the local dev model and the production cloud model.
- **Prompt Testing:** Iterating on prompts with a local model before testing on expensive production models.


## Internal Mechanics

The internal mechanics of Development Workflow with Local Models follow established patterns within the Local LLMs domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Use the same provider abstraction** for local and production models. The application code should not care whether the model is local or cloud.
- **Record and replay responses** for deterministic testing. Use a VCR-like library (e.g., PHP-VCR) to capture LLM responses as fixtures.
- **Run prompt tests against both local and production models** before deploying. A prompt that works on Llama 3.2 may fail on GPT-4o.
- **Automate regression testing** with a suite of canonical prompts and expected output characteristics.
- **Use local models for prompt structure iteration** and production models for final quality validation.
- **Set up a local model hot-swap** â€” the developer can switch between local and cloud models via environment variable.

## Patterns

- **Use the same provider abstraction** for local and production models. The application code should not care whether the model is local or cloud.
- **Record and replay responses** for deterministic testing. Use a VCR-like library (e.g., PHP-VCR) to capture LLM responses as fixtures.
- **Run prompt tests against both local and production models** before deploying. A prompt that works on Llama 3.2 may fail on GPT-4o.
- **Automate regression testing** with a suite of canonical prompts and expected output characteristics.
- **Use local models for prompt structure iteration** and production models for final quality validation.
- **Set up a local model hot-swap** â€” the developer can switch between local and cloud models via environment variable.

## Architectural Decisions

- Implement a **provider factory** that selects the provider based on the `APP_ENV` environment variable: local dev â†’ Ollama, staging â†’ GPT-4o-mini, production â†’ GPT-4o.
- Use **dependency injection** so that the LLM provider is injected into services, not instantiated directly.
- Store test fixtures in version control as **JSON files** named by test case and scenario.
- Create a **prompt evaluation suite** that runs on every prompt change â€” a set of test inputs with expected output characteristics.
- For CI, use **mock providers** that return fixtures (fast, deterministic, no external dependencies).

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Local model inference is slower than cloud models on most development hardware. Set timeout expectations accordingly.
- Parallel testing: running multiple local model instances for parallel test execution is memory-intensive. Use fixture replay for CI.
- Model loading time: some inference engines load models lazily (first request is slow). Warm up the model at environment start.
- Developer experience: if local model inference takes >10 seconds per response, developers will avoid using it.
- Consider using **smaller quantized models** for dev (3B-8B parameters) to keep response times acceptable.

## Production Considerations

- **API key isolation:** Ensure developers don't accidentally use production API keys in development (use environment-specific config).
- **Test data sensitivity:** Test fixtures may contain sensitive data. Don't commit real user data as fixtures.
- **Model file integrity:** Verify checksums of downloaded development models from trusted sources.
- **CI secrets:** If CI tests use cloud models (for validation), use CI-specific API keys with limited quotas.
- **Local model safety:** Local models may have less content moderation. Apply appropriate safeguards in development.

## Common Mistakes

- Not recording test fixtures â€” tests call real LLMs in CI, causing flaky, slow, and expensive test runs.
- Using the same prompts for local and production without validation â€” behavior differences cause production issues.
- Not handling model unavailability â€” if the local model server is down, the development environment should fail gracefully.
- Committing API keys in test configuration â€” use environment variables for all credentials.
- Over-relying on local model quality â€” deploying prompts that only work with the local model.

## Failure Modes

- **Production-Local Divergence:** Allowing the development configuration to drift so far from production that issues are only discovered after deployment.
- **No Fixture Strategy:** Every test run calls a real LLM, making tests slow, flaky, and expensive.
- **Manual Prompt Testing:** Only testing prompts manually in a playground without automated regression tests.
- **Local-Only Prompting:** Writing prompts that work exclusively with the local model's quirks (e.g., specific format requirements).
- **Ignoring Token Costs in Dev:** Not tracking token usage during development â€” valuable optimization opportunities are missed.

## Ecosystem Usage

### Environment-Specific Provider Selection
```php
// AppServiceProvider.php
public function register(): void {
    $this->app->bind(LLMProvider::class, function ($app) {
        $factory = new LLMProviderFactory();

        return match ($app->environment()) {
            'local' => $factory->make('ollama', config('ai.providers.ollama')),
            'testing' => $app->make(MockLLMProvider::class),
            'staging' => $factory->make('openai', config('ai.providers.openai_mini')),
            'production' => $factory->make('openai', config('ai.providers.openai')),
        };
    });
}
```

### Test Fixture Recorder
```php
class LLMFixtureRecorder {
    public function record(string $testName, array $request, array $response): void {
        $path = base_path("tests/fixtures/llm/{$testName}.json");
        file_put_contents($path, json_encode([
            'request' => $request,
            'response' => $response,
            'recorded_at' => now()->toIso8601String(),
        ], JSON_PRETTY_PRINT));
    }
}

class LLMTest extends TestCase {
    /** @dataProvider promptScenarios */
    public function test_prompt_quality(string $input, string $fixtureFile): void {
        $fixture = json_decode(
            file_get_contents(base_path("tests/fixtures/llm/{$fixtureFile}.json")),
            true
        );
        $mock = MockLLMProvider::fromFixture($fixture);
        $result = $mock->chat(new ChatRequest([$input]));
        $this->assertStringContainsString($fixture['expected_keyword'], $result->content);
    }
}
```

## Related Knowledge Units

- ku-01 (Local LLM Setup): Setting up the local model for development.
- ku-03 (Model Selection & Quantization): Choosing appropriate dev models.
- llm-provider-abstraction/ku-05: Environment-specific provider configuration.
- prompt-engineering-systems/ku-01: Iterating on prompts in development.
- cost-management-observability/ku-01: Tracking dev vs. production costs.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

