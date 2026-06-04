# Knowledge Unit: Blueprint Code Generation

## Metadata
- **Subdomain:** Code Generation & Scaffolding
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-generation-scaffolding/blueprint-code-generation
- **Maturity:** Mature
- **Related Technologies:** Blueprint, Laravel, PHP, YAML, Artisan

## Executive Summary

Blueprint is an open-source code generation tool for Laravel that reads YAML definition files and generates complete, production-ready components: models, controllers (including API/CRUD), form requests, migrations, factories, seeders, tests, events, jobs, mailables, notifications, and routes. It follows Laravel conventions and best practices—generated code uses type hints, form request validation, resource classes, and proper model relationships. Blueprint operates on a declarative model: you describe your application's data model and controllers in a `draft.yaml` file, and Blueprint generates all associated Laravel components. It's designed to accelerate development by eliminating repetitive CRUD scaffolding while maintaining full customizability—generated code can be modified like hand-written code.

## Core Concepts

- **draft.yaml:** The Blueprint definition file that describes models, controllers, relationships, and validation rules in YAML
- **Model Definitions:** YAML blocks defining model name, columns, data types, modifiers (nullable, unique, default), and relationships
- **Controller Definitions:** Controller sections defining resourceful actions with validation rules, authorization checks, and response types
- **Generated Components:** All generated files (model, migration, controller, request, factory, seeder, test) follow Laravel's latest conventions
- **Blueprint Cache:** Blueprint caches analyzed definitions to speed up regeneration; invalidate with `blueprint:erase` or `--erase` flag
- **Tracing:** `--trace` flag provides detailed output of the generation process for debugging complex definitions

## Mental Models

- **Blueprint as Compiler:** Blueprint compiles a high-level YAML specification into low-level Laravel code—similar to how a compiler transforms source code into machine code
- **YAML as Blueprint:** The `draft.yaml` file is the architectural blueprint; Blueprint translates it into working Laravel components, just as architectural plans become a building
- **Blueprint as Scaffolding Engine:** Like Laravel's `make:` commands on steroids—one YAML file replaces running `make:model`, `make:controller`, `make:migration`, `make:factory`, `make:seeder`, `make:test` individually

## Internal Mechanics

1. **YAML Parsing:** Blueprint reads `draft.yaml` and parses it into an internal tree model using Symfony YAML parser, validating structure and types
2. **Definition Tree Building:** The parsed YAML is converted into `Blueprint\Tree` objects (Model, Controller, etc.) with normalized column types, relationships, and validation rules
3. **Generator Dispatch:** Each tree node (model, controller) is dispatched to the appropriate generator class (ModelGenerator, ControllerGenerator, MigrationGenerator, etc.)
4. **Stub Processing:** Each generator uses Laravel stubs (customizable via `stub:publish`) to render PHP code with definition-derived values
5. **File Writing:** Generated code is written to the appropriate Laravel directories (app/Models, database/migrations, etc.) with proper namespace resolution
6. **Test Generation:** Blueprint generates PHPUnit/Pest tests based on the controller definitions, including HTTP tests for each defined action

## Patterns

- **Data-First Development Pattern:** Write `draft.yaml` first to define the application's data model and relationships, then generate all associated code
- **Iterative Refinement Pattern:** Start with a minimal `draft.yaml`, generate code, add custom logic, then extend the YAML for additional features; regenerate without overwriting custom code by using version control
- **Thin Controller Pattern:** Blueprint generates controllers that delegate to form requests for validation and models for data access, keeping controllers thin
- **Full CRUD Pattern:** Define a model with all relationships and a resource controller with index/create/store/show/edit/update/destroy actions; Blueprint generates the complete CRUD structure
- **API Resource Pattern:** For API-first applications, Blueprint generates API controllers with resource classes, API routes, and JSON response structures

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Definition file location | Project root vs config directory vs custom path | Project root (`draft.yaml`) by convention; override with `--path` |
| Generation scope | Single model vs full application | Single model for focused changes; full application for initial scaffolding |
| Controller style | Resource vs API vs invokable | Resource for web apps; API for API-first; invokable for single-action endpoints |
| Validation approach | Form request vs rule arrays | Form request (default) for reusability; rule arrays for simple cases |
| Test framework | PHPUnit vs Pest | Follow project convention (Blueprint detects phpunit.xml to choose) |

## Tradeoffs

- **Speed vs Customization:** Blueprint generates code instantly but the generated code follows conventions that may not match your project's patterns. Hand-written code is fully customized but much slower to produce.
- **Upfront Design vs Iterative Development:** Blueprint requires thinking about the data model upfront (similar to schema-first design). This conflicts with highly iterative development where models evolve rapidly.
- **Complete vs Partial Generation:** Blueprint generates everything (model, migration, controller, etc.) but you may only need parts. Use `--only=model,controller` flags to limit generation scope.

## Performance Considerations

- **Generation Speed:** Blueprint generates a complete CRUD component (model, migration, controller, requests, factory, tests) in 1-3 seconds. This is significantly faster than running individual `make:` commands.
- **Draft File Parsing:** YAML parsing is fast (<10ms for typical files). Complex files with many models (>50) may take 50-100ms to parse.
- **Cache Benefits:** Cached definitions speed up regeneration by 50-80%. Use `--erase` only when the underlying Laravel application structure (classes, namespaces) has changed.

## Production Considerations

- **Generated Code Review:** Always review generated code before committing. Blueprint follows conventions but may produce code that doesn't match your specific requirements.
- **Version Control the Draft:** The `draft.yaml` file should be committed to version control as the authoritative specification. Regeneration from the same YAML should produce identical code.
- **CI Validation:** In CI, validate that generated code is up-to-date with the draft file. This prevents drift between specification and implementation.
- **Customizations After Generation:** Treat generated code as a starting point. After generating, add custom business logic, modify controllers, and extend models. Blueprint's generation artifacts are not read-only—they're editable Laravel files.

## Common Mistakes

- **Over-reliance on generation:** Generating everything from Blueprint and never customizing; real applications need custom business logic beyond CRUD
- **Not reviewing generated migrations:** Blueprint generates migrations based on YAML column types, but the generated schema may not match your actual database design (indexes, foreign keys, cascades)
- **Editing draft.yaml without regenerating:** Updating the YAML but forgetting to run `blueprint:build`; the code falls out of sync with the specification
- **Regenerating over customized code:** Running `blueprint:build` again after customizing generated controllers/migrations overwrites changes; use version control to manage regeneration
- **Complex YAML leading to errors:** Deeply nested or poorly indented YAML causes parsing failures; validate YAML with `php artisan blueprint:validate` before building

## Failure Modes

- **YAML Parse Error:** Invalid YAML (indentation, syntax) causes `blueprint:build` to fail with a parse error. Mitigate: validate with `blueprint:validate` and use a YAML linter.
- **Namespace Conflict:** Blueprint generates a model with a name that conflicts with an existing class. Mitigate: check `--models` listing before generation.
- **Unsupported Relationship Detection:** Blueprint may not correctly detect certain relationship types from column naming conventions. Mitigate: explicitly define relationships in YAML.
- **Regeneration Overwrite:** Running `blueprint:build` on an existing project overwrites previously generated files. Mitigate: use version control and `git diff` to review changes.

## Ecosystem Usage

- **Laravel Shift:** Blueprint was created by the same team behind Laravel Shift; it shares similar code generation philosophies
- **New Laravel Projects:** Blueprint is commonly used at the start of Laravel projects to scaffold the initial application structure
- **API Development:** Blueprint is particularly popular for API applications where the data model maps directly to API resources
- **Prototyping:** Used for rapid prototyping—define models, generate, validate with tests, iterate

## Related Knowledge Units

- blueprint-yaml-dsl
- custom-artisan-make-commands
- stub-customization-laravel
- laravel-shift

## Research Notes

- Blueprint was created by Jason McCreary (Laravel Shift founder) and is maintained as an open-source tool alongside the commercial Shift service
- Blueprint 2.x added support for multiple relationship types (belongsTo, hasMany, belongsToMany, hasOne, morphMany, morphToMany) and polymorphic relationships
- The tool uses Laravel's stub system for generation, meaning it respects custom stubs published via `php artisan stub:publish`
- Community contributions have added support for Pest tests, UUID primary keys, soft deletes, and spatie/laravel-permission integration
