# Skills: Install Commands for Packages

## Metadata
- **Domain:** Platform Engineering & Developer Experience
- **Subdomain:** Package Development & Shared Libraries
- **KU:** Install Commands for Packages
- **Phase:** 6 (Skill Extraction)

---

## Skill 1: Implement a Package Install Command Using Spatie Package Tools

### Purpose
Create a single-step `php artisan package-name:install` command that publishes configs, migrations, and assets with progress feedback.

### When To Use
Any Laravel package with config files, migrations, or assets that require consumer setup. Packages where developer experience is a priority.

### When NOT To Use
Packages that auto-discover and work immediately without setup; packages with no publishable resources; internal packages where consumers know manual steps.

### Prerequisites
- Package uses Spatie's `laravel-package-tools` or similar
- Service provider registered with `Skeleton` or custom PackageServiceProvider
- Publishable resources (config, migrations, assets) defined

### Inputs
- Package service provider class
- List of publishable tags (`config`, `migrations`, `assets`)
- Desired install command name (e.g., `package-name:install`)
- Post-install summary content

### Workflow
1. In service provider, call `$this->configurePackage($package)` with Spatie skeleton
2. Chain `->hasInstallCommand(function (InstallCommand $command) { ... })`
3. Inside closure: call `->publishConfigFile()` to publish config with tag
4. Chain `->publishMigrations()` for migration files
5. Add `->askToRunMigrations()` to prompt for immediate migration execution
6. Add `->askToStarOnGitHub()` for open-source community (skip for internal)
7. Use `->startWith()` for introductory message and `->endWith()` for post-install summary
8. Test with `--no-interaction` flag to verify CI/CD compatibility
9. Test idempotency: run the command twice, verify no errors or data loss

### Validation Checklist
- [ ] Command registered as `package-name:install` via `->hasInstallCommand()`
- [ ] Works with `php artisan package-name:install --no-interaction`
- [ ] Publishing uses specific tags (`--tag=package-name-config`), not `--all`
- [ ] Existing published files not overwritten without confirmation
- [ ] Progress feedback shown (`info()`, `newLine()`, `warn()`) during execution
- [ ] Post-install summary displays available commands, config keys, next steps
- [ ] Command is idempotent; running twice is safe
- [ ] Migration execution requires confirmation (or `--force`)

### Common Failures
| Failure | Symptom | Solution |
|---------|---------|----------|
| Non-interactive mode broken | CI/CD pipeline hangs at prompt | Ensure all prompts have defaults; test with `--no-interaction` |
| Silently overwriting files | Consumer config lost on re-run | Always ask before overwrite; use `--force` for automation |
| No progress feedback | User thinks command is frozen | Add `newLine()`, `info()`, `warn()` for each step |
| Publishing wrong tags | Overwrites other packages' files | Use specific tags, not `--tag=config` without prefix |

### Decision Points
- Use `->hasInstallCommand()` vs custom command: prefer Spatie's built-in for standard installs; custom command for complex setup workflows
- `askToRunMigrations()`: Prompt for non-CI; skip confirmation when `--force` flag present
- `askToStarOnGitHub()`: Include for open-source; skip for internal organizational packages

### Performance Considerations
- Install command should complete in under 5 seconds for config-only packages
- Under 30 seconds for packages with migrations
- The command runs once (on setup) and has no runtime performance impact

### Security Considerations
- Never expose API keys or credentials in install command output or prompts
- Never store credentials in published config files as defaults; use `env()` with documented required variables
- Storage directories created by install command should use secure permissions
- Warn users of security implications of setup choices presented in the command

### Related Rules
- INSTALL-RULE-001 (Install command for packages with publishable resources)
- INSTALL-RULE-002 (Idempotent install)
- INSTALL-RULE-003 (Non-interactive mode)
- INSTALL-RULE-004 (Ask before overwriting)
- INSTALL-RULE-005 (Tagged publishing)
- INSTALL-RULE-006 (Progress feedback)
- INSTALL-RULE-007 (Post-install summary)

### Related Skills
- Configure Config File Merging and Publishing
- Implement Migration Publishing and Discovery
- Register Service Provider with Spatie Package Tools
- Design Custom Artisan Commands

### Success Criteria
- Consumer runs single install command and package is fully set up
- CI/CD pipeline installs successfully with `--no-interaction`
- Re-running install command produces no errors or data loss
- Post-install summary clearly tells consumer what was installed and how to use it
