# Knowledge Unit: Custom Pint Rules

## Metadata
- **Subdomain:** Code Quality & Static Analysis
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-quality-static-analysis/custom-pint-rules
- **Maturity:** Mature
- **Related Technologies:** Laravel Pint, PHP-CS-Fixer, PHP, Coding Standards

## Executive Summary

Custom Pint rules extend Laravel Pint's code style enforcement beyond the built-in presets by configuring PHP-CS-Fixer rules directly in `pint.json`. While Pint offers four presets (laravel, psr12, per, symfony), real-world projects often need project-specific rules: custom import ordering, forbidden methods or functions, custom type casting preferences, or team-specific formatting conventions. Custom rules are defined in the `rules` section of `pint.json` with the same names and value formats as PHP-CS-Fixer rules. Pint also supports rule configurability (nested options for complex rules), custom fixer paths (via `notPath` and `notName` exclusions), and the ability to disable specific rules. Teams can extend Pint with custom PHP-CS-Fixer fixers by creating fixer classes and registering them in Pint's configuration.

## Core Concepts

- **Rule Definition:** A named PHP-CS-Fixer rule with its configuration value, defined in `pint.json` under the `rules` key
- **Rule Configurability:** Complex rules accept arrays of parameters: `'concat_space': { 'spacing': 'one' }` controls spacing around concatenation operators
- **NotPath/NotName:** File exclusion patterns to prevent specific files or directories from being processed by Pint
- **Custom Fixers:** PHP-CS-Fixer fixer classes that implement `FixerInterface` for domain-specific transformations not covered by built-in rules
- **Rule Presets:** Groups of rules organized as presets (laravel, psr12, per, symfony); custom rules merge with preset defaults
- **Explicit Rule Control:** `'enabled'` and `'disabled'` arrays in pint.json for explicitly enabling/disabling rules regardless of preset

## Mental Models

## Internal Mechanics

## Patterns

- **Import Ordering Pattern:** Customize `ordered_imports` and `group_import` rules for team-specific import grouping (Laravel facades first, then models, then third-party packages)
- **Forbidden Functions Pattern:** Use `no_forbidden_functions` or custom fixers to ban `dd()`, `dump()`, `var_dump()`, `exit()` in committed code
- **Type Declarations Pattern:** `nullable_type_declaration_for_default_null_value` to enforce `?string $value = null` over `string $value = null`
- **String Syntax Pattern:** `single_quote` or `double_quote` preference for string literals; `heredoc_indentation` for heredoc formatting
- **Trailing Comma Pattern:** `trailing_comma_in_multiline` for trailing commas in multi-line arrays, function arguments, and match expressions
- **Blank Line Pattern:** `blank_line_before_statement` with `return`, `throw`, `break`, `continue` for consistent vertical whitespace

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Rule source | Built-in PHP-CS-Fixer vs custom fixer class | Built-in for standard conventions; custom fixers for project-specific patterns |
| Configuration scope | Global `pint.json` vs per-directory configurations | Single project config; separate configs for legacy modules with different standards |
| Preset choice | Laravel vs PSR-12 vs PER vs Symfony | Laravel for most Laravel projects; PSR-12 for interoperability |
| Custom fixer distribution | Inline class vs package vs Composer autoload | In-package for project-specific fixers; Composer autoload for reusable fixer collections |

## Tradeoffs

- **Strict vs Lenient Configuration:** Strict rules (blank_line_before_statement, ordered_imports, trailing_comma_in_multiline) enforce consistent code but cause more formatting changes per edit. Lenient configuration accepts more variation but reduces formatting disputes.
- **Custom Fixers vs Manual Code Review:** Custom fixers automate style enforcement but require maintenance. Manual code review is flexible but inconsistent. Invest in custom fixers for rules that apply to >20% of the codebase.
- **Preset Override vs Full Rule Set:** Overriding a preset with `rules: { ... }` is concise but makes the effective rule set implicit (preset + overrides). Defining all rules explicitly is verbose but transparent.

## Performance Considerations

- **Custom Fixer Execution Time:** Custom fixers are PHP classes evaluated during Pint's analysis. Simple fixers (regex replacements, token manipulation) add <1ms per file. Complex fixers (AST manipulation) may add 5-10ms per file.
- **Configuration Parsing:** pint.json is parsed once per Pint invocation. Custom rule definitions add negligible parsing overhead.
- **Exclusion Patterns Impact:** `notPath` and `notName` patterns are evaluated per file. Using many complex patterns (wildcards, regex) adds marginal overhead.

## Production Considerations

- **Pint Version Compatibility:** Custom rules depend on PHP-CS-Fixer rule names and values, which change between PHP-CS-Fixer versions. Lock Pint version to prevent rule breakage.
- **CI Consistency:** Ensure pint.json is in version control and the CI pipeline uses the same Pint version as development environments. Run `pint --test` in CI to enforce rules.
- **Custom Fixer Autoloading:** Custom fixer classes must be autoloadable (PSR-4) when Pint runs. In CI, ensure custom fixer packages are installed via Composer.
- **Rule Documentation:** Document custom rules and their rationales in CONTRIBUTING.md. New team members need to understand why specific rules exist.

## Common Mistakes

- **Conflicting rules:** Two rules that modify the same code aspect (e.g., `single_quote` and `double_quote`); PHP-CS-Fixer resolves conflicts by rule priority but the result may surprise
- **Rules that break PHP syntax:** Enabling rules that produce invalid PHP in edge cases (e.g., strict types declaration in files with BOM); test rules on the full codebase
- **Overriding preset rules incorrectly:** Setting a rule to `false` instead of `null` to disable it; `false` means "enforce the opposite" while `null` means "not configured"
- **Forgetting to handle generated files:** Custom rules applied to vendor files, compiled views, or generated code that shouldn't be modified; use `notPath`/`notName` exclusions
- **Missing rule dependencies:** Some rules require others as prerequisites (e.g., `blank_line_before_statement` requires `no_extra_blank_lines`); PHP-CS-Fixer silently disables dependent rules

## Failure Modes

- **Rule Not Found Error:** A rule name in pint.json doesn't exist in the installed PHP-CS-Fixer version. Mitigate: validate rules against PHP-CS-Fixer's documentation for the installed version.
- **Custom Fixer Class Not Found:** The custom fixer class referenced in Pint configuration isn't autoloadable. Mitigate: verify autoloading configuration and package installation.
- **Pint-PHP-CS-Fixer Version Mismatch:** Pint bundles a specific PHP-CS-Fixer version; custom rules designed for a different PHP-CS-Fixer version may behave unexpectedly. Mitigate: align custom rule development with Pint's bundled PHP-CS-Fixer version.
- **Rule Application Crash:** A custom fixer throws an unhandled exception on specific file patterns. Mitigate: add comprehensive error handling in custom fixers and file-type filtering.

## Ecosystem Usage

- **Open Source Laravel Packages:** Many open-source packages define custom Pint rulesets in their pint.json to enforce project-specific coding standards
- **Laravel Teams:** Development teams at agencies and product companies use custom Pint rules to encode team conventions and enforce them across multiple projects
- **PHP-CS-Fixer Ecosystem:** Custom Pint rules are compatible with PHP-CS-Fixer's extensive rule library; teams can use any PHP-CS-Fixer rule that Pint supports

## Related Knowledge Units

- pint-configuration
- pint-presets
- pint-ci-integration
- coding-standards-documentation

## Research Notes

- Pint uses `php-cs-fixer/shim` version 3.x; custom rule definitions follow PHP-CS-Fixer v3 configuration format
- Custom fixers in Pint require creating a class implementing `PhpCsFixer\Fixer\FixerInterface` and registering it via Pint's internal configuration
- Pint does not support PHP-CS-Fixer's custom fixers natively through `pint.json` alone; custom fixer registration requires modifying Pint's internal configuration or using Pint extensions
- The `rules` array in pint.json directly mirrors PHP-CS-Fixer's configuration array; most PHP-CS-Fixer documentation on rule options applies directly to Pint
