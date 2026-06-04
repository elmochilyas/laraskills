## Use Env Variables for Secrets, Config Files for Settings

---
## Category
Security | Maintainability

---
## Rule
Store API keys and secrets in environment variables; store non-sensitive settings (timeouts, models, retries) in config files with env variable overrides; never commit secrets to version control.

---
## Reason
Config files committed to version control expose secrets to anyone with repository access. Environment variables keep secrets out of the codebase and support per-environment values without code changes.

---
## Bad Example
```php
// config/ai.php — API key hardcoded
'api_key' => 'sk-1234567890abcdef',
```

---
## Good Example
```php
// config/ai.php — API key from env
'api_key' => env('OPENAI_API_KEY'),
'timeout' => env('OPENAI_TIMEOUT', 30),
'model' => env('OPENAI_MODEL', 'gpt-4o'),
```

---
## Exceptions
Local development environments may use `.env` files that are excluded from version control.

---
## Consequences Of Violation
Secret exposure in repository, unauthorized provider access, credential rotation requires code deployment.

---

## Validate Configuration at Startup

---
## Category
Reliability

---
## Rule
Validate all provider configuration at application startup, not on first use; never let a missing API key or invalid model name be discovered during a user request.

---
## Reason
A configuration error discovered at runtime produces a 500 error for the user, degrades trust, and is harder to diagnose in production. Startup validation fails the deployment immediately with a clear message.

---
## Bad Example
```php
class ChatController {
    public function __invoke(Request $request): Response {
        $response = Ai::call(/* ... */);
        // Fails with obscure error if API key is missing
    }
}
```

---
## Good Example
```php
// In AppServiceProvider:
public function boot(): void {
    $validator = app(AIConfigurationValidator::class);
    $validator->validate(); // Throws if config is invalid
}

class AIConfigurationValidator {
    public function validate(): void {
        $default = config('ai.default');
        $providers = config('ai.providers');

        if (!isset($providers[$default])) {
            throw new ConfigurationException(
                "Default provider '{$default}' is not configured."
            );
        }

        foreach ($providers as $name => $provider) {
            if (empty($provider['api_key'])) {
                throw new ConfigurationException(
                    "Provider '{$name}' has no API key."
                );
            }
        }
    }
}
```

---
## Exceptions
Configuration that changes at runtime (feature flags) should be validated on read, not at startup.

---
## Consequences Of Violation
User-facing 500 errors for preventable configuration issues, delayed detection of deployment problems, difficult debugging.

---

## Use Model Aliases, Not Raw Model IDs

---
## Category
Maintainability | Flexibility

---
## Rule
Reference models through aliases defined in configuration (`config('ai.models.default')`) instead of hardcoding raw model IDs in application code.

---
## Reason
Raw model IDs scattered throughout the codebase require code changes and redeployment when models are updated, deprecated, or swapped per environment. Aliases centralize model selection in configuration.

---
## Bad Example
```php
$response = Ai::call(messages: $messages, model: 'gpt-4o-2024-08-06');
// Hardcoded model ID — must change code to update
```

---
## Good Example
```php
// config/ai.php
'models' => [
    'default' => env('AI_DEFAULT_MODEL', 'gpt-4o'),
    'fast' => env('AI_FAST_MODEL', 'gpt-4o-mini'),
    'cheap' => env('AI_CHEAP_MODEL', 'gpt-4o-mini'),
],

// Application code
$response = Ai::call(messages: $messages, model: config('ai.models.default'));
```

---
## Exceptions
When a specific model version is required for reproducibility (testing, evaluation), the exact model ID may be used with documentation.

---
## Consequences Of Violation
Model updates require code changes and redeployment, environment-specific model selection is impossible, technical debt from scattered model IDs.

---

## Use Environment-Specific Configuration

---
## Category
Maintainability | Reliability

---
## Rule
Define different model and timeout configurations per environment (development, staging, production); never use the same configuration for all environments.

---
## Reason
Development should use fast, cheap models (e.g., GPT-4o-mini) with generous timeouts. Production needs robust models with tighter timeouts. Identical configuration causes slow dev iteration or production failures.

---
## Bad Example
```php
// config/ai.php — same for all environments
'default_model' => 'gpt-4o',
'timeout' => 30,
```

---
## Good Example
```php
// config/ai.php — per-environment via env
'default_model' => env('AI_DEFAULT_MODEL', 'gpt-4o-mini'), // Cheap in dev
'timeout' => env('AI_TIMEOUT', 120), // Generous in dev

// .env.dev
AI_DEFAULT_MODEL=gpt-4o-mini
AI_TIMEOUT=120

// .env.prod
AI_DEFAULT_MODEL=gpt-4o
AI_TIMEOUT=30
```

---
## Exceptions
When using a local LLM (Ollama) in all environments, the configuration may be identical.

---
## Consequences Of Violation
Slow development iteration (waiting for expensive models), production timeouts from dev-oriented settings, higher dev costs.

---

## Implement Configuration Override Precedence

---
## Category
Architecture | Maintainability

---
## Rule
Implement a configuration hierarchy with clear precedence: environment variables override config files, config files override defaults; never allow ambiguous override behavior.

---
## Reason
Without clear precedence, it is unpredictable which configuration value takes effect when multiple sources define the same key. This leads to debugging nightmares and environment-specific bugs that are hard to reproduce.

---
## Bad Example
```php
// No clear precedence — both sources may conflict
$model = env('AI_MODEL') ?? config('ai.model');
```

---
## Good Example
```php
// config/ai.php — clear hierarchy
return [
    'default_model' => env('AI_DEFAULT_MODEL', 'gpt-4o'),
    'providers' => [
        'openai' => [
            'api_key' => env('OPENAI_API_KEY'),
            'timeout' => (int) env('OPENAI_TIMEOUT', 30),
        ],
    ],
];

// Usage — always through config (which already resolved env overrides)
$model = config('ai.default_model');
```

---
## Exceptions
Feature flags that need runtime updates may use database-backed configuration with a cache layer.

---
## Consequences Of Violation
Unpredictable configuration behavior, hard-to-debug environment-specific issues, configuration drift between environments.
