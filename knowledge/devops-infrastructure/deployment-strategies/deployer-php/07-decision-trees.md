# Decision Trees: Deployer PHP

## Deployment Tool Selection

**Budget for deployment tool:**
- $0 → Deployer PHP (free, open-source)
- Willing to pay → Evaluate Envoyer vs Deployer

**CI/CD integration required:**
- Yes → Deployer works with any CI system (GitHub Actions, GitLab CI)
- No → Both Deployer and Envoyer work equally well

**Self-hosted requirement:**
- Yes → Deployer (self-hosted, no external service dependency)
- No → Both options viable

**PHP ecosystem integration:**
- Important → Deployer (native PHP recipe, Laravel-specific tasks)
- Not important → Generic deployment tools also viable

## Migration Ordering Decision

**Is this a standard schema change (add column, create table)?**
- Yes → Migrate before symlink swap (standard pattern)
- No → Proceed

**Is this a destructive change (drop column, rename table)?**
- Yes → Use expand-migrate-contract pattern across 3 deployments
- No → Standard migrate before swap is safe

**Is zero-downtime required during migration?**
- Yes → Use pt-online-schema-change or gh-ost
- No → Standard migration is acceptable
