# Decision Trees: Service Class Naming and Methods

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Service class naming conventions and method design
- **Knowledge Unit ID:** SLP-07
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Business-language method vs CRUD method naming | Naming | Method creation |
| 2 | Entity-based vs domain-based service naming | Naming | Service creation |
| 3 | Single abstraction level vs mixed levels in methods | Architecture | Method design |

---

## Decision 1: Business-language method vs CRUD method naming

### Context
Service method names should reflect business operations, not database operations. `register()` communicates intent; `insert()` communicates a data operation. Business-language names are self-documenting and reveal the purpose without reading the implementation.

### Decision Tree

```
Does the method name describe what the business intends, not what the database does?
├── YES (register, cancelOrder, suspendUser)
│   → Business-language — correct
│   Is the name consistent with ubiquitous language used by domain experts?
│   ├── YES → Perfect — any developer or product manager understands it
│   └── NO → Rename to match business terminology
└── NO (insert, updateStatus, delete, getAll)
    → CRUD-technical — rename to business language
    Is the operation genuinely a CRUD admin function?
    ├── YES → CRUD names may be acceptable (rare)
    └── NO → Rename to reflect business operation
```

### Rationale
Business-language names communicate intent without requiring code reading. They align developers with domain experts. CRUD names (insert, update, delete) describe data operations, not business value. The exception is genuinely technical CRUD admin functions where no business operation exists.

### Recommended Default
Business-language method names

### Risks
- CRUD names: hides business intent, requires reading implementation
- Inconsistent names: some developers use business, others CRUD
- No ubiquitous language: business terms not documented, leading to ambiguity

### Related Rules
- Business Language for Method Names (SLP-07/05-rules.md)
- One Level of Abstraction (SLP-07/05-rules.md)
- Avoid Generic Suffixes (SLP-07/05-rules.md)

### Related Skills
- Name Service Classes and Methods with Business Language (SLP-07/06-skills.md)
- Name Action Classes with Verb-Noun Conventions (SLP-08/06-skills.md)

---

## Decision 2: Entity-based vs domain-based service naming

### Context
Services can be named after the primary entity (UserService, OrderService) or after the domain (BillingService, AuthService). Entity-based is the default — one service per primary entity. Domain-based is for operations that span multiple entities within a business domain.

### Decision Tree

```
Do the operations center primarily on one entity?
├── YES (User registration, password change, profile update)
│   → Entity-based: UserService
│   Name: {Entity}Service
└── NO (operations span multiple entities like invoices, payments, subscriptions)
    → Domain-based: BillingService
    Name: {Domain}Service
    Does the domain map to a module boundary?
    ├── YES → Domain-based service in module
    └── NO → Entity-based services are still preferred
```

### Rationale
Entity-based naming is the simplest and most intuitive convention — developers know where to find user-related operations. Domain-based naming is needed when operations naturally span multiple entities. Default to entity-based; use domain-based when operations don't center on a single entity.

### Recommended Default
Entity-based (`UserService`, `OrderService`); domain-based for multi-entity domains

### Risks
- Entity-based for multi-entity operations: services inject many other services
- Domain-based for single entity: hides which entity is primary
- Inconsistent pattern: some entity-based, some domain-based without clear rule

### Related Rules
- Business Language for Method Names (SLP-07/05-rules.md)
- Avoid Generic Suffixes (SLP-07/05-rules.md)
- Keep Methods Under 20-30 (SLP-07/05-rules.md)

### Related Skills
- Name Service Classes and Methods with Business Language (SLP-07/06-skills.md)
- Design Service Classes (SLP-01/06-skills.md)

---

## Decision 3: Single abstraction level vs mixed levels in methods

### Context
Service methods should maintain one consistent level of abstraction. High-level orchestration calls (call repository, dispatch event) should not be mixed with low-level data access (DB::raw, setting model properties directly). Mixed abstraction levels make methods hard to read and signal misplaced responsibilities.

### Decision Tree

```
Does the method mix high-level orchestration with low-level data access?
├── YES
│   → Split into separate layers
│   Low-level operations → Action or Repository
│   High-level orchestration → Keep in Service
│   Is the low-level operation trivial (single line)?
│   ├── YES → May keep inline, but prefer delegation
│   └── NO → Definitely extract to action or repository
└── NO (consistent abstraction level)
    → Correct pattern — method reads like a workflow description
```

### Rationale
A service method should read like a high-level description of the workflow: "create user, send welcome, track analytics." Low-level details obscure this intent and signal that the service is doing work it should delegate. Extracting low-level operations to actions or repositories keeps the service method at one abstraction level.

### Recommended Default
One level of abstraction per service method; delegate low-level details

### Risks
- Mixed abstractions: hard to read, obfuscated workflow
- Too many layers: fragmentation for trivial operations
- No delegation at all: service method is a 50-line script

### Related Rules
- One Level of Abstraction (SLP-07/05-rules.md)
- Avoid Generic Suffixes (SLP-07/05-rules.md)
- No HTTP Responses (SLP-07/05-rules.md)

### Related Skills
- Name Service Classes and Methods with Business Language (SLP-07/06-skills.md)
- Build the Service-Action-Repository Pyramid (SLP-04/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)
