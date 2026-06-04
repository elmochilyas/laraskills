# Rules: Deployer PHP

## DEPLOYER-001: Version Pinning
**Condition:** Deployer PHP added as project dependency
**Action:** Pin major version in `composer.json` (e.g., `"deployer/deployer": "^7.0"`)
**Rationale:** Minor version changes include breaking recipe changes
**Consequences:** Violation causes deployment failures on `composer update`

## DEPLOYER-002: Deployment Lock Required
**Condition:** Multi-server or team-based deployment workflow
**Action:** Enable `deploy:lock` to prevent concurrent deployments
**Rationale:** Concurrent deployments corrupt the release directory structure
**Consequences:** Violation causes unrecoverable release directory corruption

## DEPLOYER-003: Migration Ordering
**Condition:** Laravel recipe includes `artisan:migrate` task
**Action:** Run migrations before symlink swap (not after)
**Rationale:** New code expects new schema; running migration after swap creates error window
**Consequences:** Violation serves application errors during migration execution

## DEPLOYER-004: OPcache Reset in Recipe
**Condition:** Deployment recipe configured for Laravel
**Action:** Add OPcache reset task after symlink swap
**Rationale:** Deployer does not auto-reset OPcache; stale opcode causes silent code mismatches
**Consequences:** Violation results in mixed old and new code execution

## DEPLOYER-005: Recipe Version Control
**Condition:** `deploy.php` created for project
**Action:** Store `deploy.php` in version control at repository root
**Rationale:** Recipe is deployment source of truth; must be auditable and recoverable
**Consequences:** Violation creates single point of failure for deployment process

## DEPLOYER-006: .env in Shared Directory
**Condition:** Laravel deployment via Deployer
**Action:** Store `.env` in `shared/` directory, not in release directories
**Rationale:** `.env` is environment-specific and must persist across releases
**Consequences:** Violation requires per-release `.env` configuration, causing deployment failures
