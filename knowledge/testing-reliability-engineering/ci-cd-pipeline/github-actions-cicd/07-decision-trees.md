# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: CI/CD Pipeline Integration
## Knowledge Unit: GitHub Actions CI/CD for Laravel

---

### Tree 1: CI Pipeline Stage Order

```mermaid
flowchart TD
    A[Design CI pipeline stages] --> B{Fast feedback priority?}
    B -->|Yes — fail fast| C[Lint (2-10s) → Static analysis (2-5min) → Test (5-15min) → Deploy]
    B -->|No — simplicity| D[Single job: lint → analysis → test → deploy (sequential)]
    A --> E{Sequential or<br>parallel?}
    E -->|Sequential with dependencies| F[Lint → needs:lint → Static analysis → needs:static-analysis → Test → needs:test → Deploy]
    E -->|Parallel independent| G[Lint and Static analysis run in parallel → Test needs both → Deploy needs Test]
    A --> H{Deployment stage?}
    H -->|Yes — auto-deploy from main| I[Add deploy job: needs: test, environment: production, if: github.ref == 'refs/heads/main']
    H -->|No — manual deploy| J[Pipeline ends after test stage]
    A --> K{Artifact upload?}
    K -->|Yes — coverage, screenshots| L[Upload after test stage — retention: 7 days]
    K -->|No| M[Faster pipeline — no artifact upload time]
```

**Key decision points:**
- **Fastest feedback**: Sequential gates (lint fails in seconds, not minutes).
- **Dependency chain**: Lint → Static analysis → Test → Deploy. Each stage blocks the next.
- **Deployment**: Only from main branch after successful test stage. Use `environment: production` with required reviewers.

---

### Tree 2: Caching Strategy

```mermaid
flowchart TD
    A[Configure CI caching] --> B{Dependency type?}
    B -->|Composer — PHP dependencies| C[Cache vendor/ with composer.lock hash key]
    B -->|npm — frontend dependencies| D[Cache node_modules/ with package-lock.json hash key]
    B -->|Composer global cache| E[Cache ~/.composer/cache — speeds up composer install]
    A --> F{Cache key strategy?}
    F -->|Lock file hash| G[Best — invalidates when dependencies change]
    F -->|Package.json hash| H[Good — less precise than lock file, may miss transitive deps]
    F -->|Restore keys| I[Fallback: use previous lock file cache if exact match not found]
    A --> J{Matrix caching?}
    J -->|Matrix — multiple PHP versions| K[Cache key includes PHP version — different PHP, different binary compatibility]
    J -->|Single PHP version| L[Simple cache key — just lock file hash]
    A --> M{Hit rate<br>improvement?}
    M -->|composer.lock changes rarely| N[High hit rate — cache is very effective]
    M -->|composer.lock changes frequently| O[Lower hit rate — still worth caching for partial matches]
```

**Key decision points:**
- **Composer cache**: Highest ROI for Laravel CI. Reduces dependency install from 30-60s to 5-10s.
- **Cache key**: Use `composer.lock` hash for precision. Include PHP version in matrix caching.
- **npm/frontend**: Cache separately if the project builds frontend assets.

---

### Tree 3: GitHub-Hosted vs Self-Hosted Runners

```mermaid
flowchart TD
    A[Choose runner type] --> B{CI minutes per month?}
    B -->|Within free tier — 2000 min/mo| C[GitHub-hosted — no management overhead]
    B -->|Exceeds free tier — 5000+ min/mo| D[Consider self-hosted — cost savings at scale]
    A --> E{Hardware requirements?}
    E -->|Standard — 2-4 vCPU, 7GB RAM| F[GitHub-hosted — standard specs sufficient]
    E -->|Specialized — GPU, more RAM, storage| G[Self-hosted — custom hardware configuration]
    A --> H{Compliance?}
    H -->|Standard — no special requirements| I[GitHub-hosted — compliant for most projects]
    H -->|Strict — data residency, audit| J[Self-hosted — full control over environment]
    A --> K{Maintenance capacity?}
    K -->|Available — DevOps/Platform team| L[Self-hosted feasible — team manages runners]
    K -->|Not available — small team| M[GitHub-hosted — zero maintenance overhead]
```

**Key decision points:**
- **GitHub-hosted for most teams**: Zero maintenance, within free tier for small-medium projects.
- **Self-hosted for scale or compliance**: Large test suites, custom hardware, or strict data residency.
- **Maintenance**: Self-hosted runners require ongoing management (updates, security patches).

---

### Tree 4: Secret Management

```mermaid
flowchart TD
    A[Manage CI secrets] --> B{Secret type?}
    B -->|Environment — APP_KEY, DB_PASSWORD| C[GitHub Actions secrets — encrypted, masked in logs]
    B -->|Deploy — SSH keys, API tokens| D[GitHub Actions secrets with environment protection]
    B -->|Third-party — payment API keys| E[GitHub Actions secrets — rotated regularly]
    A --> F{Secret exposure risk?}
    F -->|Hardcoded in workflow YAML| G[DANGEROUS — visible to all repo users, in git history]
    F -->|In .env file committed| H[DANGEROUS — .env must be in .gitignore]
    F -->|GitHub Actions secrets| I[Safe — encrypted, masked, role-restricted]
    A --> J{Environment protection?}
    J -->|Required — production deploy| K[environment: production with required reviewers]
    J -->|Not required — dev/staging| L[Standard secrets — no approval gate]
    A --> M{Rotation schedule?}
    M -->|Regular — quarterly| N[Best practice — limits breach window]
    M -->|Ad-hoc — when compromised| O[Reactive — risk of prolonged exposure]
```

**Key decision points:**
- **Never hardcode secrets**: Use GitHub Actions secrets for all sensitive values.
- **Environment protection**: Production deploy secrets should require approval.
- **Rotation**: Regular secret rotation limits the impact of any credential leak.
