# Skill: Create And Register Feature Configuration

## Purpose

Isolate each feature's configuration values (API keys, feature flags, tunable parameters) into its own config file, merged into Laravel's config repository via the feature's service provider.

## When To Use

- Creating a new feature that requires configuration values
- Adding environment-specific settings to an existing feature
- Introducing a feature flag for gradual rollout

## When NOT To Use

- Features with no configuration (purely internal logic)
- Small applications where a single `config/services.php` suffices
- Configuration that is already centralized and changing would cause disruption

## Prerequisites

- Feature exists with a service provider
- Feature config namespace is decided (e.g., `billing`)
- Environment variable naming convention established

## Inputs

- Feature name (e.g., `Billing`)
- Configuration keys and their defaults
- Environment variable names (prefixed with feature name)

## Workflow

1. Create `app/Features/{Feature}/config.php` returning an array of configuration values
2. Use `env('FEATURE_NAME_KEY', default)` for every value — never hardcode secrets
3. Prefix all env vars with the feature name in uppercase (e.g., `BILLING_STRIPE_KEY`)
4. Open the feature's service provider
5. In the `boot()` method, call `$this->mergeConfigFrom(__DIR__.'/../config.php', 'feature_name')`
6. Validate required config values after merging (throw `RuntimeException` for missing required keys)
7. Document all config keys in the feature's README with a reference table

## Validation Checklist

- [ ] Config file exists at `app/Features/{Feature}/config.php`
- [ ] `mergeConfigFrom()` called in `boot()`, not `register()`
- [ ] All secrets use `env()` — no hardcoded credentials
- [ ] Environment variables prefixed with feature name (e.g., `BILLING_STRIPE_KEY`)
- [ ] Config keys namespaced with feature name: `config('billing.stripe.key')`
- [ ] Required config validated at provider boot with descriptive exception
- [ ] `php artisan config:cache` works without errors
- [ ] Config documented in feature README with key, default, required, description

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| Hardcoded secrets | Convenience, speed | Always use `env('KEY')` |
| Config in `register()` | Misunderstanding lifecycle | Always use `boot()` |
| Missing `mergeConfigFrom()` | Forgetting to call merge | Verify with `config('feature.*')` |
| Stale cached config | Not re-running config:cache | Run in deployment |
| Env var collision | No feature prefix | Always prefix with feature name |
| Missing validation | Silent null values | Validate at boot |

## Decision Points

- **env() vs hardcoded default**: Use `env('KEY', 'default')` — second arg is the default for non-sensitive values
- **Feature flag vs config key**: Feature flags go under a `features` sub-key: `config('billing.features.new_checkout')`
- **Single file vs environment files**: One `config.php` per feature is sufficient. Add `config/production.php` only for complex environment-specific overrides.

## Performance Considerations

Config merging via `mergeConfigFrom()` costs ~0.01ms per feature. With `php artisan config:cache`, this cost is eliminated entirely — all merged config is serialized into a single file.

## Security Considerations

Never hardcode secrets in config files — use `env()`. Validate production config detects test credentials at boot. Feature configs are cached and should not be world-readable in production.

## Related Rules

- Use `mergeConfigFrom()` In Provider Boot Only (05-rules.md)
- Namespace Env Vars With Feature Prefix (05-rules.md)
- Never Hardcode Secrets In Config Files (05-rules.md)
- Validate Critical Config At Provider Boot (05-rules.md)
- Always Run `config:cache` In Production (05-rules.md)
- Document All Feature Config Keys (05-rules.md)
- Namespace Config Keys With Feature Name (05-rules.md)
- Use Feature Flags In Config For Gradual Rollouts (05-rules.md)

## Related Skills

- Create Feature Service Provider
- Define Cross-Feature Communication Contracts
- Evaluate Organizational Structure (feature-vs-layer)

## Success Criteria

- `config('feature_name.key')` returns the correct value in all environments
- `php artisan config:cache` succeeds and includes feature config
- Missing required config throws a clear exception at boot
- Feature README documents all config keys

---

# Skill: Validate Feature Configuration At Boot

## Purpose

Prevent silent misconfiguration by validating required feature configuration values when the application boots, throwing meaningful errors immediately rather than failing unpredictably in business logic.

## When To Use

- Feature has required config values (API keys, external service URLs)
- Critical values that would crash the feature if missing
- Production environment needs to validate credentials are not test values

## When NOT To Use

- Optional configuration with safe defaults
- Configuration validated elsewhere (e.g., middleware)
- Development environments where flexibility is useful

## Prerequisites

- Feature config file exists and is merged via `mergeConfigFrom()`
- Service provider has a `boot()` method

## Inputs

- Feature config keys to validate
- Validation rules (required, format, production-only checks)
- Feature service provider

## Workflow

1. After `mergeConfigFrom()` in `boot()`, read the config values: `config('billing.stripe.key')`
2. Check each required key: `if (empty($key)) { throw new \RuntimeException('...'); }`
3. Add environment-specific checks: in production, validate test credentials are not used
4. Use descriptive exception messages that tell the developer exactly what is missing
5. Validate only config where absence would cause a crash or security issue

## Validation Checklist

- [ ] Validation runs after `mergeConfigFrom()` in `boot()`
- [ ] Missing required config throws `RuntimeException` with descriptive message
- [ ] Production-specific checks detect test credentials
- [ ] Optional config with defaults is not validated
- [ ] Exception message tells developer what to fix

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| No validation | Assumption config is always present | Validate required keys |
| Silent null propagation | Null values crash later with obscure errors | Validate at boot |
| Test credentials in prod | No environment check | Add production-only validation |
| Vague errors | "Config missing" without specifying key | Include exact config key in message |

## Decision Points

- **Required vs optional**: Only validate keys where absence would cause a crash or security issue. Optional config with defaults does not need validation.
- **Production-only checks**: `app()->environment('production')` guards for test credential detection. Skip in dev/testing.

## Performance Considerations

Config validation runs once per boot, not per request. Negligible performance cost. In production with config caching, the validation still runs on each boot but is cheap (array access + string comparison).

## Security Considerations

Production validation of credentials is a security control. Never log the actual credential values in exception messages — log only the key name.

## Related Rules

- Validate Critical Config At Provider Boot (05-rules.md)
- Never Hardcode Secrets In Config Files (05-rules.md)
- Use Feature Flags In Config For Gradual Rollouts (05-rules.md)

## Related Skills

- Create And Register Feature Configuration
- Create Feature Service Provider

## Success Criteria

- Application fails immediately at boot with clear message if required config is missing
- Production deployment with test credentials is rejected at boot
- Optional config absent does not cause boot failure
