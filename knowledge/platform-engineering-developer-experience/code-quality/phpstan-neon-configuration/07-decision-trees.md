# 07-Decision Trees: PHPStan NEON Configuration

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | phpstan-neon-configuration |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Config Structure | Single vs multi-file configuration | How many environments and extension sources do we need? |
| D02 | Service Registration | How to register custom PHPStan extensions | Do we need custom rules or type mappings? |
| D03 | Include Hierarchy | How to compose includes from multiple sources | What vendor configs and custom configs do we merge? |
| D04 | Error Suppression Strategy | How to handle ignored errors | Do we use baseline, inline ignores, or config-level suppression? |

## Architecture-Level Decision Trees

### D01: Config Structure

```
START: How should we structure the NEON configuration?
│
├── Single file (phpstan.neon)
│   ├── Use for: simple projects with no custom extensions
│   ├── Contains: includes, parameters, baseline reference
│   └── Simple flat structure — easy to understand
│
├── Multi-file layered (recommended for teams)
│   ├── phpstan.neon — base config (level, paths, common settings)
│   ├── phpstan.ci.neon — CI overrides (stricter, annotations)
│   ├── phpstan.local.neon — local overrides (gitignored)
│   └── phpstan-baseline.neon — separate baseline file
│
└── NEON-specific considerations
    ├── Use PHP constants: %rootDir%, %currentWorkingDirectory%
    ├── Avoid absolute paths — use relative or NEON constants
    ├── Param separation: use separate sections for clarity
    └── Validate: phpstan --configuration checks NEON syntax
```

### D02: Service Registration

```
START: Do we need custom PHPStan extensions?
│
├── No custom extensions
│   └── No services section needed — Larastan handles Laravel patterns
│
├── Custom rules
│   ├── Create class implementing PHPStan\Rules\Rule
│   ├── Register in services section:
│   │   services:
│   │       -
│   │           class: App\Phpstan\MyCustomRule
│   │           tags:
│   │               - phpstan.rules.rule
│   └── Verify: tag is required for rule registration
│
├── Custom type mappings
│   ├── Map interface → concrete type for analysis
│   ├── Register in parameters or services
│   └── Use: when PHPStan can't resolve interface implementations
│
└── Custom stub files
    ├── Create .stub files with PHPDoc declarations
    ├── Include via parameters > stubFiles
    └── Use: for facades, macros, dynamic methods
```

### D03: Include Hierarchy

```
START: Which configs should be included in the hierarchy?
│
├── Required includes
│   ├── vendor/larastan/larastan/extension.neon — Laravel extensions
│   └── phpstan-baseline.neon — baseline (if using)
│
├── Optional includes
│   ├── Custom rules packages (community extensions)
│   ├── phpstan.ci.neon — CI-specific overrides
│   └── phpstan.local.neon — developer-local settings
│
├── Order matters
│   ├── Later includes override earlier ones
│   ├── Vendor includes first, custom includes last
│   └── Baseline included after main config
│
└── Common mistakes to avoid
    ├── Circular includes: A → B → A (infinite recursion)
    ├── Missing vendor path: include path doesn't exist (config fails)
    ├── Incorrect include order: overrides apply in wrong sequence
    └── Absolute paths: config breaks on different machines
```

### D04: Error Suppression Strategy

```
START: How should we handle PHPStan errors we can't fix?
│
├── Baseline (recommended for existing errors)
│   ├── phpstan analyse --generate-baseline
│   ├── Captures all current errors in baseline file
│   ├── New errors beyond baseline → CI failure
│   └── Best for: systematic debt management
│
├── Ignored errors in config
│   ├── Inline ignoredErrors section in phpstan.neon
│   ├── Regex patterns to suppress specific error messages
│   ├── Risky: grows stale, hides regressions
│   └── Use only for: false positives that can't be fixed
│
├── PHPDoc inline ignores (@phpstan-ignore)
│   ├── Attach to specific lines or blocks
│   ├── More targeted than config-level suppression
│   └── Use for: individual false positives
│
└── Suppression considerations
    ├── Prefer baseline over ignoredErrors in config
    ├── Prefer @phpstan-ignore over baseline for one-offs
    ├── Review all suppressions quarterly
    └── Track ignore count as quality metric
```
