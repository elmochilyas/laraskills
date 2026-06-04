# Knowledge Unit: Pint Presets

## Metadata
- **Subdomain:** Code Quality & Static Analysis
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-quality-static-analysis/pint-presets
- **Maturity:** Mature
- **Related Technologies:** Laravel Pint, PHP-CS-Fixer, PHP, PSR-12, PER

## Executive Summary

Laravel Pint provides four built-in presets that define the baseline code style rulesets: `laravel` (Laravel's own coding standards), `psr12` (PHP-FIG PSR-12 standard), `per` (PER coding style, successor to PSR-2), and `symfony` (Symfony framework conventions). The preset is selected via `"preset": "laravel"` in `pint.json`. Each preset enables a comprehensive set of PHP-CS-Fixer rules that cover: braces style, import ordering, spacing, trailing commas, string quotes, type declaration spacing, blank lines, and naming conventions. The `laravel` preset is the default and includes Laravel-specific rules (ordered imports with `import()` first, facades, helpers). The `psr12` preset strictly follows the PSR-12 standard. The `per` preset is an updated version of PER (PHP Extended Rules). The `symfony` preset follows Symfony coding standards. Custom rules in `pint.json` override preset defaults.

## Core Concepts

- **Laravel Preset:** The default preset matching Laravel's own code style: ordered imports (Laravel facades first), Laravel helper function spacing, Blade template conventions, and PSR-12 compliance
- **PSR-12 Preset:** Strict PHP-FIG PSR-12 compliance (extended PSR-2); no opening tag on declarations, blank line after namespace, specific brace positioning
- **PER Preset:** PHP Extended Rules (PER) coding style, an evolution of PSR-12 with additional conventions for new PHP features
- **Symfony Preset:** Symfony framework coding standards; different brace positioning, native type declarations, and naming conventions
- **Preset Inheritance:** Custom `rules` in pint.json are merged with the selected preset; preset values can be overridden or extended
- **Rule Defaults:** Each preset defines `true` (enabled), `false` (disabled), or `null` (inherit from parent) for each PHP-CS-Fixer rule

## Mental Models

## Internal Mechanics

## Patterns

- **Ecosystem Alignment Pattern:** Use the `laravel` preset for Laravel applications and packages—ensures code looks like it belongs in the Laravel ecosystem
- **Framework-Agnostic Pattern:** Use the `psr12` or `per` preset for packages or libraries intended for use with multiple frameworks
- **Migration Pattern:** When switching presets (e.g., psr12 → laravel), do a single full-format commit and update the preset reference. Expect a large initial diff.
- **Custom-on-Preset Pattern:** Start with `laravel` preset, then add 2-3 custom overrides that the team feels strongly about (e.g., `"single_quote": true` or `"trailing_comma_in_multiline": true`).
- **Project-Split Pattern:** In monorepos, use different presets for different directories via nested pint.json files (e.g., Laravel preset for app code, PSR-12 for a PHP library in `packages/`).

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Default preset | Laravel vs PSR-12 vs PER vs Symfony | `laravel` for Laravel projects; `psr12` for framework-agnostic code |
| Preset documentation | Inline comments vs linked docs vs verbal | Linked documentation in CONTRIBUTING.md explaining why this preset was chosen |
| Custom rule override | Minimal vs comprehensive overrides | Minimal (3-5 rules) to avoid drifting too far from preset conventions |

## Tradeoffs

- **Laravel vs PSR-12:** Laravel preset includes conventions specific to the Laravel ecosystem (import ordering favoring facades) that may not be appropriate for non-Laravel projects. PSR-12 is neutral but misses the "Laravel feel."
- **PSR-12 vs PER:** Only PSR-12 is officially standardized by PHP-FIG; PER is a "best practices" evolution that many frameworks have adopted but hasn't reached the same standardization level. PER includes modern PHP patterns; PSR-12 is the conservative choice.
- **Preset vs Custom Ruleset:** Using a preset and adding overrides is simpler and more maintainable than defining all rules from scratch. A full custom ruleset offers complete control but requires extensive maintenance and documentation.

## Performance Considerations

- **Preset Rule Count:** The Laravel preset enables ~80 PHP-CS-Fixer rules; PSR-12 enables ~60; PER enables ~70; Symfony enables ~90. Rule count has negligible impact on formatting speed.
- **Preset Loading:** Presets are compiled into Pint at build time; switching presets has zero performance cost.
- **Custom Rule Overhead:** Adding custom rules on top of a preset adds negligible processing time (~1% per additional rule).

## Production Considerations

- **CI Consistency:** The CI pipeline must use the same preset as local development. The preset is specified in pint.json (committed), so consistency is automatic.
- **Team Onboarding:** Document the preset choice in the project's CONTRIBUTING.md. New team members should understand what conventions the preset enforces.
- **Preset Upgrade Path:** When upgrading Pint, check if preset definitions have changed. Rules within a preset may be added, removed, or changed between Pint versions.
- **Cross-Project Consistency:** If an organization maintains multiple Laravel projects, using the same preset across all projects ensures code style consistency even with different developers.

## Common Mistakes

- **Not setting a preset explicitly:** Omitting `"preset"` from pint.json defaults to `laravel`, which is fine for Laravel projects but may be unexpected for non-Laravel code
- **Switching presets mid-project without a full format:** Changing the preset creates thousands of style differences across the codebase; always do a full `pint` run and commit formatting changes after changing the preset
- **Assuming preset coverage:** Thinking the preset covers all style decisions; presets don't cover every possible formatting choice, and some rules may be left unconfigured
- **Not reviewing preset rules:** Using a preset without understanding what rules it enables; surprising formatting changes occur when running Pint for the first time
- **Overriding presets excessively:** Adding 30+ custom rules on top of a preset defeats the purpose of using a preset; consider defining a custom ruleset if the deviation is large

## Failure Modes

- **Preset Not Found:** An invalid preset name causes Pint to fall back to defaults or throw an error. Mitigate: verify preset name spelling (lowercase, exact match).
- **Preset Version Mismatch:** Pint upgrade changes preset behavior (rules added/removed). The same pint.json produces different results. Mitigate: lock Pint version; review preset changes on upgrade.
- **Conflicting Overrides:** Custom rules contradict preset defaults, producing unexpected formatting. Mitigate: understand preset rules before overriding; test on a sample file.
- **Preset + Custom Rule Overlap:** A rule configured both in the preset and custom section; the custom value wins, but the preset value is ignored silently. Mitigate: review effective rules with `pint --test -v`.

## Ecosystem Usage

- **Laravel Framework:** Uses the `laravel` preset for its own code (it's the authoritative implementation)
- **Laravel Packages:** First-party packages (Nova, Telescope, Horizon, Pulse) all use the `laravel` preset
- **Spatie:** Spatie's open-source Laravel packages use the `laravel` preset with minimal customizations
- **Laravel Teams:** Development agencies with multiple clients may use different presets per project depending on client requirements
- **PHP Libraries:** Libraries not tied to a specific framework typically use `psr12` or `per` for maximum interoperability

## Related Knowledge Units

- laravel-pint
- pint-configuration
- custom-pint-rules
- pint-ci-integration

## Research Notes

- The `laravel` preset was developed by analyzing Laravel's own codebase formatting practices and encoding them as PHP-CS-Fixer rules
- The `per` preset represents the PER coding style, which was standardized by the PHP-FIG as an evolution of PSR-2
- Between Pint versions, presets evolve as PHP-CS-Fixer adds new rules; running `pint -v` shows the effective rules being applied
- Presets are not extensible—you cannot define a custom preset JSON; custom "presets" are created by starting with an existing preset and adding custom rules in pint.json
