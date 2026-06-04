# Hashed Cast

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Last Updated:** 2026-06-02

## Executive Summary
The `hashed` cast automatically hashes attribute values on write (set) using Laravel's `Hash::make()` (typically Bcrypt or Argon2), while returning the already-hashed value as-is on read (get). This is an inbound-only transformation — the cast is a one-way street for secure storage of passwords, API tokens, and other secrets. Introduced in Laravel 10, it replaces the legacy pattern of hashing passwords in mutators or manually before save, ensuring consistent hashing across all write paths including mass-assignment and `update()`.

## Core Concepts
- **Inbound-only hashing:** The `hashed` cast applies `Hash::make()` to the value on write. On read, the stored hash is returned without additional transformation.
- **Hash algorithm:** Defaults to `config('hashing.driver')` which is `'bcrypt'` in Laravel 11 (Bcrypt with cost factor 12). Can be `'argon'` or `'argon2id'`.
- **Auto-hashing on mass-assignment:** Because the cast is declared in `$casts`, mass-assignment (`Model::create()`, `Model::update()`) automatically hashes the value — no mutator needed.
- **No re-hashing:** If the value being set is already a valid Bcrypt/Argon2 hash (detected via `Hash::isHashed()` or string pattern), the cast bypasses hashing to prevent double-hashing.
- **Do not use for data that needs to be retrieved in plaintext:** Hashing is irreversible. Use `encrypted` cast for two-way encryption of sensitive data.

## Mental Models
- **One-Way Valve:** Data enters as plaintext and exits as hash. The original value cannot be recovered from the hash.
- **Idempotent Write Filter:** If the input is already a hash, it passes through unchanged. If it's plaintext, it's hashed. The cast is idempotent for already-hashed values.
- **Password Gatekeeper:** The model attribute acts as a gatekeeper — it only accepts plaintext to transform into hash, never revealing the original.

## Internal Mechanics
1. **Write path:** `Model::setAttribute()` → `hashed` cast's `set()` method → checks if the value is already hashed via `Hash::isHashed($value)` or pattern detection → if not hashed, calls `Hash::make($value)` → stores the hash in `$attributes`.
2. **Read path:** `Model::getAttribute()` → `hashed` cast's `get()` method → returns the stored hash value unchanged.
3. `Hash::make()` uses the configured hashing driver from `config/hashing.php`. Default: Bcrypt with cost 12.
4. `Hash::isHashed()` checks if the value matches the format of a Bcrypt hash (`$2y$...`) or Argon2 hash (`$argon2id$...`).
5. If `Hash::isHashed()` returns true, the cast skips hashing entirely, passing the value through.

## Patterns
- **Password Hashing:** `protected $casts = ['password' => 'hashed']` — the primary use case. Passwords are automatically hashed on set.
- **API Token Hashing:** Hash API tokens (not encrypted) for "remember me" or personal access tokens. The token is validated by comparing the plaintext input against the stored hash.
- **Secret Question Answers:** Hash security question answers so they cannot be recovered even if the database is compromised.
- **Idempotent Update Pattern:** When updating a model, the `hashed` cast ensures that re-saving an already-hashed password (e.g., loading from DB and saving without changes) does not double-hash it.

## Architectural Decisions
- **Decision:** Hashed cast is inbound-only (no get transformation).
  - **Rationale:** Hashing is irreversible. Transforming on read would be impossible. The getter returns the hash for comparison purposes (e.g., `Hash::check($input, $model->password)`).
- **Decision:** Built-in double-hash prevention via `Hash::isHashed()`.
  - **Rationale:** Prevents accidental double-hashing when a model is saved multiple times. Essential for `Model::update()` on existing records where the attribute may already contain a hash.
- **Decision:** No validation of password strength in the cast.
  - **Rationale:** The cast is a persistence concern, not a validation concern. Password strength validation belongs in Form Requests or validation rules.
- **Decision:** Uses the application's default hashing driver.
  - **Rationale:** Consistency — all hashed attributes use the same algorithm and cost factor. Changing the driver in `config/hashing.php` affects all `hashed` casts globally.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Zero-config password hashing via `$casts` | No control over per-attribute hashing cost | All `hashed` attributes share the same algorithm/cost |
| Automatic double-hash prevention | `Hash::isHashed()` check adds ~0.5µs per write | Negligible; hashing itself takes 50-200ms |
| Works with mass-assignment and `update()` | No read-side transformation (returns the hash) | Must use `Hash::check()` for verification |
| Replaces legacy mutator pattern | Cannot customize hashing per attribute beyond driver config | Use a custom mutator for per-attribute cost control |

## Performance Considerations
- **`Hash::make()` is intentionally slow:** Bcrypt cost 12 takes ~50-150ms per hash. Argon2id is similar or slower. This is by design — slow hashing resists brute-force attacks.
- Double-hash prevention (`Hash::isHashed()`) is fast (~0.5µs) — a string prefix check.
- In Octane/queue workers, the hashing factory is reused, but each `Hash::make()` call still takes full cryptographic time.
- For bulk imports of hashed passwords (e.g., migration from another system), pre-hash the values and pass them as already-hashed strings. The cast's `isHashed()` check will skip re-hashing.
- In tests, use `Hash::shouldReceive('make')->andReturn('hashed_value')` to mock the slow hashing call.

## Production Considerations
- **Always use `hashed` cast for passwords.** Do not store plaintext passwords under any circumstances. The `hashed` cast enforces this at the model layer.
- **Configure hashing algorithm thoughtfully.** Bcrypt cost 12 is the Laravel default. For higher security, use Argon2id (resistant to GPU attacks). Higher cost factors increase CPU load on registration endpoints.
- **No plaintext recovery.** If a user forgets their password, implement a password reset flow, not a "recover password" flow. The hashed cast makes plaintext recovery impossible.
- **Hashing is not encryption.** Do not use `hashed` cast for data that needs to be read back in its original form (e.g., email addresses, phone numbers). Use `encrypted` cast instead.
- **Monitor server CPU during registration peaks.** Each registration triggers one `Hash::make()` call. At 100 requests/second, 100 * 100ms = 10 seconds of CPU time per second.
- **Password confirmation in controllers.** The `hashed` cast does not confirm passwords. Always use `password_confirmation` validation rules.

## Common Mistakes
- **Using `hashed` for data that needs to be read back:** Emails, addresses, and names hashed via `hashed` cast are irreversibly lost. Use `encrypted` for two-way protection.
- **Double-hashing by calling `Hash::make()` explicitly before assignment:** `$user->password = Hash::make($request->password)` + `hashed` cast = double hash. Assign plaintext; let the cast handle hashing.
- **Expecting `Hash::check()` to work with an accessor:** `$user->password` returns the hash, not the plaintext. `Hash::check($input, $user->password)` is correct; `$user->password === $input` is not.
- **Not handling empty strings:** Assigning `''` to a `hashed`-cast attribute hashes an empty string. Validate non-empty input before assignment.
- **Changing hashing algorithm after data exists:** Existing hashes use the old algorithm. `Hash::check()` handles this (it detects the algorithm from the hash string), but new hashes will use the new algorithm. Implement re-hashing on successful login if needed.

## Failure Modes
- **Algorithm upgrade breaks existing hashes:** If the `hashing.driver` changes from `'bcrypt'` to `'argon2id'`, new hashes use Argon2id. Existing hashes remain usable via `Hash::check()` (which detects algorithm from hash string). No data loss.
- **Excessively high cost factor causes timeout:** Bcrypt cost 15 takes ~1 second per hash. Set cost to 12 or lower for acceptable registration latency.
- **Double-hash on re-save:** If `Hash::isHashed()` fails to detect a valid hash format (e.g., custom algorithm), the value is hashed again, corrupting the stored data. Override `isHashed()` behavior with a custom cast if needed.
- **Memory exhaustion with Argon2:** Argon2 can consume significant memory (default 64MB). Ensure the PHP memory limit is sufficient.

## Ecosystem Usage
- **Laravel Breeze / Jetstream:** Both use `hashed` cast on the `password` column in their default `User` model.
- **Laravel Passport / Sanctum:** Personal access tokens are hashed before storage. The `hashed` cast pattern is used in Sanctum's `Token` model.
- **Laravel Nova:** The password field in Nova uses `Password::make('password')->onlyOnForms()` to avoid displaying the hash. The `hashed` cast ensures the password is hashed before storage.
- **Laravel API Resources:** The hash is serialized in API responses (not the plaintext). Ensure password attributes are excluded from API output via `$hidden` or resource field filtering.
- **Spatie / Laravel-Permission:** Does not use hashed casts directly, but custom user models often add `hashed` cast for password.

## Related Knowledge Units

### Prerequisites
- [Primitive Casts](../primitive-casts/02-knowledge-unit.md) — the `$casts` system that `hashed` extends.
- [Laravel Hashing](../../../laravel-core-application-engineering/security/hashing-configuration/02-knowledge-unit.md) — how `Hash::make()` and hashing drivers are configured.

### Related Topics
- [Mutator Patterns](../mutator-patterns/02-knowledge-unit.md) — `hashed` cast replaces the legacy hashing mutator pattern.
- [Encrypted Casts](../encrypted-casts/02-knowledge-unit.md) — the two-way counterpart to `hashed` for data that needs to be read back.

### Advanced Follow-up Topics
- [Password Rehashing Strategy](../../../laravel-core-application-engineering/security/password-rehashing/02-knowledge-unit.md) — rehashing passwords on login when algorithm parameters change.
- [Bcrypt vs. Argon2](../../../laravel-core-application-engineering/security/hashing-algorithms/02-knowledge-unit.md) — choosing the right hashing algorithm and cost factor.

## Research Notes
- The `hashed` cast was added in Laravel 10 (PR #41234) as a first-class cast type, transitioning from the community pattern of mutator-based hashing.
- The cast resolves to `Illuminate\Database\Eloquent\Casts\AsHash` which implements `CastsAttributes`.
- `Hash::isHashed()` checks for Bcrypt prefix `$2y$`, `$2x$`, `$2a$` and Argon2 prefix `$argon2id$`, `$argon2i$`, `$argon2d$`. Future hash algorithms must be added to this detection method.
- Laravel's `Hash::check()` automatically identifies the algorithm from the stored hash string, allowing a mix of Bcrypt and Argon2 hashes during algorithm migration.
- Future direction: Laravel may support per-attribute hashing cost configuration in the cast syntax (e.g., `'password' => 'hashed:rounds=15'`).
