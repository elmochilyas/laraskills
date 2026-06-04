# Knowledge Unit: Pint Configuration

## Metadata
- **Subdomain:** Code Quality & Static Analysis
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-quality-static-analysis/pint-configuration
- **Maturity:** Mature
- **Related Technologies:** Laravel Pint, PHP-CS-Fixer, PHP, JSON

## Executive Summary

Laravel Pint configuration is defined in a `pint.json` file at the project root, controlling which preset to use, custom rule overrides, and file/directory exclusions. The configuration supports: preset selection (`laravel`, `psr12`, `per`, `symfony`), rule enable/disable (individual PHP-CS-Fixer rules from bundled `php-cs-fixer/shim`), rule configuration (complex rules with sub-options), path exclusions (`notPath`, `notName`), single-file targeting (`--filter`), and output formatting. `pint.json` is committed to version control and shared across the team. A minimal config can be as short as `{"preset": "laravel"}`, while a comprehensive config may define 20-50 custom rules. Pint also supports per-directory configuration (via a nested `pint.json` in subdirectories) and CLI-flag overrides.

## Core Concepts

- **pint.json:** The configuration file, JSON format, placed in the project root. Optional—Pint works with zero configuration using the `laravel` preset.
- **Preset:** A predefined set of PHP-CS-Fixer rules: `laravel` (Laravel convention), `psr12` (PSR-12 standard), `per` (PER coding style), `symfony` (Symfony convention)
- **Rules:** PHP-CS-Fixer rules enabled, disabled, or configured beyond the preset defaults; follows PHP-CS-Fixer's rule naming (snake_case)
- **Exclude:** Directories and files to skip during formatting; uses relative paths from the project root and Gitignore-style patterns
- **NotPath/NotName:** String/regex patterns for excluding specific file paths or filenames from formatting
- **Preset Override:** The `rules` section overrides preset defaults—use `true` to enable, `false` to disable, arrays for configurable rules

## Mental Models

## Internal Mechanics

## Patterns

- **Minimal Config Pattern:** Start with preset-only config: `{"preset": "laravel"}`. Add custom rules only when the team disagrees with a specific Laravel convention.
- **Team Convention Override Pattern:** Document team-specific style decisions in pint.json: `"single_quote": true` (if team prefers single quotes) or `"trailing_comma_in_multiline": true` for cleaner diffs.
- **Legacy Code Exclusion Pattern:** Exclude directories with legacy code that can't be formatted (yet): `"exclude": ["app/Legacy", "app/ThirdParty"]`
- **Generated File Exclusion Pattern:** Exclude generated code from Pint: `"notPath": ["bootstrap/cache/*", "storage/framework/views/*"]`
- **Per-Directory Config Pattern:** Place a `pint.json` in subdirectories with different presets (e.g., `app/Legacy/pint.json` with `"preset": "psr12"` while main project uses `laravel`).
- **Rule Documentation Pattern:** Add comments to pint.json using `_` prefixed keys (JSON doesn't support comments natively, but some teams use this convention): `"_note": "We prefer single quotes to match the Laravel core team's style"`

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Preset choice | Laravel vs PSR-12 vs PER vs Symfony | `laravel` for most Laravel projects; matches Laravel's own style |
| Custom rules | Minimal (0-5) vs moderate (5-20) vs comprehensive (20+) | Minimal (0-5) for most teams; comprehensive only when strong opinions exist |
| Documentation | Inline `_comments` vs external style guide vs no docs | External CONTRIBUTING.md reference; pint.json as source of truth |
| Exclusion strategy | None vs narrow (few exclusions) vs broad (many exclusions) | Narrow for clean codebases; broad for migration/monorepo projects |

## Tradeoffs

- **Preset Only vs Custom Rules:** Preset-only configuration is simple and follows Laravel conventions but may not match team preferences. Custom rules match team style but require maintenance when Pint/PHP-CS-Fixer updates.
- **Few Exclusions vs Many Exclusions:** Few exclusions means more code is formatted consistently but may break code that doesn't follow conventions. Many exclusions protect legacy code but allow style inconsistency in the codebase.
- **Global vs Per-Directory Config:** Global config is simpler and ensures consistency. Per-directory config allows different standards for different parts of the project (e.g., app code vs tests) but makes the effective ruleset harder to understand.

## Performance Considerations

- **Configuration Parsing:** pint.json is parsed once per Pint invocation. The file is typically <5KB, parsing is negligible (<1ms).
- **Exclusion Pattern Evaluation:** `notPath` and `notName` patterns are evaluated for each discovered file. Simple glob patterns are fast; complex regex patterns add marginal overhead.
- **Multiple Config Files:** If Pint encounters a nested `pint.json` in a subdirectory, it uses that config for files in that subtree. Scanning for nested configs adds minimal overhead.

## Production Considerations

- **Version Control:** Commit pint.json to version control. All team members and CI use the same configuration.
- **CI Consistency:** CI must use the same pint.json (committed) and same Pint version (via composer.lock). Pipeline validation can verify config matches expected checksum.
- **Configuration Review:** Treat pint.json changes like code changes—review in PRs, discuss in code reviews. A change to `"single_quote": false` affects the entire codebase.
- **Team Onboarding:** Include pint.json explanation in CONTRIBUTING.md. New team members should understand why specific rules are configured.

## Common Mistakes

- **Invalid JSON:** Trailing commas, missing quotes, or other JSON syntax errors cause Pint to fail silently or use defaults. Validate with a JSON linter.
- **Forgetting preset selection:** Not explicitly setting `"preset"` defaults to `laravel`, which may surprise teams expecting psr12 behavior.
- **Mixing rule enable/disable incorrectly:** Setting a rule to `false` (disable) when the intent is to keep the preset value `null` (inherit from preset); `false` explicitly disables what the preset enables.
- **Not excluding generated code:** Pint formats cached views, compiled configs, and generated helper files, causing large diffs and CI failures.
- **Missing quotes around rule names:** Rule names with underscores need quotes in JSON; unquoted keys cause JSON parse errors.

## Failure Modes

- **Config Not Found:** Pint runs without pint.json (uses defaults). If the team expects custom rules, they're not applied. Mitigate: validate pint.json exists in CI; use `--config=pint.json` explicitly.
- **Unknown Rule Name:** A rule name in pint.json doesn't exist in Pint's bundled PHP-CS-Fixer version. Pint ignores unknown rules silently. Mitigate: validate rules against Pint's documentation.
- **Exclusion Pattern Mistmatch:** An exclusion pattern doesn't match the intended files (wrong path, wrong glob). Files are formatted unintentionally. Mitigate: run `pint --test` first to verify exclusion behavior.
- **Config Version Incompatibility:** Pint version upgrade removes a rule or changes its name. Mitigate: lock Pint version; review config after upgrades.

## Ecosystem Usage

- **Laravel Framework:** Laravel itself uses pint.json for its own code formatting
- **Laravel Packages:** Most first-party (Nova, Horizon, Telescope, Pulse, Sail) and third-party (Spatie packages) use pint.json
- **Laravel Teams:** Development teams maintain pint.json as part of project setup, typically with custom rules for team conventions
- **Open Source Laravel:** GitHub projects include pint.json to guide contributor formatting, often with CI enforcement

## Related Knowledge Units

- laravel-pint
- pint-presets
- pint-ci-integration
- custom-pint-rules

## Research Notes

- pint.json uses JSON rather than PHP-CS-Fixer's PHP-based configuration for simplicity and language-agnostic parsing
- Pint supports a `.pint.json` filename as an alternative to `pint.json` (useful for project root clutter reduction)
- Nested pint.json files override parent configuration for files in their directory subtree; this is useful for monorepos or projects with mixed coding standards
- The `exclude` array in pint.json supports glob-style patterns (`app/Legacy/*`) and overrides the default exclusion list (which includes `vendor`, `node_modules`, `storage`, etc.)
