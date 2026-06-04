# Anti-Patterns: .env Management and APP_KEY

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Secrets Management |
| Knowledge Unit | .env Management and APP_KEY |
| Audience | All Developers, DevOps, Platform Engineers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SE-01 | Committed .env to Version Control | Critical | High | Low |
| AP-SE-02 | Shared APP_KEY Across Environments | Critical | High | Medium |
| AP-SE-03 | Manual APP_KEY Without key:generate | High | Medium | Low |
| AP-SE-04 | env() Calls in Application Code | Medium | High | Medium |
| AP-SE-05 | No .env.example or Outdated Template | Medium | High | Low |

---

## Repository-Wide Anti-Patterns

- **APP_KEY Pasted in Slack/Email**: Sharing keys via insecure channels — use password manager or Vault
- **No config:cache in Deployment Pipeline**: Production serves every request with uncached config, reading .env each time
- **APP_DEBUG=true in Production**: Exposes .env values in error pages — high-severity data leak

---

## 1. Committed .env to Version Control

### Category
Security · Critical

### Description
The `.env` file containing database credentials, APP_KEY, API keys, and other secrets is committed to the Git repository and pushed to the remote, exposing all secrets to anyone with repository access.

### Why It Happens
The `.env` file is created during `laravel new project` setup. Developers forget to add it to `.gitignore` before the first commit. The initial commit contains `.env`, and by the time it is noticed, the file is already in Git history. Even after adding it to `.gitignore`, the file remains in historical commits.

### Warning Signs
- Running `git status` shows `.env` is tracked (not ignored)
- `.env` appears in GitHub file browser or PR diffs
- Secrets from `.env` are visible in CI/CD logs or exposed via repository search
- New developers can clone the repo and immediately run the app without creating their own `.env`

### Why Harmful
Once `.env` is committed, every collaborator, CI runner, and repository fork has permanent access to all secrets. Git history preserves the file even after it is removed. Private repositories do not prevent exposure — all developers with access, any compromised CI token, and any past collaborator can read the secrets. Database passwords, APP_KEY, API keys, and mail credentials are all exposed.

### Real-World Consequences
- Attacker gains access to private repository, extracts production database credentials, exfiltrates data
- Former employee with repository clone accesses production services using credentials from `.env`
- CI/CD pipeline compromises where the runner has repo access — `.env` secrets available to attacker
- Compliance violation (PCI DSS, HIPAA) — sensitive data exposed in source control

### Preferred Alternative
Add `.env` to `.gitignore` from project initialization and use `.env.example` as a template:
```gitignore
# .gitignore
.env
.env.*.local
```
```bash
# New developer setup
cp .env.example .env
php artisan key:generate
```

### Refactoring Strategy
1. Immediately rotate ALL secrets that were in the committed `.env` (APP_KEY, DB passwords, API keys)
2. Remove `.env` from Git tracking: `git rm --cached .env`
3. Add `.env` to `.gitignore`
4. Purge `.env` from Git history using `git filter-branch` or BFG Repo-Cleaner
5. Force-push cleaned history (coordinate with team — destroys existing clones)
6. Verify: `git log --diff-filter=A -- .env` returns nothing

### Detection Checklist
- [ ] Check `git ls-files .env` — does it show the file as tracked?
- [ ] Search GitHub/Azure DevOps for `.env` in repo (use secret scanning)
- [ ] Review first commit — was `.env` included?
- [ ] Run `git log --oneline -- .env` to see if .env was ever committed

### Related Rules/Skills/Trees
- Never Commit .env to Version Control (05-rules.md)
- Generate and Secure the Laravel APP_KEY (06-skills.md)
- .env File vs Secrets Manager decision tree (07-decision-trees.md)

---

## 2. Shared APP_KEY Across Environments

### Category
Security · Critical

### Description
Using the same `APP_KEY` in development, staging, and production environments, allowing encrypted data from any environment to be decrypted in any other.

### Why It Happens
Developers copy `.env` from local to production for convenience. The production deployment process may simply replicate the development `.env`. CI/CD pipelines sometimes inject the same key into all environments. Teams do not realize that APP_KEY is the root encryption key — sharing it between environments nullifies environment isolation.

### Warning Signs
- `.env.production` has the same `APP_KEY` as `.env.local`
- Deployment script copies the same `.env` to all environments
- Running `php artisan key:generate` in staging shows the same key as production
- Encrypted data from staging can be decrypted using the local APP_KEY

### Why Harmful
APP_KEY encrypts sessions, cookies, encrypted model fields, signed URLs, and queue data. A shared APP_KEY means:
- A developer can decrypt production session data using their local key
- Staging and production share encryption contexts — cross-environment data leaks
- Compromising one environment's `.env` exposes all environments' encrypted data
- Compliance audit fails: "No encryption key isolation between environments"

### Real-World Consequences
- Developer decrypts production user sessions locally — privacy violation
- Staging encrypted data accidentally restored to production — decrypted with wrong key context
- Local machine compromise exposes all environments' encrypted data
- Penetration test finds that staging APP_KEY decrypts production cookies

### Preferred Alternative
Generate a unique APP_KEY per environment using `php artisan key:generate`:
```bash
# On each environment
php artisan key:generate
```
```dotenv
# .env.local
APP_KEY=base64:abc123...
# .env.staging
APP_KEY=base64:def456...
# .env.production
APP_KEY=base64:ghi789...
```

### Refactoring Strategy
1. Generate new APP_KEYs for staging and production (separately)
2. Plan a key rotation window for production (will invalidate sessions, cookies, encrypted data)
3. For production: re-encrypt all encrypted model data with the new key
4. Update deployment scripts to generate environment-specific keys
5. Verify: decrypt a production session with development key — must fail

### Detection Checklist
- [ ] Compare `APP_KEY` values across `.env.local`, `.env.staging`, `.env.production`
- [ ] Check deployment scripts for key generation step (should NOT copy key)
- [ ] Can you decrypt production data with the development APP_KEY?
- [ ] Verify `.env.example` does NOT contain a real base64 key (placeholder only)

### Related Rules/Skills/Trees
- Generate APP_KEY via `php artisan key:generate` for Every Environment (05-rules.md)
- Use Production-Grade Secret Storage in Production (05-rules.md)
- .env File vs Secrets Manager decision tree (07-decision-trees.md)

---

## 3. Manual APP_KEY Without key:generate

### Category
Security · Reliability

### Description
Manually creating an APP_KEY string instead of using `php artisan key:generate`, resulting in a weak, malformed, or incorrect-length key.

### Why It Happens
Developers in a hurry copy an APP_KEY from Stack Overflow, generate a random string from an online tool, or use a short memorable string. They do not know that Laravel expects a specific format (`base64:` prefix + 32-byte base64-encoded string). The `php artisan key:generate` command is skipped because "it's just an encryption key" or "the app works without it."

### Warning Signs
- APP_KEY does not start with `base64:`
- APP_KEY is shorter than 44 characters (32 bytes base64-encoded)
- Application logs show `RuntimeException: Incorrect key length` or encryption failures
- `Crypt::encryptString()` produces different output lengths than expected
- Running `php artisan key:generate` shows the key was already set but malformed

### Why Harmful
A malformed APP_KEY either causes silent encryption failures (data stored unencrypted when intended to be encrypted), weak encryption (trivially brute-forcible), or runtime exceptions. Laravel's encryption expects exactly a 256-bit AES key. A shorter key means weaker encryption; missing the `base64:` prefix means Laravel cannot parse the key at all. Data encrypted with a weak key is decryptable by attackers with minimal resources.

### Real-World Consequences
- Encrypted model fields store plaintext because the malformed key causes silent fallback
- All "encrypted" sessions are trivially decodable (vulnerable to session hijacking)
- Application crashes with `DecryptException` on every encrypted cookie read
- Security audit finds APP_KEY is `"abc123"` — zero encryption strength

### Preferred Alternative
Always use `php artisan key:generate` and verify the format:
```bash
php artisan key:generate
# Result: APP_KEY=base64:AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890AbCdEf12==
```

### Refactoring Strategy
1. Generate a proper APP_KEY with `php artisan key:generate`
2. Re-encrypt all existing encrypted data (any data encrypted with the malformed key is likely already compromised or unreadable)
3. Rotate all sessions (force logout all users)
4. Verify `Crypt::encryptString('test')` produces consistent ciphertext format

### Detection Checklist
- [ ] Check APP_KEY format in `.env`: must start with `base64:` and be ~44 chars
- [ ] Run `php artisan key:generate --show` and compare length to current key
- [ ] Test `Crypt::encryptString()` / `Crypt::decryptString()` round-trip
- [ ] Verify no `DecryptException` in application logs

### Related Rules/Skills/Trees
- Set APP_KEY Length and Format Correctly (05-rules.md)
- Generate APP_KEY via `php artisan key:generate` for Every Environment (05-rules.md)
- Generate and Secure the Laravel APP_KEY (06-skills.md)

---

## 4. env() Calls in Application Code

### Category
Architecture · Performance

### Description
Using the `env()` helper directly in application code (controllers, services, middleware) instead of reading from config files, preventing config caching and introducing performance overhead.

### Why It Happens
The `env()` helper is convenient and directly accessible from anywhere in the codebase. Developers use it for quick access to environment-specific values without the "overhead" of creating a config entry. Laravel's documentation recommends `config()` in app code, but the `env()` function works — so teams do not enforce the distinction.

### Warning Signs
- Search of `app/` and `routes/` directories shows `env()` calls
- Running `php artisan config:cache` causes `env()` calls in application code to return `null`
- Config caching is not used in production because "it breaks the app"
- Environment variables hardcoded with fallback values in application logic

### Why Harmful
When `config:cache` is enabled (as it should be in production), all `env()` calls are frozen at cache-build time. Any `env()` call in application code that is not wrapped in a config file returns `null` after caching, causing silent failures or unexpected behavior. This forces teams to choose between config caching (performance + security) and keeping direct env access (convenience). The correct approach is to define config values in config files and use `config()` in application code.

### Real-World Consequences
- After `php artisan config:cache`, half the application stops working because `env('SOME_VAR')` returns null
- Team disables config caching in production to "fix" bugs, losing performance and exposing .env file
- Emergency deployment reverts config cache, causing application state inconsistency
- New developer copies `env()` pattern from existing code, perpetuating the issue

### Preferred Alternative
Define config values in `config/` files and use `config()` in application code:
```php
// config/services.php
return [
    'stripe' => [
        'secret' => env('STRIPE_SECRET'),
    ],
];

// Application code (controllers, services)
$stripeSecret = config('services.stripe.secret'); // Cacheable
```

### Refactoring Strategy
1. Search for all `env()` calls in `app/`, `routes/`, `database/`, `resources/`
2. For each: add the config entry to the appropriate `config/*.php` file
3. Replace `env('VAR', 'default')` with `config('file.key', 'default')`
4. Run `php artisan config:cache` and verify app still works
5. Add CI lint rule: forbid `env()` outside `config/` directory

### Detection Checklist
- [ ] `grep -r "env(" app/ routes/ database/ resources/` — count occurrences outside config/
- [ ] Run `php artisan config:cache` then test application — any null returns?
- [ ] Review deployment pipeline — is config:cache part of the deploy script?
- [ ] Check if config:cache is skipped due to "env() in app code" issues

### Related Rules/Skills/Trees
- Use `env()` Only in Config Files, Not Application Code (05-rules.md - implied)
- Generate and Secure the Laravel APP_KEY (06-skills.md)
- config:cache vs No Cache decision tree (07-decision-trees.md)

---

## 5. No .env.example or Outdated Template

### Category
Maintainability · Process

### Description
Not maintaining a `.env.example` file, or keeping one that is missing required environment variables, misaligned with the current configuration.

### Why It Happens
The `.env.example` is created once during `laravel new` and never updated. As the project grows and new config values are added (new services, new API keys, new feature flags), developers add them directly to their `.env` without updating `.env.example`. The example file becomes increasingly stale until it is useless.

### Warning Signs
- `.env.example` does not exist in the repository
- Comparing `.env.example` to a fresh `.env` shows missing variables
- New developers spend hours debugging because `.env.example` is missing required variables
- Pull requests add new `env()` calls without corresponding `.env.example` updates

### Why Harmful
Without an accurate `.env.example`, every new developer must reverse-engineer which environment variables the application requires. This leads to incomplete `.env` files, runtime errors, wasted debugging time, and secrets accidentally committed to version control (developers may copy a colleague's full `.env` instead of creating one from scratch).

### Real-World Consequences
- New developer spends a full day configuring the app because `.env.example` is incomplete
- Developer copies production `.env` to local to figure out what's needed — production secrets now in local environment
- CI pipeline fails because `.env.example` is missing a critical variable added in a recent PR
- Onboarding documentation includes "ask the team for which env vars are needed"

### Preferred Alternative
Maintain a complete `.env.example` with placeholder values and documentation comments:
```dotenv
APP_NAME=Laravel
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=

# Stripe (optional — remove comment when configured)
# STRIPE_KEY=
# STRIPE_SECRET=
```

### Refactoring Strategy
1. Compare `.env.example` to a complete development `.env` — identify missing variables
2. Add all missing variables to `.env.example` with placeholder values
3. Document each variable with a comment (required, optional, expected format)
4. Add a CI check: `diff <(sort .env.example | grep -v '^#') <(sort .env | grep -v '^#' | sed 's/=.*$/=/')` should show expected differences
5. Establish a PR policy: any new `env()` call requires `.env.example` update

### Detection Checklist
- [ ] Does `.env.example` exist in the repository?
- [ ] Compare `.env.example` keys against all `env()` calls in config files — any missing?
- [ ] Can a new developer clone the repo, copy `.env.example` to `.env`, and run the app?
- [ ] Are there commented-out variables in `.env.example`? (Good practice for optional values)

### Related Rules/Skills/Trees
- Never Commit .env to Version Control (05-rules.md)
- Generate and Secure the Laravel APP_KEY (06-skills.md)
- .env File vs Secrets Manager decision tree (07-decision-trees.md)
