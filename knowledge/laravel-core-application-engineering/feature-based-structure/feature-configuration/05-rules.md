## Use `mergeConfigFrom()` In Provider Boot Only

Feature configuration must be merged into the Laravel config repository inside the service provider's `boot()` method, never in `register()`.

---

## Category

Framework Usage

---

## Rule

Call `$this->mergeConfigFrom(__DIR__.'/../config.php', 'feature_name')` exclusively inside the provider's `boot()` method. Do not call it in `register()`.

---

## Reason

During `register()`, config values may not be fully loaded. Accessing `config('feature.*')` in `register()` returns `null`. The `boot()` method runs after all providers have registered, so the merged config is available.

---

## Bad Example

```php
class BillingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config.php', 'billing');
        // Other providers may not have registered yet
    }
}
```

---

## Good Example

```php
class BillingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config.php', 'billing');
    }
}
```

---

## Exceptions

No common exceptions. Config merging must always occur in `boot()`.

---

## Consequences Of Violation

Config values return `null` when accessed during `register()`. Application crashes or silently uses defaults. Intermittent failures depending on provider ordering.

---

## Namespace Env Vars With Feature Prefix

Every environment variable for a feature must be prefixed with the feature's name in uppercase.

---

## Category

Code Organization

---

## Rule

Prefix all feature-specific environment variables with the feature name in uppercase followed by an underscore (e.g., `BILLING_STRIPE_KEY`, `USERS_REGISTRATION_OPEN`). Never use generic names like `STRIPE_KEY`.

---

## Reason

Without prefixes, two features (e.g., Billing and Marketplace) could both define `STRIPE_KEY` with different values, causing an overwrite collision. Prefixing guarantees uniqueness and makes env var ownership clear.

---

## Bad Example

```php
return [
    'stripe_key' => env('STRIPE_KEY'), // Which feature owns this?
];
```

---

## Good Example

```php
return [
    'stripe_key' => env('BILLING_STRIPE_KEY'),
];
```

---

## Exceptions

Global env vars that affect the entire application (e.g., `APP_ENV`, `DB_HOST`) do not need feature prefixes.

---

## Consequences Of Violation

Env var collisions cause features to silently read the wrong configuration. Debugging misconfiguration across features is time-consuming.

---

## Never Hardcode Secrets In Config Files

All credentials, API keys, and secrets must be read from environment variables using `env()`, never hardcoded.

---

## Category

Security

---

## Rule

Use `env('FEATURE_SECRET_KEY')` for every sensitive value in feature config files. Never write secrets as string literals. Validate that production config does not use test credentials.

---

## Reason

Hardcoded secrets are committed to version control, exposed in CI logs, and accessible to anyone with repository access. Environment variables keep secrets out of the codebase and allow per-environment overrides.

---

## Bad Example

```php
return [
    'stripe' => [
        'key' => 'pk_live_abc123def456', // Hardcoded — committed to git
        'secret' => 'sk_live_xyz789',      // Exposed to all developers
    ],
];
```

---

## Good Example

```php
return [
    'stripe' => [
        'key' => env('BILLING_STRIPE_KEY'),
        'secret' => env('BILLING_STRIPE_SECRET'),
    ],
];
```

---

## Exceptions

Default values for non-sensitive configuration (e.g., page size, timeout seconds, feature flags defaulting to `true`/`false`) may be hardcoded as the second argument to `env()`.

---

## Consequences Of Violation

Secrets committed to version control. All developers (and CI) have access to production credentials. Regulatory compliance issues (PCI, SOC2, GDPR).

---

## Validate Critical Config At Provider Boot

Throw a meaningful exception when required feature configuration is missing or invalid.

---

## Category

Reliability

---

## Rule

After merging config in `boot()`, validate that all required keys are present and valid. Throw a descriptive `RuntimeException` if required config is missing or uses non-production values in the production environment.

---

## Reason

Missing config causes runtime errors at unpredictable points. Validating at boot provides an immediate, clear failure rather than a confusing error deep in business logic.

---

## Bad Example

```php
public function boot(): void
{
    $this->mergeConfigFrom(__DIR__.'/../config.php', 'billing');
    // No validation — null values crash later with obscure errors
}
```

---

## Good Example

```php
public function boot(): void
{
    $this->mergeConfigFrom(__DIR__.'/../config.php', 'billing');

    $key = config('billing.stripe.key');
    if (empty($key)) {
        throw new \RuntimeException('Missing required billing.stripe.key config');
    }

    if (app()->environment('production') && str_starts_with($key, 'pk_test_')) {
        throw new \RuntimeException('Production billing config has test Stripe key');
    }
}
```

---

## Exceptions

Optional config with safe defaults does not require validation. Only validate keys where absence would cause a crash or security issue.

---

## Consequences Of Violation

Silent null values propagate through the application. Obscure runtime errors at unpredictable points. Production data corruption from test credentials.

---

## Always Run `config:cache` In Production

Feature config files merged via `mergeConfigFrom()` are included in the cached config. Every production deployment must run `php artisan config:cache`.

---

## Category

Performance

---

## Rule

Run `php artisan config:cache` as part of every production deployment. Ensure the deployment process includes this step and that the cache is invalidated when feature config files change.

---

## Reason

Without config caching, every request merges all feature configs into the Laravel repository — a redundant operation. Caching bakes all merged config into a single serialized file with zero per-feature overhead.

---

## Bad Example

```php
// Deployment script omits config:cache
// Every request merges configs for 10+ features
```

---

## Good Example

```yaml
# deployment script
php artisan config:cache
php artisan route:cache
php artisan event:cache
```

---

## Exceptions

Local development environments do not need config caching. Changes to .env or config files require cache refresh, which impedes iteration speed.

---

## Consequences Of Violation

Performance degradation from repeated config merging. `config()` calls are slower. Mixed state between old and new config if cache is stale.

---

## Document All Feature Config Keys

Every configuration key in a feature config file must be documented in the feature's README.

---

## Category

Maintainability

---

## Rule

Maintain a configuration reference table in each feature's README listing every config key, its default value, its purpose, and whether it is required.

---

## Reason

Undocumented config keys create tribal knowledge. Team members (and future AI agents) cannot determine which values are tunable, which are required, and what each does without reading the source.

---

## Bad Example

```php
// No documentation — developers must read the config file and guess
return [
    'stripe_key' => env('BILLING_STRIPE_KEY'),
    'tax_rate' => env('BILLING_TAX_RATE', 0.08),
];
```

---

## Good Example

```markdown
## Configuration

| Key | Default | Required | Description |
|-----|---------|----------|-------------|
| billing.stripe_key | — | Yes | Live Stripe public key |
| billing.tax_rate | 0.08 | No | Default tax rate (decimal) |
```

---

## Exceptions

Features with a single, self-explanatory config key may omit formal documentation if the config file itself contains clear comments.

---

## Consequences Of Violation

Teammates misconfigure features. Onboarding delays as new developers reverse-engineer config intent. AI agents generate incorrect configuration.

---

## Namespace Config Keys With Feature Name

Every config key in a feature must be nested under the feature's namespace key.

---

## Category

Code Organization

---

## Rule

Access feature configuration as `config('feature_name.key')`, never `config('key')`. The first segment of the config key must be the feature name.

---

## Reason

Without namespace nesting, two features could define `config('stripe_key')` and overwrite each other. Namespacing guarantees uniqueness and makes ownership clear in code.

---

## Bad Example

```php
// Accessing without namespace
config('stripe_key');
config('tax_rate');
// Which feature owns these?
```

---

## Good Example

```php
// Namespaced access
config('billing.stripe.key');
config('billing.tax_rate');
```

---

## Exceptions

The `register()` and `boot()` methods in the feature's service provider may use the feature's internal path to read the raw config array directly.

---

## Consequences Of Violation

Config key collisions cause features to read each other's configuration. Silent misconfiguration when two features accidentally define the same key.

---

## Use Feature Flags In Config For Gradual Rollouts

Control feature availability per-environment using boolean config values backed by environment variables.

---

## Category

Reliability

---

## Rule

Define feature flags as boolean config values under a `features` key within the feature config. Default to disabled and enable per-environment via env vars.

---

## Reason

Feature flags allow gradual rollout, A/B testing, and emergency kill-switches without deploying code changes. Environment-specific toggles decouple deployment from release.

---

## Bad Example

```php
// No feature flag — code is always active
if (self::isNewCheckoutReady()) {
    // Hard to disable without deployment
}
```

---

## Good Example

```php
return [
    'features' => [
        'new_checkout' => env('BILLING_NEW_CHECKOUT', false),
        'auto_invoicing' => env('BILLING_AUTO_INVOICING', false),
    ],
];

// Usage
if (config('billing.features.new_checkout')) {
    $this->dispatch(new NewCheckoutJob($order));
}
```

---

## Exceptions

Security-critical features (auth, encryption) should not use feature flags. Compliance-required behavior must always run.

---

## Consequences Of Violation

Deploying incomplete features. Inability to disable problematic code without rollback. Coupling deployment to release cycles.
