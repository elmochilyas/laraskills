# 07-Decision Trees: Stub Customization in Laravel

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | stub-customization-laravel |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Customize vs Default | Whether to customize stubs or use defaults | Do existing stubs need modification for team conventions? |
| D02 | Stub Content Strategy | What to include in customized stubs | What is structural boilerplate vs team-specific conventions? |
| D03 | Stub Lifecycle | How to manage stubs over time | How do we keep stubs updated across Laravel versions? |
| D04 | Custom Stub Files | Creating stubs for custom generator commands | Do existing maker stubs cover our needs or do we need new ones? |

## Architecture-Level Decision Trees

### D01: Customize vs Default

```
START: Should we customize Laravel's stubs?
│
├── Keep defaults (no customization)
│   ├── Use when: happy with standard Laravel scaffolding
│   ├── Use when: no team-wide conventions to enforce
│   ├── Pro: zero maintenance, always up to date
│   ├── Con: no standardization beyond framework defaults
│   └── Best for: solo projects, small teams without strong conventions
│
├── Minimal customization (3-5 stubs)
│   ├── Use when: need specific conventions across codebase
│   ├── Common customizations:
│   │   ├── Add declare(strict_types=1) to all classes
│   │   ├── Add project-specific base class imports
│   │   ├── Add common traits (HasUuid, SoftDeletes) to model stub
│   │   └── Add return type hints to controller stub
│   ├── Pro: enforces quality standards automatically
│   ├── Con: need to maintain stubs across Laravel upgrades
│   └── Best for: most teams
│
├── Heavy customization (10+ stubs)
│   ├── Use when: strong architectural conventions in the team
│   ├── Examples: always-injected interfaces, custom base classes
│   ├── Risk: high maintenance, may clash with future Laravel changes
│   └── Consider: is a trait or base class more appropriate than a stub?
│
└── Decision rule: if convention can be enforced at runtime (trait/interface), do that instead
    ├── Stub: structural conventions (namespaces, imports, class structure)
    ├── Trait: behavioral conventions (methods, properties)
    └── Base class: shared interface conventions
```

### D02: Stub Content Strategy

```
START: What should we include in customized stubs?
│
├── Structural elements (good for stubs)
│   ├── declare(strict_types=1) — enforce strict types
│   ├── Namespace and class structure — matches project conventions
│   ├── Import statements — common use classes
│   ├── Base class extension — project-specific base classes
│   ├── Trait usage — common behavioral traits
│   └── Method signatures with type hints — consistent typing
│
├── Business logic (NOT for stubs)
│   ├── Application-specific methods
│   ├── Complex control structures
│   ├── Configuration values or constants
│   └── Anything that varies per use case
│
├── What to avoid
│   ├── Hard-coded credentials or secrets
│   ├── Environment-specific values
│   ├── Too many conditional variants (use separate stubs)
│   └── Heavy documentation blocks (keep generated code clean)
│
└── Placeholder usage
    ├── Standard: {{ class }}, {{ namespace }}, {{ rootNamespace }}
    ├── Custom: define in buildClass() with str_replace
    ├── Always prefix custom placeholders to avoid collisions
    └── Test output after every stub change
```

### D03: Stub Lifecycle

```
START: How do we manage stubs over time?
│
├── Initial setup
│   ├── Run: php artisan stub:publish
│   ├── Commit stubs/ directory to VCS
│   ├── Customize stubs as needed
│   └── Verify: run make: commands and check output
│
├── Laravel upgrade handling
│   ├── Backup custom stubs before upgrading Laravel
│   ├── Run stub:publish to get new vendor stubs
│   ├── Diff old vendor stubs vs new vendor stubs
│   ├── Port any relevant framework changes to custom stubs
│   ├── Re-apply team customizations
│   └── Test: run make: commands and verify output
│
├── Ongoing maintenance
│   ├── Review stubs quarterly for relevance
│   ├── Update when coding standards evolve
│   ├── PR review for stub changes (they affect all future code)
│   └── Document stub conventions for the team
│
└── Stub deprecation
    ├── When a stub is no longer needed
    ├── Remove from stubs/ directory
    ├── Fallback: Laravel uses vendor default
    └── Update documentation
```

### D04: Custom Stub Files

```
START: Do we need stubs beyond the published ones?
│
├── Use built-in stubs (publish + customize)
│   ├── Covers: model, controller, migration, seeder, factory, test
│   ├── Covers: request, policy, event, listener, job, mail, notification
│   ├── Covers: rule, command, channel, middleware, provider, resource
│   └── Most projects: only need these
│
├── Create custom stubs for custom generators
│   ├── When: building make:dto, make:action, make:service commands
│   ├── Store in stubs/ directory alongside published stubs
│   ├── Reference with base_path('stubs/dto.stub')
│   └── Organize: use descriptive filenames
│
├── Variable stubs (multiple templates per generator)
│   ├── One stub per variant: action.stub, action-invokable.stub
│   ├── Select in getStub() based on options
│   ├── Cleaner than conditional placeholders in single stub
│   └── Example: make:action generates action or invokable class
│
└── Stub conventions
    ├── Descriptive names: dto.stub, action.stub, service.stub
    ├── Consistent structure: same placeholder style as Laravel
    ├── Keep each stub focused on one class type
    └── Version control all custom stubs
```
