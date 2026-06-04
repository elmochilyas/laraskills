# Knowledge Unit: Configuration & Environment Management

## Metadata

- **ID:** ku-05
- **Subdomain:** Laravel AI SDK
- **Slug:** configuration---environment-management
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Configuration and environment management for LLM providers covers how provider credentials, model selections, endpoint URLs, timeout settings, and feature flags are defined, distributed, and maintained across environments (development, staging, production). Proper configuration management ensures that code can move through environments without modification, that secrets are handled securely, and that provider topology changes (adding/removing providers, updating models) can happen without code deployments.

## Core Concepts

- **Provider Configuration:** Per-provider settings: API key(s), base URL, default model, timeout, max retries, organization ID.
- **Environment-Specific Config:** Different configurations per environment (dev uses GPT-4o-mini, production uses GPT-4o).
- **Configuration Hierarchy:** Config sources ordered by precedence: environment variables â†’ config files â†’ defaults.
- **Feature Flags:** Runtime toggles for enabling/disabling providers, models, or features without deployment.
- **Model Registry:** A central mapping of model aliases (`gpt4`, `haiku`, `sonnet`) to provider-specific model IDs.
- **Configuration Validation:** Validating that the configuration is correct at startup (keys present, URLs valid, models exist).
- **Configuration Hot-Reload:** Updating configuration without restarting the application (for feature flags, model routing).

## Mental Models

- **Provider Configuration:** Per-provider settings: API key(s), base URL, default model, timeout, max retries, organization ID.
- **Environment-Specific Config:** Different configurations per environment (dev uses GPT-4o-mini, production uses GPT-4o).
- **Configuration Hierarchy:** Config sources ordered by precedence: environment variables â†’ config files â†’ defaults.


## Internal Mechanics

The internal mechanics of Configuration & Environment Management follow established patterns within the Laravel AI SDK domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Use environment variables for secrets** (API keys) and config files for non-sensitive settings (timeouts, models).
- **Define a configuration schema** with default values, types, and validation rules. Fail fast on invalid config.
- **Use model aliases** instead of raw model IDs in application code. `config('ai.models.default')` instead of `'gpt-4o'`.
- **Validate configuration at startup**, not on first use. A missing API key should fail the deployment, not the first user request.
- **Version configuration files** in version control (without secrets). Secrets go in secrets manager.
- **Use a config service** for runtime configuration that changes frequently (feature flags, model routing weights).

## Patterns

- **Use environment variables for secrets** (API keys) and config files for non-sensitive settings (timeouts, models).
- **Define a configuration schema** with default values, types, and validation rules. Fail fast on invalid config.
- **Use model aliases** instead of raw model IDs in application code. `config('ai.models.default')` instead of `'gpt-4o'`.
- **Validate configuration at startup**, not on first use. A missing API key should fail the deployment, not the first user request.
- **Version configuration files** in version control (without secrets). Secrets go in secrets manager.
- **Use a config service** for runtime configuration that changes frequently (feature flags, model routing weights).

## Architectural Decisions

- In Laravel, use the **config system** (`config/ai.php`) for provider configuration with environment variable overrides.
- Define a **configuration reader** service that aggregates config from multiple sources and validates it.
- Implement a **configuration cache** that compiles config into an efficient format for runtime access.
- For runtime configuration, use a **config service** (database-backed with cache) that can be updated via API.
- Separate **provider identity** (which providers are available) from **provider behavior** (timeout, retry, model selection).

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Configuration reads should be cached in memory â€” config file parsing or database reads on every request are wasteful.
- Configuration validation at startup adds 10-100ms â€” negligible for a booting process.
- Config service lookups add 1-5ms (Redis). Cache with 60-second TTL.
- Configuration hot-reload: use a cache invalidation mechanism (Redis pub/sub or file watcher) to trigger re-read.
- Model registry lookups should be O(1) â€” use a hash map in memory.

## Production Considerations

- **API keys in config files:** Never commit API keys to version control. Use environment variables or secrets manager.
- **Configuration injection:** Never allow user input to directly influence configuration values (routing, model selection).
- **Configuration access control:** Only administrators should be able to modify runtime configuration.
- **Configuration audit trail:** Log configuration changes (who changed what and when).
- **Secret rotation:** When provider API keys are rotated, the configuration system must support updating keys without deployment.

## Common Mistakes

- Hardcoding model IDs in application code instead of using config aliases.
- Not validating configuration at startup â€” a typo in a model name is discovered at runtime.
- Storing secrets in config files committed to version control.
- Using the same configuration across all environments â€” dev should use different models/timeouts than production.
- Not providing sensible defaults â€” every config value requires explicit setting, making setup cumbersome.

## Failure Modes

- **Config as Code:** Embedding configuration values in application code. Every model change requires a deployment.
- **Environment Variable Sprawl:** 50+ environment variables for every minor setting. Group related settings into structured config.
- **Magic Strings:** Referencing provider names or model IDs as strings throughout the codebase. Use constants or enums.
- **Config Copy-Paste:** Duplicating configuration across multiple files or services. Centralize in a config service.
- **No Config Documentation:** Configuration options without descriptions, types, or examples. Every option should be self-documenting.

## Ecosystem Usage

### Provider Configuration Schema
```php
// config/ai.php
return [
    'default' => env('AI_DEFAULT_PROVIDER', 'openai'),

    'providers' => [
        'openai' => [
            'api_key' => env('OPENAI_API_KEY'),
            'organization' => env('OPENAI_ORG_ID'),
            'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
            'default_model' => env('OPENAI_MODEL', 'gpt-4o'),
            'timeout' => env('OPENAI_TIMEOUT', 30),
            'max_retries' => env('OPENAI_MAX_RETRIES', 3),
        ],
        'anthropic' => [
            'api_key' => env('ANTHROPIC_API_KEY'),
            'default_model' => env('ANTHROPIC_MODEL', 'claude-3-opus-20240229'),
            'timeout' => env('ANTHROPIC_TIMEOUT', 60),
        ],
    ],

    'models' => [
        'default' => env('AI_DEFAULT_MODEL', 'gpt-4o'),
        'fast' => env('AI_FAST_MODEL', 'gpt-4o-mini'),
        'cheap' => env('AI_CHEAP_MODEL', 'gpt-4o-mini'),
        'powerful' => env('AI_POWERFUL_MODEL', 'claude-3-opus-20240229'),
    ],
];
```

### Configuration Validator
```php
class AIConfigurationValidator {
    public function validate(): void {
        $default = config('ai.default');
        $providers = config('ai.providers');

        if (!isset($providers[$default])) {
            throw new ConfigurationException("Default provider '{$default}' is not configured.");
        }

        foreach ($providers as $name => $provider) {
            if (empty($provider['api_key'])) {
                throw new ConfigurationException("Provider '{$name}' has no API key configured.");
            }
        }
    }
}
```

## Related Knowledge Units

- ku-01 (Provider Abstraction Layer Design): The layer that configuration drives.
- ku-02 (Provider Adapters): Adapters consume provider configuration.
- ai-middleware-gateway/ku-01: Gateway configuration builds on provider config.
- ai-safety-security/ku-03: Secure secrets management for API keys.
- cost-management-observability/ku-05: Budget configuration per provider.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

