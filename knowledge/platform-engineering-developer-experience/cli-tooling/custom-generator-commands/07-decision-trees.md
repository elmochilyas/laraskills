# Decision Trees: Custom Generator Commands

## Metadata
- **KU ID:** cli-tooling-artisan-extensions/custom-generator-commands
- **Subdomain:** cli-tooling-artisan-extensions
- **Domain:** platform-engineering-developer-experience
- **Phase:** 4 (Experience Curation)
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | Base class selection | `GeneratorCommand` / Base `Command` / Custom abstract | Leveraging built-in scaffolding vs custom file generation |
| 2 | Stub location | `/stubs` project root / Package stubs / Vendor stubs | Version control and customization strategy |
| 3 | Namespace resolution | Auto-detect / Hard-coded / Config-driven | PSR-4 compliance and portability across projects |
| 4 | Multi-file generation | Single generator / Composed commands / Orchestrator | Generating model+controller+request+test from one command |
| 5 | Overwrite behavior | Prompt / `--force` only / Always overwrite | Safety vs convenience when files already exist |

## Architecture-Level Decision Trees

### Tree 1: Base Class Selection

- **Start:** Choosing the command base class
- **Is the command generating a single file from a template?**
  - Yes → Extend `Illuminate\Console\GeneratorCommand`. Handles stub loading, namespace resolution, existence checks, and output messaging automatically.
  - No → Continue.
- **Does the command generate multiple files?**
  - Yes → Extend base `Command`. Compose multiple `GeneratorCommand` calls or call built-in make commands via `$this->call()`.
  - No → Use `GeneratorCommand` for standard single-file generation.
- **Custom behavior:** Override `getStub()` for stub path, `getDefaultNamespace()` for namespace, `buildClass()` for custom placeholders.

### Tree 2: Stub Location and Management

- **Start:** Deciding where to store stub files
- **Are stubs shared across the team and version-controlled?**
  - Yes → Store in `/stubs` at project root. Use `base_path('stubs/my-stub.stub')` in `getStub()`. Check stubs into VCS.
  - No → Continue.
- **Are stubs customized from Laravel's defaults?**
  - Yes → Publish vendor stubs with `php artisan stub:publish`. Edit in `/stubs`. Team gets consistent customization.
  - No → Use package-internal stubs. Not customizable without publishing.
- **Stub format:** PHP template with `{{ placeholder }}` variables. Use `{{ class }}`, `{{ namespace }}`, `{{ rootNamespace }}`, and custom placeholders.

### Tree 3: Namespace Resolution

- **Start:** Determining the output namespace
- **Is the generated class in the standard `App\*` namespace?**
  - Yes → Use `getDefaultNamespace($rootNamespace)` returning `"{$rootNamespace}\\DataTransferObjects"`. Auto-detects PSR-4 namespace from composer.json.
  - No → Continue.
- **Is the generated class a test?**
  - Yes → Override `rootNamespace()` to return `Tests`. Otherwise tests get `App\*` namespace and fail autoloading.
  - No → Hard-code namespace only as last resort. Config-driven namespaces are more maintainable.

### Tree 4: Multi-File Generation Strategy

- **Start:** Creating a command that generates multiple files
- **Does the command need to generate a model + controller + request + test?**
  - Yes → Compose built-in make commands using `$this->call('make:model', ['name' => $name])`. Leverages existing generators.
  - No → Continue.
- **Are generated files specific to a custom pattern (DTO, Action, ViewModel)?**
  - Yes → Create individual `GeneratorCommand` classes per type. Orchestrate from a parent command if needed.
  - No → Single generator is sufficient.
- **Orchestrator pattern:** Parent command collects input, calls multiple `$this->call()` to individual generators. Each generator handles one file type. Respects `--force` flag.
