# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: CI/CD Pipeline Integration
## Knowledge Unit: Matrix Testing (PHP x Database)

---

### Tree 1: Matrix Scope — Full vs Reduced

```mermaid
flowchart TD
    A[Choose matrix scope] --> B{CI run type?}
    B -->|Pull request — fast feedback| C[Reduced matrix — production PHP + production DB only]
    B -->|Merge to main — compatibility gate| D[Full matrix — all PHP versions x all DB engines]
    B -->|Nightly — comprehensive scan| E[Full matrix — same as merge, ran on schedule]
    A --> F{Project type?}
    F -->|Application — known production env| G[Targeted — production + 1 adjacent PHP version + production DB]
    F -->|Package/library — unknown consumers| H[Broad — 3-4 PHP versions x 2-3 DB engines]
    A --> I{CI minute budget?}
    I -->|Generous — unlimited minutes| J[Full matrix always — maximum coverage]
    I -->|Limited — constrained budget| K[Reduced matrix — prioritize production-equivalent cell]
    A --> L{Database engines<br>to cover?}
    L -->|MySQL only| M[Single DB — simpler matrix, less coverage]
    L -->|MySQL + PostgreSQL| N[Two engines — catches DB-specific behavioral differences]
    L -->|Also SQLite| O[Optional — useful for local dev compatibility]
```

**Key decision points:**
- **PR vs merge**: Reduced matrix on PRs (fast feedback). Full matrix on merge (comprehensive gate).
- **Application vs package**: Applications target known production environments. Packages need broader coverage.
- **Database engines**: MySQL + PostgreSQL catch behavioral differences not found with SQLite alone.

---

### Tree 2: PHP Version Selection

```mermaid
flowchart TD
    A[Choose PHP versions for matrix] --> B{Current production<br>PHP version?}
    B -->|PHP 8.2| C[Include: 8.2 (production), 8.3 (next), optionally 8.4 (future)]
    B -->|PHP 8.3| D[Include: 8.3 (production), 8.4 (next), optionally 8.2 (LTS)]
    B -->|PHP 8.4| E[Include: 8.4 (production), optionally 8.3 (previous)]
    A --> F{Deprecation tracking?}
    F -->|Yes — proactive| G[Always include one version ahead of production]
    F -->|No — reactive| H[Production version only — risk of surprise during upgrade]
    A --> I{Upgrade frequency?}
    I -->|Frequent — stay current| J[2-3 versions — easy to maintain, small diffs]
    I -->|Rare — stay on LTS| K[1-2 versions — focus on production compatibility]
    A --> L{EOL versions?}
    L -->|Include for backward compat| M[Package/library — broadest support]
    L -->|Don't include EOL| N[Application — only actively supported PHP versions]
```

**Key decision points:**
- **Production + 1 ahead**: Minimum for deprecation tracking. Catches warnings before the upgrade.
- **Proactive deprecation tracking**: Include the next PHP version. Surface deprecations one PR at a time.
- **EOL versions**: Packages should support EOL versions. Applications should only support actively supported versions.

---

### Tree 3: Database Engine Selection

```mermaid
flowchart TD
    A[Choose database engines] --> B{Production database?}
    B -->|MySQL| C[Mandatory: MySQL matching production version]
    B -->|PostgreSQL| D[Mandatory: PostgreSQL matching production version]
    B -->|SQLite only (rare)| E[Use SQLite — but verify if app has production DB requirements]
    A --> F{Additional engines<br>for coverage?}
    F -->|Yes — high compatibility needs| G[Add PostgreSQL if MySQL is production, or vice versa]
    F -->|No — production only| H[Production engine only — simpler matrix]
    A --> I{Version selection?}
    I -->|Pinned version| J[image: mysql:8.0 — stable, matches production]
    I -->|Latest tag| K[AVOID — latest breaks CI on new DB releases]
    A --> L{Service container<br>or external DB?}
    L -->|Service container| M[Preferred — isolated, fresh per job, version-pinned]
    L -->|External DB| N[Avoid — shared state, flaky, non-reproducible]
```

**Key decision points:**
- **Production engine is mandatory**: Always include the exact production database version.
- **Additional engine for high-compatibility**: Add the other engine if the app might migrate or support both.
- **Pin versions**: Never use `latest` tags. Pin to exact versions matching production.

---

### Tree 4: Matrix Include/Exclude Logic

```mermaid
flowchart TD
    A[Configure matrix include/exclude] --> B{Need specific<br>config per cell?}
    B -->|Yes — version-specific DB images| C[Use include — add PHP+DB combo with specific config]
    B -->|No — uniform config across cells| D[No include needed — same config applies to all]
    A --> E{Exclude specific<br>combinations?}
    E -->|Yes — incompatible combo| F[Use exclude sparingly — documented reason required]
    E -->|No — test all combinations| G[Best — maximum coverage, no blind spots]
    A --> H{Example include?}
    H -->|PHP 8.3 + MySQL 8.0 production| I[include: php: 8.3, db: mysql, db-version: '8.0']
    I -->|PHP 8.4 + PostgreSQL 16| J[include: php: 8.4, db: pgsql, db-version: '16']
    A --> K{Exclude reason?}
    K -->|Extension not available| L[Valid — documented, unavoidable]
    K -->|"Not in production"| M[Invalid — exclude hides bugs; add a comment explaining risk]
```

**Key decision points:**
- **Include for specific config**: Use `include` to add version-specific database images or extension configs.
- **Exclude sparingly**: Each exclude creates a blind spot. Document reasons and risks.
- **Test all combinations**: Without excludes, the matrix provides maximum compatibility coverage.
