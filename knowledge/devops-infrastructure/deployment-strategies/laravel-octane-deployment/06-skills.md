# Skills: Laravel Octane Deployment

## Skill: octane-migration-audit
**Purpose:** Audit existing Laravel codebase for Octane compatibility
**Trigger:** When migrating an existing PHP-FPM application to Octane
**Workflow:**
1. Scan for static properties and global state
2. Identify singleton service pattern usage
3. Check for `$_SERVER`, `$_GET`, `$_POST` superglobal usage
4. Audit blocking I/O in request lifecycle
5. Review service provider boot logic for side effects
6. Verify queue configuration for worker separation
7. Generate migration report with issue list and remediation
**Output:** Octane compatibility audit report with prioritized remediation items

## Skill: octane-deployment-pipeline
**Purpose:** Configure deployment pipeline for Octane with built-in ZDD
**Trigger:** When setting up CI/CD for an Octane-based Laravel application
**Workflow:**
1. Build application with Composer optimization
2. Run tests against Octane server (require additional testing)
3. Deploy code to production
4. Run `php artisan octane:reload` for zero-downtime reload
5. Verify health check after reload
6. Monitor worker memory for leak detection
**Output:** CI/CD pipeline with Octane-specific zero-downtime deployment
