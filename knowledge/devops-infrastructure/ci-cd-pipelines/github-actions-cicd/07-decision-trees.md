# Decision Trees: GitHub Actions CI/CD

## CI/CD Platform Selection

**Is code hosted on GitHub?**
- Yes → Use GitHub Actions
- No → Use native CI of hosting platform (GitLab CI, Bitbucket Pipelines)

**Is self-hosted runner required?**
- Yes → GitHub Actions supports self-hosted runners
- No → GitHub-hosted runners are simpler

## Test Strategy

**Database testing required?**
- Yes → Use service containers (MySQL/PostgreSQL) or SQLite for unit tests
- No → Skip service containers, faster workflow

**Deployment trigger:**
- Push to main → Auto-deploy to staging
- Tag/Release → Auto-deploy to production
- Manual workflow_dispatch → Deploy on demand
