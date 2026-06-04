# Folder Architecture: Platform Engineering & Developer Experience for Laravel

## Directory Structure

```
platform-engineering-developer-experience/
├── domain-analysis.md
├── folder-architecture.md
│
├── 01-internal-developer-platforms/
│   ├── idp-architecture-patterns.md
│   ├── idp-reference-architecture.md
│   ├── self-service-portal-design.md
│   ├── golden-path-templates/
│   │   ├── new-laravel-service.md
│   │   ├── add-microservice.md
│   │   └── setup-development-environment.md
│   ├── backstage-integration/
│   │   ├── backstage-setup-guide.md
│   │   ├── laravel-service-catalog.md
│   │   ├── techdocs-template.md
│   │   └── scaffolder-templates/
│   │       ├── laravel-api-template.yaml
│   │       └── laravel-package-template.yaml
│   ├── forge-based-platforms/
│   │   ├── forge-architecture.md
│   │   └── forge-automation-scripts/
│   └── service-catalog/
│       ├── service-definition-schema.json
│       └── service-onboarding-checklist.md
│
├── 02-package-development/
│   ├── package-standards/
│   │   ├── package-creation-guide.md
│   │   ├── package-structure-reference.md
│   │   ├── service-provider-patterns.md
│   │   └── package-checklist.md
│   ├── spatie-package-tools/
│   │   ├── spatie-package-tool-guide.md
│   │   ├── PackageServiceProvider-examples.md
│   │   ├── hasConfigFile-usage.md
│   │   ├── hasViews-usage.md
│   │   ├── hasMigrations-usage.md
│   │   ├── hasCommands-usage.md
│   │   ├── hasInstallCommand-usage.md
│   │   ├── view-components-registration.md
│   │   ├── inertia-integration.md
│   │   └── lifecycle-hooks.md
│   ├── package-skeleton/
│   │   ├── skeleton-directory-structure.md
│   │   ├── composer.json-template.md
│   │   ├── src/
│   │   │   ├── ServiceProvider-stub.md
│   │   │   ├── Commands/
│   │   │   ├── Facades/
│   │   │   └── Concerns/
│   │   ├── config/
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   └── factories/
│   │   ├── resources/
│   │   │   ├── views/
│   │   │   ├── lang/
│   │   │   ├── dist/
│   │   │   └── js/
│   │   │       └── pages/
│   │   ├── routes/
│   │   └── tests/
│   │       ├── PestTest.php
│   │       └── TestCase.php
│   ├── internal-package-registry/
│   │   ├── private-packagist-setup.md
│   │   ├── satis-configuration.md
│   │   └── composer-auth-patterns.md
│   ├── package-testing/
│   │   ├── orchestra-testbench-setup.md
│   │   ├── testing-service-providers.md
│   │   └── package-test-patterns.md
│   ├── package-discovery/
│   │   ├── auto-discovery-config.md
│   │   ├── dont-discover-patterns.md
│   │   └── facade-registration.md
│   └── governance/
│       ├── package-versioning-policy.md
│       ├── package-deprecation-workflow.md
│       ├── package-quality-gates.md
│       └── package-review-template.md
│
├── 03-monorepo-management/
│   ├── monorepo-strategies/
│   │   ├── monorepo-vs-multirepo-analysis.md
│   │   ├── directory-structure-patterns.md
│   │   ├── split-testing-with-monorepo-split.md
│   │   └── laravel-monorepo-examples.md
│   ├── tooling/
│   │   ├── symplify-monorepo-split-setup.md
│   │   ├── composer-path-repositories.md
│   │   └── monorepo-builder-config.md
│   ├── shared-libraries/
│   │   ├── extracting-shared-code.md
│   │   ├── shared-eloquent-models.md
│   │   ├── shared-traits-and-concerns.md
│   │   └── shared-service-providers.md
│   └── ci-for-monorepos/
│       ├── github-actions-monorepo-strategy.md
│       ├── changed-files-detection.md
│       ├── matrix-builds.md
│       └── dependency-graph-optimization.md
│
├── 04-developer-tooling/
│   ├── laravel-telescope/
│   │   ├── installation-and-setup.md
│   │   ├── watcher-configuration.md
│   │   ├── custom-watchers.md
│   │   ├── filtering-and-tagging.md
│   │   ├── data-pruning-strategies.md
│   │   └── dashboard-authorization.md
│   ├── laravel-debugbar/
│   │   ├── installation-and-config.md
│   │   ├── profiler-collectors.md
│   │   ├── custom-data-collectors.md
│   │   └── performance-optimization.md
│   ├── laravel-pulse/
│   │   ├── pulse-setup.md
│   │   ├── built-in-cards.md
│   │   ├── custom-card-development.md
│   │   ├── pulse-recorders.md
│   │   └── dashboard-customization.md
│   ├── ide-integration/
│   │   ├── laravel-ide-helper/
│   │   │   ├── installation-and-setup.md
│   │   │   ├── facade-generation.md
│   │   │   ├── model-phpdoc-generation.md
│   │   │   ├── meta-file-generation.md
│   │   │   └── composer-scripts-integration.md
│   │   ├── phpstorm-configuration/
│   │   │   ├── phpstorm-laravel-plugin.md
│   │   │   ├── live-templates.md
│   │   │   └── debug-configuration.md
│   │   └── vscode-configuration/
│   │       ├── recommended-extensions.md
│   │       └── launch-json-config.md
│   ├── debugging-patterns/
│   │   ├── xdebug-with-sail.md
│   │   ├── telescope-vs-debugbar.md
│   │   └── log-viewer-setup.md
│   └── nightwatch-integration/
│       └── nightwatch-setup-guide.md
│
├── 05-code-quality/
│   ├── laravel-pint/
│   │   ├── installation.md
│   │   ├── pint-json-config/
│   │   │   ├── laravel-preset.md
│   │   │   ├── psr12-preset.md
│   │   │   ├── custom-rules-config.md
│   │   │   └── exclude-patterns.md
│   │   ├── presets-and-rules.md
│   │   ├── ci-integration/
│   │   │   ├── github-actions-workflow.md
│   │   │   ├── gitlab-ci-config.md
│   │   │   └── pre-commit-hook.md
│   │   └── fixing-strategies.md
│   ├── laravel-phpstan/
│   │   ├── larastan-installation.md
│   │   ├── phpstan-neon-configuration.md
│   │   ├── laravel-specific-rules.md
│   │   ├── baseline-management.md
│   │   ├── custom-rules-development.md
│   │   ├── ci-integration/
│   │   │   ├── github-actions-phpstan.md
│   │   │   └── phpstan-in-merge-requests.md
│   │   └── level-guide.md
│   ├── laravel-rector/
│   │   ├── rector-installation.md
│   │   ├── laravel-rector-rules.md
│   │   ├── custom-rector-rules.md
│   │   ├── upgrade-sets.md
│   │   ├── ci-integration.md
│   │   └── dry-run-and-apply.md
│   ├── code-quality-toolchain/
│   │   ├── integrated-toolchain-config.md
│   │   ├── pint-phpstan-rector-workflow.md
│   │   └── quality-gates-definition.md
│   └── git-hooks/
│       ├── captainhook-configuration.md
│       ├── pre-commit-linting.md
│       └── pre-push-static-analysis.md
│
├── 06-code-generation/
│   ├── laravel-shift/
│   │   ├── shift-overview.md
│   │   ├── upgrade-workflow.md
│   │   ├── version-compatibility-matrix.md
│   │   ├── shift-configuration.md
│   │   └── alternative-in-house-approaches.md
│   ├── blueprint/
│   │   ├── blueprint-installation.md
│   │   ├── yaml-dsl-reference.md
│   │   ├── model-definitions.md
│   │   ├── controller-definitions.md
│   │   ├── generated-output-reference.md
│   │   ├── custom-stubs.md
│   │   └── advanced-blueprint-usage.md
│   ├── starter-kits/
│   │   ├── breeze-installation-guide.md
│   │   ├── breeze-stack-comparison.md
│   │   ├── jetstream-features.md
│   │   └── custom-starter-kit-creation.md
│   ├── stub-customization/
│   │   ├── publishing-stubs.md
│   │   ├── custom-model-stubs.md
│   │   ├── custom-controller-stubs.md
│   │   └── custom-factory-stubs.md
│   ├── custom-generators/
│   │   ├── custom-artisan-make-commands.md
│   │   ├── service-class-generator.md
│   │   ├── action-class-generator.md
│   │   ├── dto-class-generator.md
│   │   └── enum-generator.md
│   └── project-templates/
│       ├── organization-base-template.md
│       ├── microservice-template.md
│       └── api-only-template.md
│
├── 07-development-environments/
│   ├── laravel-sail/
│   │   ├── installation-guide.md
│   │   ├── docker-compose-configuration.md
│   │   ├── service-configuration/
│   │   │   ├── mysql-config.md
│   │   │   ├── postgresql-config.md
│   │   │   ├── mongodb-config.md
│   │   │   ├── redis-config.md
│   │   │   ├── meilisearch-config.md
│   │   │   ├── mailpit-config.md
│   │   │   └── minio-config.md
│   │   ├── php-version-management.md
│   │   ├── node-version-management.md
│   │   ├── xdebug-configuration.md
│   │   ├── customization/
│   │   │   ├── publishing-sail-dockerfiles.md
│   │   │   ├── adding-custom-services.md
│   │   │   └── customizing-php-ini.md
│   │   ├── devcontainers/
│   │   │   ├── sail-devcontainer-setup.md
│   │   │   ├── devcontainer-json-reference.md
│   │   │   └── vscode-devcontainer-patterns.md
│   │   ├── shell-alias-config.md
│   │   └── sail-commands-reference.md
│   ├── docker-ecosystem/
│   │   ├── custom-docker-setups.md
│   │   ├── docker-compose-best-practices.md
│   │   └── multi-project-docker.md
│   ├── environment-configuration/
│   │   ├── env-file-management.md
│   │   ├── environment-specific-configs.md
│   │   └── secret-management.md
│   ├── windows-development/
│   │   ├── wsl2-setup-guide.md
│   │   └── docker-desktop-configuration.md
│   └── environment-provisioning/
│       ├── automated-environment-setup.md
│       └── environment-verification-script.md
│
├── 08-workflow-automation/
│   ├── github-actions/
│   │   ├── testing-workflows/
│   │   │   ├── phpunit-pest-workflow.md
│   │   │   ├── dusk-browser-tests-workflow.md
│   │   │   └── matrix-testing-strategy.md
│   │   ├── quality-workflows/
│   │   │   ├── pint-workflow.md
│   │   │   ├── phpstan-workflow.md
│   │   │   ├── rector-workflow.md
│   │   │   └── combined-quality-gate.md
│   │   ├── deployment-workflows/
│   │   │   ├── forge-deployment.md
│   │   │   ├── vapor-deployment.md
│   │   │   └── envoyer-zero-downtime.md
│   │   ├── dependency-management/
│   │   │   ├── dependabot-configuration.md
│   │   │   └── renovate-configuration.md
│   │   └── release-workflows/
│   │       ├── automated-changelog.md
│   │       ├── semantic-release.md
│   │       └── package-release-workflow.md
│   ├── git-workflows/
│   │   ├── branching-strategies/
│   │   │   ├── gitflow-for-laravel.md
│   │   │   ├── trunk-based-development.md
│   │   │   └── release-branching.md
│   │   ├── pr-templates/
│   │   │   ├── default-pr-template.md
│   │   │   ├── bug-fix-template.md
│   │   │   └── feature-template.md
│   │   ├── code-review/
│   │   │   ├── laravel-code-review-checklist.md
│   │   │   ├── security-review-checklist.md
│   │   │   └── automated-review-config.md
│   │   └── commit-conventions.md
│   └── automation-scripts/
│       ├── setup-new-project.sh
│       ├── verify-environment.sh
│       ├── install-dependencies.sh
│       └── run-quality-checks.sh
│
├── 09-onboarding-and-standards/
│   ├── developer-onboarding/
│   │   ├── onboarding-checklist.md
│   │   ├── environment-setup-guide.md
│   │   ├── first-week-plan.md
│   │   ├── first-sprint-goals.md
│   │   └── onboarding-automation/
│   │       ├── automated-repo-setup.md
│   │       ├── environment-provisioning.md
│   │       └── onboarding-verification-script.md
│   ├── coding-standards/
│   │   ├── laravel-coding-style.md
│   │   ├── naming-conventions.md
│   │   ├── architectural-standards.md
│   │   ├── API-design-standards.md
│   │   └── testing-standards.md
│   ├── contribution-guidelines/
│   │   ├── CONTRIBUTING-template.md
│   │   ├── issue-templates/
│   │   │   ├── bug-report.md
│   │   │   └── feature-request.md
│   │   └── pull-request-process.md
│   ├── architecture-decision-records/
│   │   ├── ADR-template.md
│   │   ├── adr-workflow.md
│   │   └── example-adrs/
│   ├── documentation/
│   │   ├── project-readme-template.md
│   │   ├── api-documentation-standards.md
│   │   └── runbook-templates.md
│   └── team-agreements/
│       ├── definition-of-done.md
│       ├── definition-of-ready.md
│       └── team-working-agreement.md
│
├── 10-cli-tooling/
│   ├── custom-artisan-commands/
│   │   ├── command-structure-guide.md
│   │   ├── command-signatures-and-arguments.md
│   │   ├── input-output-patterns.md
│   │   ├── interactive-commands.md
│   │   ├── progress-bars-and-tables.md
│   │   ├── command-scheduling.md
│   │   └── testing-artisan-commands.md
│   ├── console-development/
│   │   ├── console-kernel-configuration.md
│   │   ├── multi-command-applications.md
│   │   └── standalone-console-app-patterns.md
│   ├── developer-workflow-cli/
│   │   ├── custom-dev-workflow-commands.md
│   │   ├── project-init-command.md
│   │   ├── code-analysis-command.md
│   │   └── environment-status-command.md
│   ├── tinker-and-repl/
│   │   ├── tinker-usage-guide.md
│   │   └── custom-tinker-aliases.md
│   └── third-party-cli-tools/
│       ├── forge-cli-usage.md
│       ├── ploi-cli-usage.md
│       └── valet-usage-guide.md
│
└── shared-references/
    ├── tool-compatibility-matrix.md
    ├── laravel-version-support.md
    ├── php-version-compatibility.md
    └── tool-glossary.md
```

## Architecture Principles

1. **Subdomain Isolation**: Each top-level directory maps to a major subdomain with clear boundaries and minimal cross-dependencies.
2. **Depth over Breadth**: Deep hierarchies (up to 4 levels) for well-established domains; shallower for emerging ones.
3. **Prefix Ordering**: Numbered prefixes (01-10) establish learning sequence and dependency order — earlier subdomains are foundational.
4. **Pattern-Driven Layout**: Each tool/technology subdirectory follows a consistent pattern: setup, configuration, integration, CI, advanced usage.
5. **Template Focus**: `golden-path-templates/`, `scaffolder-templates/`, and stub directories emphasize the platform engineering goal of paved roads.
6. **Shared References**: The `shared-references/` directory anchors cross-cutting concerns like Laravel version compatibility and tool interoperability.

## Usage Notes

- Files in this architecture should be written in Markdown (.md) with YAML frontmatter for metadata (tags, related tools, maturity level).
- Scripts in `08-workflow-automation/automation-scripts/` and `09-onboarding-and-standards/developer-onboarding/onboarding-automation/` use `.sh` extension for shell scripts with Docker/Sail compatibility.
- Each tool configuration directory (e.g., `05-code-quality/laravel-pint/pint-json-config/`) should include ready-to-use configuration files that teams can copy directly.
- The `02-package-development/package-skeleton/` directory provides stub files and templates that mirror the Spatie skeleton structure for rapid package creation.
