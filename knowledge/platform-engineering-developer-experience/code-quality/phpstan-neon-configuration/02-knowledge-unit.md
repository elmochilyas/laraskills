# Knowledge Unit: PHPStan NEON Configuration

## Metadata
- **Subdomain:** Code Quality & Static Analysis
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-quality-static-analysis/phpstan-neon-configuration
- **Maturity:** Mature
- **Related Technologies:** PHPStan, NEON, Laravel, PHP

## Executive Summary

PHPStan's NEON configuration format is the native configuration language for PHPStan, offering features beyond standard YAML: service definitions with autowired dependencies, parameter includes/composition, PHP constant references, type-aware parameters, and hierarchical configuration inheritance. NEON files (`.neon` extension) define PHPStan's analysis scope, rules, extensions, parameters, and baseline. The format supports: includes (merge multiple config files), parameters (application-level and extension-specific), services (class autoloading with autowiring), and ignoredErrors (error suppression patterns). Understanding NEON is essential for configuring Larastan, custom rules, baseline integration, and environment-specific PHPStan setups. NEON was created as part of the Nette framework but has become the standard configuration format for PHPStan and its ecosystem.

## Core Concepts

- **NEON Format:** A configuration format similar to YAML but with PHP-specific features: PHP constant resolution (`PHP_EOL`), entity constructors, and inline PHP expressions
- **Parameters Section:** `parameters:` defines analysis settings: level, paths, excludedPaths, bootstrap, customRules, and extension-specific parameters
- **Services Section:** `services:` registers PHPStan extensions, custom rules, and type mappings with autowired constructor injection
- **Includes:** `includes:` merges external configuration files (vendor configs, baseline, custom rulesets) into the current config
- **Ignored Errors:** Error suppression patterns defined as regular expressions with file path and error count constraints
- **NEON Entities:** Constructor-style definitions: `PhpDocParser: Nette\Utils\Strings::class()` enables function calls and object construction in config

## Mental Models

## Internal Mechanics

## Patterns

- **Layered Config Pattern:** `phpstan.neon` includes: `vendor/larastan/larastan/extension.neon` (Laravel rules), `phpstan-baseline.neon` (known errors), and `phpstan.local.neon` (local overrides, .gitignored)
- **Environment-Specific Config Pattern:** `phpstan.neon` (base config) includes `phpstan.ci.neon` (CI-specific overrides) or `phpstan.local.neon` (local development overrides)
- **Custom Rule Registration Pattern:** Custom PHPStan rules are registered in the services section with tags: `- class: App\Phpstan\MyCustomRule tags: [phpstan.rules.rule]`
- **Type Mapping Pattern:** Map dynamic types via services section: `stubFiles: [phpstan/stubs/*.stub]` provides PHPDoc-stubs for classes without proper type information
- **Parameter Composition Pattern:** Use `%rootDir%`, `%currentWorkingDirectory%`, and other NEON constants in path definitions for portable configurations
- **Ignored Errors with Count Pattern:**
```neon
parameters:
    ignoreErrors:
        - '#Undocumented property#':
            path: app/Models/User.php
            count: 3
```

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Config format | NEON vs YAML vs PHP | NEON (native format, full feature set) |
| Config organization | Single file vs includes hierarchy | Single file for simple projects; includes hierarchy for complex projects |
| Baseline integration | Inline in config vs separate file | Separate file (phpstan-baseline.neon) managed by `--generate-baseline` |
| Local vs committed | All committed vs local overrides | Base config + CI config committed; `.gitignored` local config for personal overrides |

## Tradeoffs

- **NEON vs YAML:** NEON is less widely supported (fewer IDE plugins, linters) than YAML but offers PHP-specific features essential for advanced PHPStan configuration. For basic setups (level, paths, exclude), YAML is sufficient. For custom rules, services, and extensions, NEON is necessary.
- **Single File vs Includes:** Single file configuration is simpler to understand but can become very large. Includes separate concerns (rules, baseline, custom extensions) at the cost of file management overhead.
- **Included vs Inline Baseline:** Baseline can be included as a separate file (cleaner separation) or inlined in the main config (single file, harder to regenerate). Separate file is strongly preferred.

## Performance Considerations

- **Config Parsing:** NEON parsing is fast (<10ms for typical configs). Includes merge overhead scales with depth; 3-4 levels of includes is fine.
- **Service Registration Overhead:** Each registered extension adds minimal parsing overhead (~1ms). 20-30 extensions are fine; 100+ may add 50-100ms to startup.
- **Baseline File Size:** Large baseline files (5000+ entries) add ~50-100ms to parsing. This is a one-time cost per analysis run.

## Production Considerations

- **CI Consistency:** CI should use the same neons config as local development (via the committed config file). Avoid CI-specific overrides that create divergence.
- **Version Compatibility:** NEON format changes between PHPStan major versions. Check the upgrade guide when upgrading PHPStan for NEON syntax changes.
- **Local Overrides:** Use `phpstan.local.neon` (in `.gitignore`) for local machine-specific settings (memory limit, strict level). The committed `phpstan.neon` should work for all team members.
- **Config Validation:** Run `vendor/bin/phpstan --configuration phpstan.neon --no-analysis` to validate the config without running analysis.

## Common Mistakes

- **YAML-style comments in NEON:** Using `# comment` inside NEON arrays or inline values—NEON supports `#` comments but only at line start or after structure elements
- **Incorrect include paths:** Using absolute paths in includes that don't work on other machines or in CI; use `vendor/larastan/...` relative paths or NEON constants
- **Missing service tags:** Registering a custom rule or extension in services but forgetting the `tags` array; the class is loaded but not registered as a PHPStan extension
- **Baseline in main config file:** Embedding the baseline inline in `phpstan.neon` makes regeneration difficult; always use a separate baseline file with `includes: [phpstan-baseline.neon]`
- **Incorrect PHP constant resolution:** Using `PHP_EOL` without the `%` delimiters in path strings or forgetting that NEON resolves constants at parse time

## Failure Modes

- **Circular Includes:** Two NEON files include each other directly or indirectly, causing infinite recursion. Mitigate: check include graph; PHPStan fails with a clear error.
- **Service Parameter Mismatch:** A custom PHPStan extension constructor parameter type doesn't match what NEON autowiring provides. Mitigate: verify constructor signatures match PHPStan's extension interfaces.
- **NEON Parse Error:** Invalid NEON syntax (unclosed brackets, incorrect entities) causes PHPStan to fail on startup with a parse error. Mitigate: validate with `phpstan --configuration` without analysis.
- **Include Not Found:** A file referenced in `includes:` doesn't exist. Mitigate: verify include paths after Composer updates; use `vendor/package/` references.

## Ecosystem Usage

- **PHPStan Itself:** PHPStan uses NEON for its own configuration; the format is integral to PHPStan's design
- **Larastan:** Larastan provides NEON configuration files (`extension.neon`, `rules.neon`) that are included via `includes: [vendor/larastan/larastan/extension.neon]`
- **PHPStan Extensions:** All PHPStan extensions (phpstan-phpunit, phpstan-doctrine, phpstan-symfony) distribute NEON configuration files
- **Nette Framework:** NEON originates from the Nette PHP framework and is used by various Nette tools beyond PHPStan
- **Rector:** Rector uses NEON configuration as an alternative to its PHP-based configuration (`rector.php`), though PHP config is more common

## Related Knowledge Units

- phpstan-config-for-laravel
- phpstan-baseline-patterns
- laravel-phpstan
- static-analysis-ci-integration

## Research Notes

- NEON was created by David Grudl (Nette framework author) and is maintained as part of the Nette components
- NEON supports features not available in YAML: entities (function calls), PHP constant resolution, inline PHP expressions, and autowired service registration
- PHPStan 2.x improved NEON support with better default values for parameters and more flexible service registration
- The NEON format is also used by PHP-Parser, PHP-CS-Fixer configuration, and several other PHP tools, though YAML is more common overall
- NEON files use `.neon` extension by convention; PHPStan also accepts `.yaml` and `.yml` but NEON-specific features won't work in YAML
