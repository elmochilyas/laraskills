# Knowledge Unit: Blueprint YAML DSL

## Metadata
- **Subdomain:** Code Generation & Scaffolding
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-generation-scaffolding/blueprint-yaml-dsl
- **Maturity:** Mature
- **Related Technologies:** Blueprint, Laravel, PHP, YAML

## Executive Summary

Blueprint's YAML DSL (Domain-Specific Language) is the declarative specification format used to define Laravel application components for code generation. Written in a `draft.yaml` file, the DSL describes models with columns, data types, modifiers, and relationships; controllers with actions, validation rules, authorization, and response types; and configuration for generation behavior. The DSL supports: column definitions (`name: string`, `email: string:unique`), relationship inference (foreign key conventions trigger belongsTo/hasMany), pivot tables (many-to-many via underscores), UUID support, soft deletes, timestamps control, and polymorphic relationships. The DSL is designed to be readable, concise, and expressive—a full CRUD component can be defined in 15-30 lines of YAML.

## Core Concepts

- **Model Definitions:** YAML keys under `models:` with column definitions as key-value pairs: `name: string` creates a `name` column with string type
- **Data Types:** Blueprint supports Laravel column types: `string`, `text`, `integer`, `bigInteger`, `boolean`, `date`, `datetime`, `timestamp`, `float`, `decimal`, `json`, `uuid`, `ulid`
- **Modifiers:** Chained after the type with colon: `email: string:unique`, `age: integer:nullable:default(18)`, `content: text:nullable`
- **Relationships:** Auto-detected from foreign key columns (`user_id` → belongsTo User); explicit `relationships:` block for custom relations or pivot tables
- **Controller Actions:** `resource`, `api`, or specific actions (`index`, `show`, `create`, `store`, `edit`, `update`, `destroy`) with validation rules defined inline
- **Pivot Tables:** Many-to-many relationships defined with the `pivot` modifier: `belongsToMany: Role` with `pivot: true`
- **Polymorphic Relations:** Defined with `morphTo` and `morphMany`/`morphToMany` relationship types

## Mental Models

- **DSL as Schema Language:** Blueprint YAML is a schema definition language—like SQL DDL but expressed in YAML with Laravel-specific conventions
- **DSL as Component Spec:** Each YAML block is a specification for a Laravel component; the DSL describes what to build, not how to build it
- **DSL as Blueprint for Code:** The YAML file is the architectural plan; Blueprint reads it like a builder reads construction plans and generates the actual code structure

## Internal Mechanics

1. **YAML Lexing/Parsing:** Blueprint uses Symfony's YAML parser to convert the draft file into a PHP array
2. **Normalization:** The raw array is normalized: column types are validated against the supported type map, modifiers are parsed, relationships are inferred from column naming conventions
3. **Column Type Mapping:** `string` maps to `Illuminate\Database\Schema\Blueprint::string()`, `text` → `text()`, etc.; extended types like `uuid` → `uuid()`
4. **Inferred Relationships:** Columns ending in `_id` (e.g., `user_id`) trigger belongsTo inference; the referenced model name is derived from the column prefix (`user` → `User`)
5. **Validation Rule Generation:** Inline validation rules in controller definitions are parsed and converted to Laravel validation arrays: `'required|email|unique:users'`
6. **Tree Construction:** The normalized definitions are assembled into a `Blueprint\Tree` object tree that drives code generation

## Patterns

- **Explicit Relationship Pattern:** When auto-inference fails (non-standard FK names), use the explicit `relationships:` block to define relations with full control
- **Controllerless Model Pattern:** Define a model without a controller section for utility/value objects that don't have CRUD endpoints
- **API-Only Pattern:** Use `controllers:` with `api: true` to generate API-only controllers without `create`/`edit` views
- **Validation Inline Pattern:** Define validation rules directly in the controller action definition: `store: { validate: { name: 'required|min:3', email: 'email|unique:users' } }`
- **Component Scoping Pattern:** Use `--only=model,migration` flag to generate only specific components from the full YAML definition

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Naming convention | snake_case vs CamelCase vs kebab-case | snake_case for columns (Laravel convention); StudlyCase for model names |
| Relationship inference | Auto from FK vs explicit definition | Auto for standard conventions; explicit for non-standard or pivot relationships |
| Timestamps control | Include vs exclude `timestamps()` | Include by default; `timestamps: false` to disable on specific models |
| Soft deletes | `softDeletes: true` vs manual migration addition | Use DSL for soft deletes rather than manual migration editing |
| UUID/ULID | `id: uuid` vs `id: ulid` | UUID for distributed systems; ULID for sortable unique IDs |

## Tradeoffs

- **Conciseness vs Explicitness:** Blueprint's DSL infers many details (relationships, timestamps, controller actions), making it very concise but potentially surprising. Explicitly declare non-obvious relationships for clarity.
- **DSL Flexibility vs Laravel Flexibility:** The DSL covers 80% of common patterns but can't express all Laravel features (custom casts, model traits, observer registration, custom collections). For edge cases, generate the base and extend manually.
- **Inference vs Configuration:** Auto-inferred relationships save writing but can produce incorrect results for non-standard FK naming conventions. When in doubt, use explicit relationship definitions.

## Performance Considerations

- **YAML Parsing Speed:** Blueprint's YAML parsing is efficient—files with 20 models parse in <20ms. Deeply nested YAML with many controller actions may take marginally longer.
- **Definition Complexity:** The DSL itself has negligible performance impact. Generation time is dominated by file I/O (writing generated PHP files), not YAML parsing.
- **Large Drafts:** Draft files with 50+ models and controllers may take 100-200ms to parse. This is a one-time cost per `blueprint:build` invocation.

## Production Considerations

- **DSL Versioning:** The `draft.yaml` should be treated as source code—committed to version control, reviewed in PRs, and subjected to the same quality processes as PHP code.
- **CI Validation:** Validate `draft.yaml` in CI: `php artisan blueprint:validate` ensures the DSL is well-formed before it's used for generation.
- **DSL Evolution:** As Blueprint releases new versions, the DSL may gain features. Review changelogs before upgrading to ensure backward compatibility of existing draft files.
- **Documentation:** Document custom conventions or deviations from standard Blueprint DSL patterns in a project README to help team members understand the generation setup.

## Common Mistakes

- **Incorrect indentation:** YAML is indentation-sensitive; using 3 spaces instead of 2 (or mixing tabs and spaces) causes parse failures
- **Missing type for relationships:** Defining `user_id: integer` instead of relying on Blueprint's relationship inference; the FK works but the relationship isn't generated
- **Over-nesting models:** Putting all models under a single `models:` block when they're better organized into logical groups; Blueprint supports nested model organization
- **Inconsistent naming:** Mixing singular and plural model names inconsistently; Blueprint expects singular model names (User, Post, Comment)
- **Forgetting the `id` column:** Blueprint generates an auto-incrementing `id` primary key by default; only specify `id` for non-standard types (`id: uuid`)

## Failure Modes

- **YAML Parse Failure:** Invalid YAML syntax causes `blueprint:build` to fail with a non-specific error. Mitigate: use `blueprint:validate` first; use a YAML linter in the editor.
- **Undefined Relationship Target:** A relationship references a model that doesn't exist in the draft or application. Mitigate: Blueprint generates the referenced model definition if it's defined elsewhere in the draft.
- **Type Mapping Not Found:** A column type is misspelled or unsupported (`striing` instead of `string`). Mitigate: Blueprint shows an error with the unrecognized type and the list of supported types.
- **Duplicate Model Name:** Two models with the same name in different namespaces causing conflict. Mitigate: use unique model names or namespace segregation.

## Ecosystem Usage

- **Blueprint Generator:** The DSL is the primary input format for Blueprint's code generation engine
- **Team Collaboration:** Teams use the DSL as a shared specification document—product owners describe the data model, developers generate the code
- **API Documentation:** The DSL serves as a rough API specification; the generated models and controllers reflect the defined data structures
- **CI/CD Integration:** Draft validation is often integrated into CI pipelines to ensure the DSL remains valid as the project evolves

## Related Knowledge Units

- blueprint-code-generation
- stub-customization-laravel
- custom-artisan-make-commands

## Research Notes

- Blueprint's YAML DSL was inspired by Ruby on Rails' scaffolding generators but adds Laravel-specific features like form requests, resource classes, and policy integration
- The DSL syntax has evolved significantly since Blueprint 1.x; the current 2.x syntax is more expressive with support for conditional validation, pivot tables, and polymorphic relationships
- Column type modifiers (`:unique`, `:nullable`, `:default(value)`) are a Blueprint innovation not found in other code generation tools
- The DSL intentionally omits certain features (like model events, observer generation) to keep the specification focused on data structure rather than behavior
