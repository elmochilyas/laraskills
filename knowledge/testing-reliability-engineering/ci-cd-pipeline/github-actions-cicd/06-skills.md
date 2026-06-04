# Skill: Configure GitHub Actions CI for Laravel

## Purpose
Build and maintain GitHub Actions CI workflows for Laravel projects that run tests, enforce code quality, and provide fast, reliable feedback on every PR and push.

## When To Use
- When setting up CI for a new Laravel project
- When migrating from another CI platform to GitHub Actions
- When adding new jobs (linting, static analysis, security checks) to existing CI
- When optimizing CI performance (caching, parallel execution)
- When establishing deployment workflows with CI gates

## When NOT To Use
- For non-Laravel projects (use language-appropriate workflows)
- When the team prefers another CI platform (GitLab CI, CircleCI)
- When the project doesn't need CI (experimental, one-person projects)
- When CI configuration complexity outweighs benefits for very small projects

## Prerequisites
- GitHub repository with the Laravel project
- GitHub Actions enabled for the repository
- Understanding of YAML syntax and workflow configuration
- Database service container configuration (MySQL, PostgreSQL)
- PHP version requirements for the project

## Inputs
- PHP version(s) to test
- Database engine and version
- Node.js version (for frontend assets)
- Caching strategy for Composer and npm
- Code quality tools to run (PHPStan, Laravel Pint, PHP CS Fixer)
- Deployment target configuration (if CI includes deployment)

## Workflow
1. Create `.github/workflows/ci.yml` with trigger configuration
2. Set up PHP: use `shivammathur/setup-php@v2` with extensions and coverage driver
3. Configure MySQL/PostgreSQL service containers with pinned versions
4. Cache Composer dependencies: `actions/cache` with `composer.lock` hash
5. Run `composer install --no-interaction --prefer-dist`
6. Set up environment: copy `.env.example`, generate app key
7. Run migrations: `php artisan migrate`
8. Execute tests: `php artisan test` or `phpunit`
9. Add parallel jobs: linting (Pint/PHP CS Fixer), static analysis (PHPStan), type checking
10. Add coverage job with PCOV and coverage threshold enforcement
11. Configure caching for framework config/route cache to speed up test runs
12. Add deployment job (if applicable) with environment-specific secrets

## Validation Checklist
- [ ] CI runs on push to main and on PRs to main
- [ ] PHP is set up with required extensions (bcmath, pdo_mysql, etc.)
- [ ] Database service containers use pinned versions matching production
- [ ] Composer dependencies are cached for fast installs
- [ ] Tests pass and coverage threshold is enforced
- [ ] Linting and static analysis jobs run in parallel
- [ ] Environment secrets are stored as GitHub Actions secrets (not in code)
- [ ] CI completes in under 15 minutes
- [ ] Failed CI blocks PR merging

## Common Failures
- Not caching Composer dependencies — slow CI runs every time
- Database service container without health check — "connection refused" errors
- Missing PHP extensions — tests fail on database-specific features
- Not pinning tool versions — CI breaks when tools release new major versions
- Using `latest` database tags — unexpected version changes break CI
- Not configuring environment variables — app key missing, sessions fail
- CI running on every push without path filters — unnecessary runs for docs

## Decision Points
- Single PHP version vs matrix — single for simple projects, matrix for compatibility
- GitHub-hosted vs self-hosted runners — hosted for simplicity, self-hosted for custom hardware
- Sequential vs parallel jobs — parallel for fast feedback, sequential when jobs have dependencies

## Performance Considerations
- Cache Composer and npm dependencies to reduce install time from 2-3 minutes to <30s
- Use PCOV instead of Xdebug for faster coverage collection
- Parallelize independent jobs (tests, linting, static analysis)
- Use `--prefer-dist` for Composer to download packages instead of building from source
- Consider test sharding for suites exceeding 10 minutes
- Limit CI concurrency for cost management on hosted runners

## Security Considerations
- Store secrets (API keys, database passwords) as GitHub Actions secrets
- Never hardcode secrets in workflow files or environment variables
- Limit CI workflow permissions to the minimum required scope
- Review third-party actions for security (use pinned versions with SHA hashes)
- Ensure CI artifacts don't contain sensitive environment data
- Use `GITHUB_TOKEN` with minimal permissions (read:contents, write:checks)

## Related Rules
- [Rule: Cache Dependencies for Fast CI](./05-rules.md)
- [Rule: Pin All Tool and Service Versions](./05-rules.md)
- [Rule: Store Secrets as Encrypted CI Variables](./05-rules.md)

## Related Skills
- Matrix Testing
- Parallel Sharding
- Path-Based Triggering

## Success Criteria
- [ ] CI workflow is configured and passing on the default branch
- [ ] Tests, linting, and static analysis run automatically on PRs
- [ ] CI completes within acceptable time limits (<15 minutes for hosted runners)
- [ ] Failed CI prevents merging PRs (branch protection rules)
- [ ] Composer and npm caches are working and reducing install times
