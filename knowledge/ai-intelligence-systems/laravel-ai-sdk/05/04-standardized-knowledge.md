---
id: ku-05
title: "Configuration & Environment Management"
subdomain: "llm-provider-abstraction"
ku-type: "operations"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/llm-provider-abstraction/ku-05/04-standardized-knowledge.md"
---

# Configuration & Environment Management

## Overview

Configuration and environment management for LLM providers covers how provider credentials, model selections, endpoint URLs, timeout settings, and feature flags are defined, distributed, and maintained across environments (development, staging, production). Proper configuration management ensures that code can move through environments without modification, that secrets are handled securely, and that provider topology changes (adding/removing providers, updating models) can happen without code deployments.

## Core Concepts

- **Provider Configuration:** Per-provider settings: API key(s), base URL, default model, timeout, max retries, organization ID.
- **Environment-Specific Config:** Different configurations per environment (dev uses GPT-4o-mini, production uses GPT-4o).
- **Configuration Hierarchy:** Config sources ordered by precedence: environment variables → config files → defaults.
- **Feature Flags:** Runtime toggles for enabling/disabling providers, models, or features without deployment.
- **Model Registry:** A central mapping of model aliases (`gpt4`, `haiku`, `sonnet`) to provider-specific model IDs.
- **Configuration Validation:** Validating that the configuration is correct at startup (keys present, URLs valid, models exist).
- **Configuration Hot-Reload:** Updating configuration without restarting the application (for feature flags, model routing).

## When To Use

- Multi-environment deployments (always — config management is required).
- Multi-provider systems with complex routing rules.
- Applications where models or providers change frequently.
- Teams practicing GitOps or infrastructure-as-code.

## When NOT To Use

- Single-environment, single-provider hobby projects (environment variables in .env suffice).
- Applications where configuration changes always require code deployment.

## Best Practices

- **Use environment variables for secrets** (API keys) and config files for non-sensitive settings (timeouts, models).
- **Define a configuration schema** with default values, types, and validation rules. Fail fast on invalid config.
- **Use model aliases** instead of raw model IDs in application code. `config('ai.models.default')` instead of `'gpt-4o'`.
- **Validate configuration at startup**, not on first use. A missing API key should fail the deployment, not the first user request.
- **Version configuration files** in version control (without secrets). Secrets go in secrets manager.
- **Use a config service** for runtime configuration that changes frequently (feature flags, model routing weights).

## Architecture Guidelines

- In Laravel, use the **config system** (`config/ai.php`) for provider configuration with environment variable overrides.
- Define a **configuration reader** service that aggregates config from multiple sources and validates it.
- Implement a **configuration cache** that compiles config into an efficient format for runtime access.
- For runtime configuration, use a **config service** (database-backed with cache) that can be updated via API.
- Separate **provider identity** (which providers are available) from **provider behavior** (timeout, retry, model selection).

## Performance Considerations

- Configuration reads should be cached in memory — config file parsing or database reads on every request are wasteful.
- Configuration validation at startup adds 10-100ms — negligible for a booting process.
- Config service lookups add 1-5ms (Redis). Cache with 60-second TTL.
- Configuration hot-reload: use a cache invalidation mechanism (Redis pub/sub or file watcher) to trigger re-read.
- Model registry lookups should be O(1) — use a hash map in memory.

## Security Considerations

- **API keys in config files:** Never commit API keys to version control. Use environment variables or secrets manager.
- **Configuration injection:** Never allow user input to directly influence configuration values (routing, model selection).
- **Configuration access control:** Only administrators should be able to modify runtime configuration.
- **Configuration audit trail:** Log configuration changes (who changed what and when).
- **Secret rotation:** When provider API keys are rotated, the configuration system must support updating keys without deployment.

## Common Mistakes

- Hardcoding model IDs in application code instead of using config aliases.
- Not validating configuration at startup — a typo in a model name is discovered at runtime.
- Storing secrets in config files committed to version control.
- Using the same configuration across all environments — dev should use different models/timeouts than production.
- Not providing sensible defaults — every config value requires explicit setting, making setup cumbersome.

## Anti-Patterns

- **Config as Code:** Embedding configuration values in application code. Every model change requires a deployment.
- **Environment Variable Sprawl:** 50+ environment variables for every minor setting. Group related settings into structured config.
- **Magic Strings:** Referencing provider names or model IDs as strings throughout the codebase. Use constants or enums.
- **Config Copy-Paste:** Duplicating configuration across multiple files or services. Centralize in a config service.
- **No Config Documentation:** Configuration options without descriptions, types, or examples. Every option should be self-documenting.

## Examples

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

## Related Topics

- ku-01 (Provider Abstraction Layer Design): The layer that configuration drives.
- ku-02 (Provider Adapters): Adapters consume provider configuration.
- ai-middleware-gateway/ku-01: Gateway configuration builds on provider config.
- ai-safety-security/ku-03: Secure secrets management for API keys.
- cost-management-observability/ku-05: Budget configuration per provider.

## AI Agent Notes

- When asked to set up provider configuration, first define: which providers, which models per environment, and which settings need to differ by environment.
- For configuration bugs, check: environment variable names, config file paths, and cache invalidation.
- Prefer reading the configuration schema before the application code that reads config values.
- When generating configuration code, include validation at startup with clear error messages.

## Verification

- [ ] Provider configurations are defined in config files (not hardcoded) with environment variable overrides.
- [ ] API keys are stored in environment variables or secrets manager, not in config files.
- [ ] Configuration is validated at startup with clear error messages for missing/invalid values.
- [ ] Model aliases are used in application code (not raw model IDs).
- [ ] Configuration supports environment-specific overrides (dev/staging/production).
- [ ] Sensible defaults exist for all configurable values.
- [ ] Configuration changes can be made without code deployment (environment variables or config service).
