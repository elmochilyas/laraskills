# Anti-Patterns: Module Dependencies

## 1. Hardcoded Secrets in Config Files

Writing API keys and credentials as string literals in feature config files instead of using environment variables.

```php
return [
    'stripe' => [
        'key' => 'pk_live_abc123def456', // Hardcoded — committed to git
        'secret' => 'sk_live_xyz789',      // Exposed to all developers
    ],
];
```

Hardcoded secrets are committed to version control, exposed in CI logs, and accessible to anyone with repository access. Always use `env('FEATURE_SECRET_KEY')` for every sensitive value. Never write secrets as string literals. Validate that production config does not use test credentials.

## 2. Config Merging in register()

Calling `$this->mergeConfigFrom()` in the service provider's `register()` method instead of `boot()`.

```php
public function register(): void
{
    $this->mergeConfigFrom(__DIR__.'/../config.php', 'billing');
    // Other providers may not have registered yet
}
```

During `register()`, config values may not be fully loaded. Accessing `config('feature.*')` in `register()` returns `null`. The `boot()` method runs after all providers have registered, making the merged config available. Config merging must always occur in `boot()`.

## 3. Unnamespaced Config Keys

Accessing feature configuration as `config('stripe_key')` instead of `config('billing.stripe.key')`.

Without namespace nesting, two features could define `config('stripe_key')` and overwrite each other. Namespacing guarantees uniqueness and makes ownership clear in code. Every config key must be nested under the feature's namespace key. Access as `config('feature_name.key')`, never `config('key')`.

## 4. Missing Env Var Prefix

Using bare environment variable names like `STRIPE_KEY` that could collide with other features.

Without prefixes, two features (e.g., Billing and Marketplace) could both define `STRIPE_KEY` with different values, causing an overwrite collision. Prefix all feature-specific environment variables with the feature name in uppercase followed by an underscore: `BILLING_STRIPE_KEY`, `USERS_REGISTRATION_OPEN`.

## 5. No Config Validation at Boot

Merging feature config without validating that required values are present, causing silent null failures later.

Missing config causes runtime errors at unpredictable points. After merging config in `boot()`, validate that all required keys are present and valid. Throw a descriptive `RuntimeException` if required config is missing or uses non-production values in production. Validating at boot provides an immediate, clear failure rather than a confusing error deep in business logic.

## 6. Stale Cached Config

Not re-running `php artisan config:cache` after changing feature config files, causing old values to be served.

Without config caching, every request merges all feature configs into the Laravel repository. With stale caching, old values persist. Run `php artisan config:cache` as part of every production deployment. Ensure the deployment process includes this step and invalidates the cache when feature config files change.

## 7. Undocumented Config Keys

Feature config keys exist with no documentation about their purpose, defaults, or whether they are required.

Undocumented config keys create tribal knowledge. Team members cannot determine which values are tunable, which are required, and what each does without reading the source. Maintain a configuration reference table in each feature's README listing every config key, its default value, its purpose, and whether it is required.
