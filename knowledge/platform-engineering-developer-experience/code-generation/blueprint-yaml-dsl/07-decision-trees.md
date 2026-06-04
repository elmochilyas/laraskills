# 07-Decision Trees: Blueprint YAML DSL

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | blueprint-yaml-dsl |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Column Definition | How to specify model columns with types and modifiers | What data type and constraints does each field need? |
| D02 | Relationship Specification | Whether to use auto-inference or explicit relationships | Does the foreign key naming convention match Blueprint's inference? |
| D03 | Controller Configuration | How to define controller actions and validation | What CRUD operations does each model need? |
| D04 | Draft Organization | How to structure the draft for complex domains | How do we manage 20+ models in a readable way? |

## Architecture-Level Decision Trees

### D01: Column Definition

```
START: How should we define each model column?
│
├── Basic column (string, no modifiers)
│   ├── Syntax: title: string
│   ├── Generates: $table->string('title')
│   └── Use for: most text fields with default length (255)
│
├── Column with type modifier
│   ├── Syntax: email: string:unique
│   ├── Syntax: age: integer:nullable:default(18)
│   ├── Syntax: description: text:nullable
│   └── Chain modifiers with colon separator
│
├── Column with length constraint
│   ├── Syntax: title: string:400
│   ├── Generates: $table->string('title', 400)
│   └── Use for: fields needing custom max length
│
├── Special column types
│   ├── id: id → auto-incrementing foreign key
│   ├── user_id: id → auto-detected as belongsTo User
│   ├── published_at: timestamp:nullable
│   ├── uuid: uuid → UUID column
│   └── status: string:default(active)
│
└── What NOT to specify
    ├── Don't specify id (auto-generated)
    ├── Don't specify timestamps (auto-generated)
    ├── Don't specify softDeletes (use trait in controller)
    └── Exception: add if non-standard behavior needed
```

### D02: Relationship Specification

```
START: How should relationships be defined?
│
├── Auto-inference (recommended for standard FKs)
│   ├── user_id → Blueprint infers belongsTo User
│   ├── team_id → Blueprint infers belongsTo Team
│   ├── post_id → Blueprint infers belongsTo Post
│   ├── Conventions: {model}_id pattern
│   └── No explicit relationships block needed
│
├── Explicit relationships (for non-standard FKs)
│   ├── author_id → won't infer belongsTo User automatically
│   ├── parent_id → won't infer belongsTo Self
│   ├── Syntax:
│   │   relationships:
│   │     belongsTo: User
│   │     hasMany: Comment
│   └── Use when FK naming doesn't match {model}_id pattern
│
├── Many-to-many with pivot
│   ├── Syntax:
│   │   relationships:
│   │     belongsToMany: Role
│   ├── Blueprint auto-generates pivot table migration
│   └── Pivot table naming: role_user (alphabetical order)
│
└── Polymorphic relationships
    ├── Syntax:
    │   relationships:
    │     morphTo: Commentable
    │     morphMany: Comment
    └── Requires commentable_id + commentable_type columns
```

### D03: Controller Configuration

```
START: What controller actions should Blueprint generate?
│
├── Full resource controller
│   ├── Syntax:
│   │   controllers:
│   │     Post:
│   │       resource
│   └── Generates: index, create, store, show, edit, update, destroy
│
├── API resource controller
│   ├── Syntax:
│   │   controllers:
│   │     Post:
│   │       resource
│   │       api: true
│   └── Generates: index, store, show, update, destroy (no create/edit)
│
├── Limited actions
│   ├── Syntax:
│   │   controllers:
│   │     Comment:
│   │       resource
│   │       only: index, store, destroy
│   └── Use for: nested resources, secondary models
│
└── No controller
    ├── Don't include in controllers section
    ├── Model only (for utility/value objects)
    └── Handles: models that don't need CRUD endpoints
```

### D04: Draft Organization

```
START: How should we structure a complex draft.yaml?
│
├── Flat structure (10-15 models)
│   ├── All models under models: key
│   ├── All controllers under controllers: key
│   ├── Readable up to ~200 lines
│   └── Simple, no additional files needed
│
├── Grouped by domain (15-30 models)
│   ├── Use comments to separate domains:
│   │   # User Domain
│   │   User: ...
│   │   Role: ...
│   │   # Billing Domain
│   │   Subscription: ...
│   │   Invoice: ...
│   ├── Order parent models before child models
│   └── Maintain alphabetical within groups
│
├── Separate files (30+ models)
│   ├── Multiple draft files per bounded context
│   ├── Run blueprint:build with --path for each file
│   ├── CI validates all draft files
│   └── Pro: manageable per-domain files
│
└── Style conventions
    ├── 2-space YAML indentation (mandatory)
    ├── Consistent column ordering: name, type, relationships
    ├── Alphabetical model ordering within groups
    └── Validate with blueprint:validate before commit
```
