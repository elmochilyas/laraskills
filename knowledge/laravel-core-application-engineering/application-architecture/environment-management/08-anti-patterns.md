# ECC Anti-Patterns — Environment Management

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Environment Management |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. `env()` as Application Configuration (Using `env()` Outside Config Files)
2. Committing `.env` to Version Control (Secrets in Repository)
3. Production Without `config:cache` (Environment Read on Every Request)
4. Missing env() Default Values (Null Without Fallback)

---

## Repository-Wide Anti-Patterns

- Duplicate `.env` Values (same env var defined in multiple config files)
- Hardcoded Production Values (no use of environment variables for env-specific values)

---

## Anti-Pattern 1: `env()` as Application Configuration

### Category
Framework Usage

### Description
Calling `env('APP_DEBUG')` directly in controllers, services, or Blade views instead of `config('app.debug')`.

### Why It Happens
The `env()` helper is globally available and convenient in development where there is no config cache.

### Warning Signs
- `env(` found outside `config/` directory
- Application works in development but certain features silently misbehave in production
- After `config:cache`, checks like `env('APP_DEBUG')` always return `null`
- PHPStan/Psalm rule for `env()` is not configured

### Why It Is Harmful
After `php artisan config:cache`, environment variables are no longer read at runtime. `env()` in application code returns `null` silently, causing production-only bugs that are impossible to reproduce locally because `config:cache` is not run in development.

### Real-World Consequences
- `env('STRIPE_KEY')` returns `null` in production → payment failures
- `env('APP_DEBUG')` returns `null` → error pages always disabled
- `env('DB_HOST')` returns `null` → mysterious connection errors
- Bug cannot be reproduced in development

### Detection Checklist
- [ ] Search `app/`, `routes/`, `resources/`, `database/` for `env(`
- [ ] Check Blade template files
- [ ] Add PHPStan/Psalm rule banning `env()` outside config

### Refactoring Strategy
1. Search codebase for `env(` in non-config files
2. For each occurrence, identify the correct config key
3. If no config file defines it, add `'key' => env('VARIABLE', default)` to the appropriate config file
4. Replace `env('VARIABLE', default)` with `config('file.key', default)`
5. Run `config:cache` to verify

### Related Rules
- Rule: Use env() Only in Config Files
- Rule: Always Provide Default Values for env() Calls

---

## Anti-Pattern 2: Committing `.env` to Version Control

### Category
Security

### Description
The `.env` file is accidentally committed to git, exposing database passwords, API keys, and secrets in the repository history.

### Why It Happens
`.gitignore` was not configured before the first commit, or `git add .` included `.env` without checking.

### Warning Signs
- `.env` file appears in git history
- Secrets visible in pull request diffs or CI logs
- GitHub/GitLab secret scanning alerts on the repository

### Why It Is Harmful
Secrets in version control are accessible to everyone with repository access. They cannot be removed from history without force-push or rewriting git history. Secrets may be exposed in forks, CI logs, or public mirrors.

### Refactoring Strategy
1. Rotate all compromised secrets immediately (change passwords, regenerate API keys)
2. Add `.env` to `.gitignore`
3. Remove `.env` from git history with `git rm --cached .env`
4. Use `.env.example` with placeholder values as the committed template
5. Consider using git filter-branch or BFG Repo-Cleaner to remove secrets from history

### Related Rules
- Rule: Never Commit .env to Version Control

---

## Anti-Pattern 3: Production Without `config:cache`

### Category
Performance

### Description
Running a production Laravel application without `php artisan config:cache`, causing `.env` file reading and config file parsing on every request.

### Why It Happens
Deployment scripts don't include the cache command. Developers are unaware that config caching is a standard production requirement.

### Warning Signs
- `bootstrap/cache/config.php` does not exist in production
- Deployment script has no `config:cache` step
- Response times are measurably slower than local benchmarks

### Preferred Alternative
Include `php artisan config:cache` in every production deployment script.

### Related Rules
- Rule: Run php artisan config:cache in Production

---

## Anti-Pattern 4: Missing env() Default Values

### Category
Reliability

### Description
Calling `env('DB_HOST')` without a second parameter, so the value defaults to `null` when not set.

### Why It Happens
The developer assumes the environment variable is always present.

### Warning Signs
- `env('VARIABLE')` without a second argument
- Config array entries are `null` when the env var is not set
- Type errors or connection failures when env var is missing

### Preferred Alternative
Always provide a sensible default: `env('DB_HOST', '127.0.0.1')`. For required values, add validation after the assignment.

### Related Rules
- Rule: Always Provide Default Values for env() Calls
