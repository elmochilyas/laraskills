# 07-Decision Trees: Custom Pint Rules

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | custom-pint-rules |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Preset vs Custom Rule | Whether to rely on preset defaults or add custom overrides | Do we need formatting conventions beyond the selected preset? |
| D02 | Rule Configuration Type | How to configure a given rule (true/false/null/array) | Does the rule accept simple enable/disable or complex options? |
| D03 | Custom Fixer vs Config Rule | Whether to implement a custom FixerInterface class or use built-in PHP-CS-Fixer rules | Can the desired transformation be expressed with existing rules? |
| D04 | Project-level vs Directory-level | Whether to define rules globally or use nested pint.json per directory | Does the project have subdirectories requiring different standards? |

## Architecture-Level Decision Trees

### D01: Preset vs Custom Rule

```
START: Do we need formatting beyond our selected preset?
├── No, preset defaults are acceptable
│   └── Use preset only — no custom rules needed
│
└── Yes, we have strong team opinions
    ├── Is the desired rule available in PHP-CS-Fixer?
    │   ├── Yes
    │   │   ├── Is there team consensus on the rule?
    │   │   │   ├── Yes → Add rule to pint.json rules section
    │   │   │   └── No → Skip — avoid team friction over style
    │   │   └── After adding: run pint --test to verify
    │   └── No
    │       └── Does the rule require a custom fixer?
    │           ├── Yes → See D03 for custom fixer decision
    │           └── No → Reconsider — if not expressible, skip
    │
    Key considerations:
    - Limit custom rules to 3-5 strong opinions maximum
    - Document each rule's rationale in CONTRIBUTING.md
    - Lock Pint version to prevent rule behavior changes
    - Test rules together to catch conflicts before committing
```

### D02: Rule Configuration Type

```
START: How should we configure this PHP-CS-Fixer rule?
│
├── Simple boolean rule (e.g., single_quote)
│   ├── true → Enable the rule (apply formatting)
│   └── false → Explicitly disable the rule (opposite of preset behavior)
│
├── Complex array rule (e.g., concat_space, ordered_imports)
│   ├── Does the rule have sub-options?
│   │   ├── Yes → Provide associative array with sub-option values
│   │   │   Example: "concat_space": { "spacing": "one" }
│   │   └── No → Simple enable is sufficient
│   └── Verify sub-option values match PHP-CS-Fixer documentation
│
├── Null/absent (inherit from preset)
│   └── Do NOT add the rule to pint.json — let preset default apply
│
└── Danger zone: false vs null semantics
    ├── false = enforce opposite behavior
    └── null/absent = inherit preset default (usually no enforcement)
    Action: always check PHP-CS-Fixer docs to understand true/false/null semantics
```

### D03: Custom Fixer vs Config Rule

```
START: Can the desired transformation be expressed with built-in rules?
│
├── Yes, built-in rule exists
│   └── Configure via pint.json rules — no custom fixer needed
│
└── No, we need a domain-specific transformation
    ├── Is the transformation worth the maintenance cost?
    │   ├── No → Skip the rule (marginal formatting benefit)
    │   └── Yes → Proceed with custom fixer
    │       ├── Create class implementing PHP-CS-Fixer\Fixer\FixerInterface
    │       ├── Register via Pint extension mechanism
    │       ├── Ensure PSR-4 autoloading for the fixer class
    │       ├── Test on representative files before committing
    │       └── Document custom fixer behavior and rationale
    │
    Key considerations:
    - Custom fixers require maintenance across Pint/PHP-CS-Fixer upgrades
    - Complex AST-based rules: 5-10ms per file overhead
    - Consider open-source alternatives before writing custom fixers
    - Team must understand and agree with custom fixer behavior
```

### D04: Project-level vs Directory-level

```
START: Does the project have multiple codebases with different standards?
│
├── No, single project with uniform standards
│   └── Single pint.json at project root — all rules apply globally
│
└── Yes, subdirectories need different formatting
    ├── Monorepo with distinct packages?
    │   ├── Yes → Create nested pint.json per package
    │   │   └── Each package config inherits root + overrides subtree
    │   └── No → Use notPath/notName exclusions in root pint.json
    │       ├── notPath: exclude entire directories (glob patterns)
    │       └── notName: exclude specific filenames (regex patterns)
    │
    Key considerations:
    - Nested pint.json overrides parent for that subtree only
    - Exclusion patterns evaluate per file — can slow formatting marginally
    - Document directory-level differences in CONTRIBUTING.md
    - CI must respect nested configs when running pint --test
```
