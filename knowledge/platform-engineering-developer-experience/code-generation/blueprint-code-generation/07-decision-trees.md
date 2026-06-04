# 07-Decision Trees: Blueprint Code Generation

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | blueprint-code-generation |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Blueprint vs Manual | Whether to use Blueprint for code generation or write manually | Does the application follow standard CRUD patterns suitable for generation? |
| D02 | Draft Structure | How to organize the draft.yaml file | Should we use a single monolithic draft or split by bounded context? |
| D03 | Generation Iteration | How to handle the generate-customize-regenerate cycle | How do we regenerate without losing custom modifications? |
| D04 | CI Validation | How to validate draft integrity in CI | How do we prevent drift between draft specifications and generated code? |

## Architecture-Level Decision Trees

### D01: Blueprint vs Manual

```
START: Should we use Blueprint for this project?
│
├── New Laravel project (greenfield)
│   ├── Does the app follow standard CRUD patterns?
│   │   ├── Yes — models, controllers, migrations, relationships
│   │   │   ├── Use Blueprint for initial scaffolding
│   │   │   ├── Define models and controllers in draft.yaml
│   │   │   └── Generate all components: php artisan blueprint:build
│   │   └── No — highly custom business logic, event-heavy, complex workflows
│   │       └── Use Blueprint only for models/migrations, write controllers manually
│   └── After generation: add custom logic in service classes, not generated files
│
├── Existing project
│   ├── Does the existing code follow Blueprint conventions?
│   │   ├── Yes → Add Blueprint for new features only
│   │   ├── Somewhat → Generate new components, don't regenerate existing
│   │   └── No → Skip Blueprint — conventions will clash
│   └── Risk: regenerating over existing custom code causes data loss
│
└── Decision factors
    ├── CRUD-heavy → Blueprint saves significant time
    ├── API-first → Blueprint's API controllers fit well
    ├── Highly custom → Blueprint handles ~40-60% of code; rest is manual
    └── Prototype → Blueprint enables rapid iteration
```

### D02: Draft Structure

```
START: How should we organize draft.yaml?
│
├── Single draft.yaml (simple projects, <15 models)
│   ├── All models and controllers in one file
│   ├── Pro: single source of truth, easy to review
│   ├── Con: becomes unwieldy with many models
│   └── Best for: small to medium applications
│
├── Split by bounded context (recommended for large projects)
│   ├── Separate draft files per domain:
│   │   ├── draft/users.yaml
│   │   ├── draft/billing.yaml
│   │   └── draft/content.yaml
│   ├── Run blueprint:build with --path for specific context
│   ├── Pro: domain boundaries are clear, easier maintenance
│   ├── Con: need to manage multiple generation passes
│   └── Best for: large applications, domain-driven design
│
├── Models-only draft
│   ├── Define only models in draft.yaml
│   ├── Controllers written manually
│   ├── Use for: apps with custom controller logic
│   └── Use --only=model,migration to limit generation
│
└── Organization conventions
    ├── Group related models with comments
    ├── Order by dependency (parent models before children)
    ├── Keep consistent indentation (2 spaces, YAML standard)
    └── Validate: php artisan blueprint:validate before each build
```

### D03: Generation Iteration

```
START: How do we iterate with Blueprint without losing custom code?
│
├── One-time generation (recommended for most projects)
│   ├── Generate once with blueprint:build
│   ├── Customize generated files as needed
│   ├── NEVER regenerate — draft becomes documentation only
│   ├── Future changes made directly to PHP files
│   └── draft.yaml maintained as specification reference
│
├── Regeneration with separation
│   ├── Keep custom logic in separate service classes
│   ├── Generated files stay thin (controllers, models)
│   ├── Regenerate when schema changes significantly
│   ├── Use VCS diff to review changes after regeneration
│   └── Strategy: regenerate → diff → fix → commit
│
├── Iterative generation
│   ├── Frequent small changes to draft.yaml
│   ├── Regenerate with each draft change
│   ├── Only acceptable for: early prototyping phase
│   ├── Stop iterative generation once customization begins
│   └── Transition to one-time generation at first custom change
│
└── Safe regeneration checklist
    ├── VCS commit before regenerating (safety net)
    ├── Review diff after regeneration
    ├── Run full test suite
    ├── Check for lost customizations
    └── Never regenerate over heavily customized files
```

### D04: CI Validation

```
START: How should we validate Blueprint in CI?
│
├── Draft validation (recommended)
│   ├── Step: php artisan blueprint:validate
│   ├── Fails CI if YAML is malformed
│   ├── Fails CI if model relationships are invalid
│   └── Fast (<1s) — negligible overhead
│
├── Generation drift detection (advanced)
│   ├── CI runs blueprint:build and diffs against committed code
│   ├── If diff exists → draft was updated but code wasn't regenerated
│   ├── Fails CI → developer must regenerate or update draft
│   ├── Complex setup — requires careful gitignore management
│   └── Only for: teams doing iterative generation
│
└── Workflow integration
    ├── Pre-commit hook: blueprint:validate
    ├── CI step: blueprint:validate after dependency install
    ├── PR check: validate + optional generation diff
    └── Scheduled: weekly draft integrity check
```
