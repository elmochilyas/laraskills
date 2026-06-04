# 07-Decision Trees: Pint CI Integration

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | pint-ci-integration |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | CI Mode | Gate vs auto-fix enforcement | Do we fail the build or auto-fix formatting issues in CI? |
| D02 | Caching Strategy | Whether to cache Pint/ PHP-CS-Fixer tokens | Is CI speed critical enough to warrant cache configuration? |
| D03 | Annotation Format | Which output format for CI feedback | How do developers see formatting errors from CI? |
| D04 | Pipeline Positioning | Where to place Pint in the CI workflow | Should Pint run before or after other quality tools? |

## Architecture-Level Decision Trees

### D01: CI Mode

```
START: How should Pint behave in CI?
│
├── Gate mode (pint --test)
│   ├── Exit 1 if formatting issues found → blocks PR
│   ├── Pro: strict enforcement, clean codebase
│   ├── Con: dev must fix locally and re-push
│   ├── Team must: have pre-commit or local formatting habit
│   └── Best for: disciplined teams, production code
│
├── Auto-fix mode (pint then pint --test)
│   ├── CI runs pint (fixes files) then pint --test (verifies)
│   ├── CI commits fixed files back to PR branch
│   ├── Pro: zero developer friction
│   ├── Con: double CI time, requires Git config
│   └── Best for: teams building formatting habits
│
└── Hybrid (recommended)
    ├── Gate on every PR (pint --test)
    ├── Weekly scheduled auto-fix PR for accumulated issues
    └── Local pre-commit with --dirty for instant feedback
```

### D02: Caching Strategy

```
START: Should we cache Pint's PHP-CS-Fixer tokens in CI?
│
├── No caching
│   ├── Each CI run: full scan, 3-8 seconds for 500 files
│   ├── Acceptable for: small projects, fast runners
│   └── No cache config needed
│
├── Token caching (recommended)
│   ├── Cache: .php-cs-fixer.cache file between runs
│   ├── Speed improvement: 50-80% faster subsequent runs
│   ├── Cache key: OS + PHP version + Pint version
│   ├── Steps:
│   │   1. Restore cache at start of job
│   │   2. Run pint
│   │   3. Save cache at end of job
│   └── Best for: all CI pipelines (negligible setup cost)
│
└── Considerations
    ├── Cache invalidation: clear if pint.json changes
    ├── No security risk (token cache is formatting data only)
    └── Cache storage: use CI provider's caching mechanism
```

### D03: Annotation Format

```
START: How should Pint report formatting issues in CI?
│
├── Default output (no format flag)
│   ├── Shows file list + issues in CI logs
│   ├── Developer must scroll through logs
│   └── Acceptable for: simple CI setups
│
├── GitHub Annotations (--format=github)
│   ├── Inline annotations on PR diff
│   ├── Shows exact line + issue in PR review
│   ├── Best developer experience
│   └── Adds ~0.5s overhead
│
├── Checkstyle format (--format=checkstyle)
│   ├── XML output for other CI tools
│   ├── Use with: GitLab CI, Bitbucket, custom dashboards
│   └── More setup required
│
└── Recommendation: use --format=github for GitHub Actions
    ├── Zero additional tooling needed
    ├── Developer sees issues in familiar PR context
    └── Fast feedback without leaving PR view
```

### D04: Pipeline Positioning

```
START: Where should Pint run in the CI pipeline?
│
├── First step after dependency install (recommended)
│   ├── Fast (3-10s), fails fast if style issues
│   ├── Prevents wasted time on unformatted code
│   ├── Pipeline: Composer → Pint → PHPStan → Tests
│   └── Early feedback principle
│
├── Before PHPStan (recommended)
│   ├── Fix style first, then analyze types
│   ├── PHPStan reports on clean code
│   └── Logical ordering: style → types → behavior
│
├── Parallel with other tools
│   ├── Run Pint alongside PHPStan and tests
│   ├── Pro: fastest total wall time
│   ├── Con: full feedback only at end
│   └── Use when: CI time is critical constraint
│
└── Key considerations
    ├── Version pin: "laravel/pint": "1.18.*" prevents surprises
    ├── Consistent config: CI and local must use same pint.json
    ├── Monorepo: run Pint per module with separate configs
    └── Exclusion: ensure vendor/storage excluded in CI config
```
