# Skills: Database Migration CI

## Skill: ci-migration-testing
**Purpose:** Set up migration testing in CI pipeline
**Trigger:** When adding database migration testing to CI
**Workflow:**
1. Configure MySQL/PostgreSQL service container in CI
2. Run `php artisan migrate` against test database
3. Run `php artisan migrate:rollback` to test reversibility
4. Verify migration tracking table state
5. Test with production-like data volume for performance migrations
6. Add migration duration monitoring
**Output:** CI pipeline with database migration testing
