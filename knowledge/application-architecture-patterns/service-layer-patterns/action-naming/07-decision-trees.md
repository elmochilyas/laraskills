# Decision Trees: Action Class Naming

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Action class naming: verb-noun commands
- **Knowledge Unit ID:** SLP-08
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Verb-Noun vs generic action naming | Naming | Action creation |
| 2 | Action suffix vs no suffix | Naming | Action creation |
| 3 | Flat vs domain-subdirectory action organization | Organization | Project structure |

---

## Decision 1: Verb-Noun vs generic action naming

### Context
Action classes must use Verb-Noun naming (CreateUser, ProcessPayment, GenerateInvoice). Generic names (ProcessAction, HandleAction) don't communicate purpose. The verb describes the operation; the noun describes the target.

### Decision Tree

```
Does the name follow Verb-Noun pattern?
├── YES (CreateUser, ProcessPayment, CancelSubscription)
│   → Correct naming — self-documenting
│   Is the verb from the team's controlled vocabulary?
│   ├── YES → Consistent with team conventions
│   └── NO → Add to or use an existing approved verb
└── NO (Process, Handle, DoStuff)
    → GENERIC — rename to Verb-Noun
    Does the name identify a specific business operation?
    ├── YES → Add noun and verb: e.g., "Handle" → "ProcessPayment"
    └── NO → The operation is not well-defined — clarify scope first
```

### Rationale
Verb-Noun naming is self-documenting: `CreateUserAction` tells you exactly what the action does. Generic names require reading the implementation to understand purpose. A directory of Verb-Noun actions reads like a business operations menu.

### Recommended Default
Verb-Noun naming with controlled verb vocabulary

### Risks
- Generic names: unclear purpose, requires code reading
- Inconsistent verbs: Create/Make/Generate used interchangeably
- Too-specific names: indicates action does too much

### Related Rules
- Verb-Noun Naming with Action Suffix (SLP-08/05-rules.md)
- Group by Domain Subdirectory (SLP-08/05-rules.md)
- Controlled Verb Vocabulary (SLP-08/05-rules.md)

### Related Skills
- Name Action Classes Using Verb-Noun Conventions (SLP-08/06-skills.md)
- Name Service Classes with Business Language (SLP-07/06-skills.md)

---

## Decision 2: Action suffix vs no suffix

### Context
The Action suffix (CreateUserAction) prevents naming conflicts with Eloquent models. Without the suffix, `app/Actions/User.php` collides with `app/Models/User.php` in namespace resolution. The suffix also makes action classes immediately identifiable.

### Decision Tree

```
Could the action name conflict with an Eloquent model class name?
├── YES (e.g., User, Order, Product are also model names)
│   → Use Action suffix
│   CreateUserAction, ProcessOrderAction
└── NO (unique name like ProcessPayment, GenerateReport)
    Is the team consistent about suffix usage?
    ├── YES → Either with or without suffix is fine if consistent
    └── NO → Use Action suffix — it's always safe and identifies action classes
```

### Rationale
The Action suffix provides a simple, consistent way to distinguish action classes from models. It prevents naming collisions and makes action classes immediately recognizable. While omitting the suffix works for unique names, consistency across the entire codebase matters more.

### Recommended Default
Use Action suffix for all action classes

### Risks
- No suffix with collision: namespace conflict with model class
- Inconsistent: some with suffix, some without — confusion about convention
- No suffix, no collision: works but loses visual identification

### Related Rules
- Verb-Noun Naming with Action Suffix (SLP-08/05-rules.md)
- Group by Domain Subdirectory (SLP-08/05-rules.md)
- Avoid Long Action Names (SLP-08/05-rules.md)

### Related Skills
- Name Action Classes Using Verb-Noun Conventions (SLP-08/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)

---

## Decision 3: Flat vs domain-subdirectory action organization

### Context
Action classes should be grouped by domain subdirectory within `app/Actions/`. A flat directory with 100+ action files is unmanageable. Domain subdirectories make actions discoverable and group related operations.

### Decision Tree

```
Will there be 10+ action classes total in the project?
├── YES
│   → Domain subdirectories are required
│   Use app/Actions/Billing/, app/Actions/User/, etc.
│   Group related actions by their business domain
└── NO (fewer than 10 actions)
    Is the project expected to grow?
    ├── YES → Use subdirectories from the start (easier than reorganizing later)
    └── NO → Flat structure is acceptable for very small projects
```

### Rationale
Flat action directories become unmanageable as the project grows. Finding a specific action among 100 files is time-consuming. Domain subdirectories are cheap to create and provide clear organizational structure. Starting with subdirectories avoids painful reorganization later.

### Recommended Default
Domain subdirectories for all projects with more than 10 actions

### Risks
- Flat directory with 100+ actions: impossible to navigate
- Wrong domain grouping: action placed in wrong directory
- No subdirectories: renaming/moving actions later is disruptive

### Related Rules
- Group by Domain Subdirectory (SLP-08/05-rules.md)
- Verb-Noun Naming with Action Suffix (SLP-08/05-rules.md)
- Controlled Verb Vocabulary (SLP-08/05-rules.md)

### Related Skills
- Name Action Classes Using Verb-Noun Conventions (SLP-08/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)
