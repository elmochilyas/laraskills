# 07-Decision Trees: PHP Version Management

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | php-version-management |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | PHP Version Selection | Choosing PHP version for development | What PHP version does production use and what does the project require? |
| D02 | Version Management Tool | How to manage multiple PHP versions | Do we need to switch PHP versions per project or use a single version? |
| D03 | CI Version Matrix | Which PHP versions to test against | What PHP versions should the application support? |
| D04 | Version Upgrade Timing | When to upgrade PHP version | Is the current PHP version still supported and compatible? |

## Architecture-Level Decision Trees

### D01: PHP Version Selection

```
START: Which PHP version should we use?
│
├── Match production version (strongly recommended)
│   ├── Prevents version-dependent feature usage
│   ├── Prevents behavior differences (serialization, sorting, etc.)
│   ├── Sail: set PHP_VERSION=8.3 in .env
│   └── Catches: compatibility issues early
│
├── New project (no production yet)
    ├── PHP 8.3 (current stable, widely supported)
    │   ├── Long-term support until 2026
    │   ├── Best package compatibility
    │   └── Recommended for new projects
    ├── PHP 8.4 (latest)
    │   ├── New features (property hooks, multibyte improvements)
    │   ├── Check: hosting platform supports it
    │   └── Best for: greenfield, modern hosting
    └── Consider: Laravel version's PHP requirement
        ├── Laravel 10: PHP 8.1+
        ├── Laravel 11: PHP 8.2+
        └── Laravel 12: PHP 8.2+
│
└── Legacy project
    ├── Match production — don't upgrade PHP without upgrading production
    ├── PHP 8.1: EOL Dec 2025 — plan upgrade
    ├── PHP 8.0: EOL Nov 2024 — must upgrade
    └── PHP 7.x: EOL — upgrade urgently (security risks)
```

### D02: Version Management Tool

```
START: How do we manage the PHP version for this project?
│
├── Laravel Sail (recommended for Laravel projects)
│   ├── Each project has its own container with specific PHP version
│   ├── Set PHP_VERSION=8.3 in .env (per project)
│   ├── No system PHP installation needed
│   ├── Pro: project-isolated, no conflicts
│   ├── Pro: easy to switch versions per project
│   └── Best for: all Laravel projects using Docker
│
├── Native PHP + phpbrew (non-Sail projects)
│   ├── phpbrew install 8.3 && phpbrew switch 8.3
│   ├── Multiple versions on one machine
│   ├── Global switch: all projects use same version
│   ├── Con: switching versions affects all projects
│   └── Best for: non-Docker workflows, CLI tools
│
├── Homebrew (macOS)
│   ├── brew install php@8.3 && brew link php@8.3
│   ├── Simple, but one version at a time
│   └── Best for: macOS native development
│
├── PPA (Linux)
│   ├── sudo add-apt-repository ppa:ondrej/php
│   ├── sudo apt install php8.3
│   └── Multiple versions via php8.3 / php8.2 binaries
│
└── Recommendation: use Sail for project isolation
    ├── Each project = independent PHP version
    ├── No system PHP management needed
    └── CI matrix handles multi-version testing
```

### D03: CI Version Matrix

```
START: Which PHP versions should we test against in CI?
│
├── Single version (match production)
│   ├── Fastest CI, fewer false positives
│   ├── Risk: doesn't catch version-specific issues early
│   └── Best for: teams with locked production version
│
├── Matrix: production ± 1 minor version (recommended)
│   ├── Example: prod=8.3 → matrix=[8.2, 8.3, 8.4]
│   ├── Catches: upcoming deprecations, compatibility issues
│   ├── Pro: early warning before production upgrade
│   └── Cost: 2-3x CI runtime (parallel jobs mitigate)
│
├── Matrix: all supported Laravel PHP versions
│   ├── For packages/libraries with broad compatibility
    │   ├── Laravel 11: PHP 8.2+
    │   └── Test: [8.2, 8.3, 8.4]
    └── Pro: ensures wide compatibility
│
└── CI configuration
    ├── GitHub Actions: strategy.matrix.php
    ├── Cache per PHP version (separate vendor dirs)
    └── Allow specific version failures if experimental
```

### D04: Version Upgrade Timing

```
START: When should we upgrade the PHP version?
│
├── Upgrade now (urgent)
│   ├── PHP version reached End of Life (no security patches)
│   ├── PHP 7.4: EOL Nov 2022
│   ├── PHP 8.0: EOL Nov 2024
│   └── PHP 8.1: EOL Dec 2025
│
├── Plan upgrade (within 6 months)
│   ├── PHP version within 6 months of EOL
│   ├── Schedule: upgrade to next version with reasonable timeline
│   ├── Benefits: security patches, performance (10-30% faster per major)
│   └── Action: add to team roadmap
│
├── Stay on current version
│   ├── PHP version fully supported
│   ├── Matching production exactly
│   ├── No compelling features need newer version
│   └── Review quarterly
│
└── Upgrade workflow
    ├── 1. Update Sail's PHP_VERSION in .env
    ├── 2. Rebuild: sail build --no-cache
    ├── 3. Run full test suite
    ├── 4. Fix deprecation warnings
    ├── 5. Update CI matrix
    ├── 6. Deploy to staging for testing
    └── 7. Deploy to production
```
