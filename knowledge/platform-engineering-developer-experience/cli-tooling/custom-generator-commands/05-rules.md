# Rules: Custom Generator Commands

## Metadata
- **Source KU:** custom-generator-commands
- **Subdomain:** CLI Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- GEN-RULE-001: **Extend GeneratorCommand** — Use base class for stub processing, namespace detection, existence checks.
- GEN-RULE-002: **Custom placeholders in `buildClass()`** — Override to add project-specific replacement variables.
- GEN-RULE-003: **Respect `--force`** — Follow Laravel convention to overwrite existing files when `--force` is passed.
- GEN-RULE-004: **Validate class names** — Use `Str::studly()` and provide clear error feedback for invalid names.
- GEN-RULE-005: **Version stubs in VCS** — Checked-in stubs ensure all developers generate the same code.
- GEN-RULE-006: **Document migration paths** — When stubs change, provide commands to update generated files.

## Architecture Rules
- GEN-RULE-007: **Store shared stubs in `/stubs`** at project root; use `base_path('stubs/my-stub.stub')` in `getStub()`.
- GEN-RULE-008: **Override `rootNamespace()`** for test generators returning `Tests` namespace.
- GEN-RULE-009: **For multi-file generation**, compose multiple `GeneratorCommand` calls or use a custom Command.

## Decision Rules
- GEN-RULE-010: **Use for creating app-specific classes** (DTOs, Actions, Services, ViewModels) with consistent structure.
- GEN-RULE-011: **Use built-in `php artisan make:` commands** for single-use scaffolding tasks.
- GEN-RULE-012: **Skip when stub maintenance overhead outweighs manual creation time.**
