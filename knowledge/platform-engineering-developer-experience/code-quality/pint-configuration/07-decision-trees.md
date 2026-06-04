# 07-Decision Trees: Pint Configuration

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | pint-configuration |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Preset Selection | Which built-in preset to use as baseline | What coding standard ecosystem does the project belong to? |
| D02 | Rule Override Strategy | How many and which rules to override | Are preset defaults sufficient or do we need customization? |
| D03 | Exclusion Configuration | Which files/directories to exclude | What code should Pint skip (generated, legacy, vendor)? |
| D04 | Nested Configuration | Whether to use nested pint.json files | Does the project have subdirectories needing different standards? |

## Architecture-Level Decision Trees

### D01: Preset Selection

```
START: Which Pint preset should we use?
│
├── Laravel project
│   ├── Use laravel preset (default)
│   ├── Matches Laravel ecosystem conventions
│   ├── Ordered imports (facades first), helper spacing
│   └── Code looks like it belongs in the ecosystem
│
├── Framework-agnostic PHP package
│   ├── Use psr12 preset (strict PSR-12 compliance)
│   └── Use per preset (modern PHP Extended Rules)
│
├── Symfony project
│   └── Use symfony preset (Symfony coding standards)
│
└── Decision factors
    ├── What does the ecosystem expect?
    ├── What do team members know from other projects?
    ├── Are we migrating from another standard?
    └── Run pint -v to see effective rules before committing
```

### D02: Rule Override Strategy

```
START: How many custom rules should we add on top of the preset?
│
├── Zero overrides (preset only)
│   ├── No pint.json needed (or minimal preset declaration)
│   ├── Pro: zero maintenance, zero debate
│   ├── Con: no team-specific conventions
│   └── Best for: solo projects, teams without strong opinions
│
├── Minimal overrides (3-5 rules)
│   ├── Create pint.json with preset + few custom rules
│   ├── Common additions:
│   │   ├── single_quote
│   │   ├── no_unused_imports
│   │   ├── ordered_imports (alpha sort)
│   │   ├── trailing_comma_in_multiline
│   │   └── concat_space
│   ├── Document each rule's rationale in CONTRIBUTING.md
│   └── Recommended for most teams
│
├── Moderate overrides (6-15 rules)
│   ├── For teams with many strong formatting preferences
│   ├── Risk: formatting debates slow decision-making
│   └── Consider: are these rules truly worth the team friction?
│
└── Heavy overrides (15+ rules)
    ├── Anti-pattern — defeats Pint's simplicity
    ├── Alternative: accept preset defaults
    └── Potential rule conflicts need testing
```

### D03: Exclusion Configuration

```
START: Which files and directories should Pint skip?
│
├── Always exclude
│   ├── vendor/ (third-party code)
│   ├── storage/ (generated runtime files)
│   ├── node_modules/ (JS dependencies)
│   └── bootstrap/cache/ (compiled config)
│
├── Generated code (project-specific)
│   ├── storage/framework/views/ (compiled Blade templates)
│   ├── app/Legacy/ (legacy code not being refactored)
│   └── app/ThirdParty/ (vendored third-party within app)
│
├── Exclusion methods
│   ├── exclude key: directory paths to skip entirely
│   │   Example: "exclude": ["app/Legacy"]
│   ├── notPath: glob patterns for specific paths
│   │   Example: "notPath": ["app/Legacy/*"]
│   └── notName: regex patterns for filenames
│       Example: "notName": ["*Legacy*.php"]
│
└── Check: run pint --test after adding exclusions
    └── Verify intended files are actually excluded
```

### D04: Nested Configuration

```
START: Does the project need different formatting per directory?
│
├── No, uniform standards across project
│   └── Single pint.json at project root — simple and clear
│
├── Yes, monorepo with multiple packages
│   ├── Each package has its own pint.json
│   ├── Each package can use different preset based on framework
│   ├── Nested config overrides parent config
│   └── CI must respect nested configs per directory
│
├── Yes, mixed framework project
│   ├── Laravel app/ → laravel preset
│   ├── Symfony bundle/ → symfony preset
│   └── Nested pint.json per directory with appropriate preset
│
└── Nested config behavior
    ├── Child config inherits parent settings
    ├── Child overrides apply only to that subtree
    ├── No limit on nesting depth
    └── Validate: run pint from root to test all configs
```
