# 07-Decision Trees: Custom Artisan Make Commands

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | custom-artisan-make-commands |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Build vs Manual | Whether to create a custom generator or write classes manually | Do we create this pattern frequently enough to justify a generator? |
| D02 | Stub Design | How to structure the stub template | What is fixed structure vs variable content in the generated class? |
| D03 | Command Options | Which customization flags to support | What variations of the generated class do users need? |
| D04 | Registration | How to make the command discoverable | How do developers find and use the new make command? |

## Architecture-Level Decision Trees

### D01: Build vs Manual

```
START: Should we build a custom make command?
│
├── Build a generator (≥10 uses expected)
│   ├── Pattern: class follows same structure each time
│   ├── Examples: DTO, Action, Service, Enum, Trait
│   ├── Benefit: 1-3s to generate vs 2-5min manual creation
│   ├── Benefit: enforces team conventions automatically
│   └── Proceed if: pattern appears 10+ times in project
│
├── Manual creation (<10 uses)
│   ├── Pattern: highly variable structure
│   ├── Risk: generator maintenance exceeds manual effort
│   ├── Alternative: use stub:publish for built-in commands
│   └── Better: copy-paste from examples
│
├── Built-in alternative available?
│   ├── Yes → Use existing make: command with stub customization
│   │   Example: make:model, make:controller with custom stubs
│   └── No → Build custom command extending GeneratorCommand
│
└── Decision factors
    ├── Frequency: how many times will this command be used?
    ├── Consistency: do all instances follow the same structure?
    ├── Complexity: are there multiple variants (options, flags)?
    └── Maintenance: can stubs stay stable across Laravel upgrades?
```

### D02: Stub Design

```
START: How should we design the stub template?
│
├── Stub content principles
│   ├── Fixed structure: class declaration, namespace, use statements
│   ├── Variable content: {{ placeholders }} for class name, namespace
│   └── No control structures: keep logic in buildClass() method
│
├── Standard placeholders (provided by GeneratorCommand)
│   ├── {{ class }} — class name from command argument
│   ├── {{ namespace }} — resolved namespace
│   ├── {{ rootNamespace }} — project root (App\ or custom)
│   └── {{ namespacedModel }} — full model path (for model-related generators)
│
├── Custom placeholders
│   ├── Define in buildClass() with str_replace
│   ├── Prefix custom placeholders to avoid collisions
│   │   Example: {{ dtoParent }} instead of {{ parent }}
│   └── Common custom placeholders:
│       ├── {{ datetime }} — generation timestamp
│       ├── {{ parentClass }} — parent class name option
│       └── {{ traits }} — comma-separated trait list
│
└── Stub storage
    ├── Project stubs: store in /stubs directory (version controlled)
    ├── Package stubs: ship within package, reference with __DIR__
    └── Format: descriptive names like action.stub, dto.stub
```

### D03: Command Options

```
START: What options should the make command support?
│
├── Required options (all generators)
│   ├── {name} — class name argument (inherited from GeneratorCommand)
│   ├── --force — overwrite existing files (inherited)
│   ├── Consistent with Laravel make: command conventions
│   └── Provide --help output for team reference
│
├── Recommended options
│   ├── --invokable — generate single-action class
│   ├── --parent=ParentClass — extends a base class
│   ├── --namespace — custom namespace override
│   ├── --traits=Trait1,Trait2 — inject specific traits
│   └── --type=type — variant selection for multi-template commands
│
├── GeneratorCommand methods to override
│   ├── getStub() — return stub path (can vary by options)
│   ├── getDefaultNamespace() — set target namespace
│   ├── buildClass() — custom placeholder replacement
│   ├── rootNamespace() — override for test generators
│   └── alreadyExists() — customize conflict handling
│
└── UX conventions
    ├── Signature: 'make:action {name} {--force} {--invokable}'
    ├── Description: clear one-line description
    ├── Output: success message with path to created file
    └── Error: clear message when file exists (without --force)
```

### D04: Registration

```
START: How do we register and discover the command?
│
├── Manual registration
    ├── Add to config/app.php providers or AppServiceProvider
    ├── Register: $this->commands([MakeAction::class]);
    └── Best for: small projects, few generators
│
├── Auto-discovery (Laravel 11+)
    ├── Place in app/Console/Commands/
    ├── Laravel auto-discovers all commands in this directory
    ├── Best for: most projects
    └── Conforms to Laravel convention
│
└── Verification
    ├── Run: php artisan list make:
    ├── Command appears under make: namespace
    ├── Run: php artisan make:action TestAction → file created
    ├── Verify: file created in correct namespace and directory
    └── Document: add available make commands to CONTRIBUTING.md
```
