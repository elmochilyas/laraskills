# Decision Trees: Anti-Corruption Layer Pattern

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Domain Boundaries and Bounded Contexts
- **Knowledge Unit:** Anti-corruption layer pattern
- **Knowledge Unit ID:** DBC-04
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Full ACL vs simple service method | Architecture | Integration design |
| 2 | ACL placement: consuming context vs upstream | Architecture | ACL ownership |
| 3 | Syntactic mapping vs conceptual translation | Architecture | Translation depth |

---

## Decision 1: Full ACL vs simple service method

### Context
Not every integration needs a full Anti-Corruption Layer. When the external system's model closely aligns with your context's model, a simple service method that calls the external API and returns data may suffice. Full ACL is needed when there's significant model divergence — different concept names, different structures, different invariants. The cost of a full ACL is justified when it protects model integrity from foreign concepts.

### Decision Tree

```
Does the external system's model significantly differ from your context's model?
├── YES → Build full ACL
│   Concepts, naming, or structure are fundamentally different
│   ACL protects your context from foreign model corruption
│   Does the external system have poor quality or change frequently?
│   ├── YES → ACL is REQUIRED — protects from instability
│   └── NO → ACL still recommended if models diverge
└── NO (models are closely aligned)
    → Can the integration be handled with a simple service method?
    ├── YES → Simple service method is sufficient
    │   Direct translation in a service method suffices
    │   `$externalApi->getUser($id)` → map fields inline
    └── NO (even aligned models need some translation)
        → Determine if the translation is one-time or ongoing
        Is this a permanent integration (not a one-time import)?
        ├── YES → Consider a lightweight ACL
        │   Even aligned models benefit from isolation
        └── NO → Simple service method with inline mapping
```

### Rationale
Full ACL is an investment in model integrity. If the external model is closely aligned and rarely changes, a simple service method with inline translation is sufficient. But if the models diverge semantically — different status systems, different money representations, different entity boundaries — an ACL is necessary to prevent the context from absorbing foreign design. The cost of building a full ACL is upfront; the cost of not building one is ongoing model corruption.

### Recommended Default
Full ACL when model divergence exists; simple service method for closely aligned models

### Risks
- No ACL when needed: legacy model concepts leak into context, corrupting domain language
- ACL for simple integration: over-engineering for a straightforward API call
- Leaky ACL: some methods bypass translation, exposing legacy detail

### Related Rules
- Always use ACL when integrating with different domain model (DBC-04/05-rules.md)
- Own the anti-corruption layer in the consuming context (DBC-04/05-rules.md)
- Never let legacy models be imported directly (DBC-04/05-rules.md)

### Related Skills
- Build Anti-Corruption Layer for Legacy Integration (DBC-04/06-skills.md)
- Map Context Relationships (DBC-02/06-skills.md)
- Integrate Legacy Systems (DBC-10/06-skills.md)

---

## Decision 2: ACL placement: consuming context vs upstream

### Decision Tree

```
Who should own the translation logic?
├── The consuming context (recommended)
│   ACL lives in the consuming context's Infrastructure layer
│   Translator, Facade, Adapter are inside the context
│   The upstream system doesn't need to know about the ACL
│   Can the consuming context access the upstream system?
│   ├── YES → ACL in consuming context is the correct approach
│   └── NO (no direct access to upstream data)
│       → ACL in consuming context still — use the upstream's public API
└── The upstream system (not recommended)
    Does the upstream system provide a well-maintained SDK?
    ├── YES → Exception: upstream SDK already translates to clean model
    │   But still wrap in a local adapter in the consuming context
    └── NO → Do NOT place ACL in upstream
        Upstream shouldn't know about downstream models
        ACL in upstream creates bidirectional dependency
```

### Rationale
The consuming context must own the ACL because it's protecting its own model integrity. Placing the ACL in the upstream system creates a bidirectional dependency — the upstream must know about the downstream's model. The upstream should evolve independently. The consuming context's ACL adapts to upstream changes, not the other way around. This aligns with the Dependency Inversion Principle: the consuming context defines the interface, and the ACL implements it.

### Recommended Default
ACL in consuming context's Infrastructure layer; never in upstream system

### Risks
- ACL in upstream: bidirectional dependency, upstream must know downstream model
- No ACL access layer: consuming context directly calls upstream API without translation
- ACL not maintained: translation layer becomes outdated as upstream evolves

### Related Rules
- Own the anti-corruption layer in the consuming context (DBC-04/05-rules.md)
- Structure ACL with Translator, Facade, and Adapter (DBC-04/05-rules.md)
- Do not expose legacy system details through the ACL (DBC-04/05-rules.md)

### Related Skills
- Build Anti-Corruption Layer for Legacy Integration (DBC-04/06-skills.md)
- Apply Adapter Pattern (CPC-07/06-skills.md)
- Apply Dependency Rule (LAP-04/06-skills.md)

---

## Decision 3: Syntactic mapping vs conceptual translation

### Decision Tree

```
Does the ACL do more than rename fields?
├── NO (only field name mapping: `order_total` → `total`)
│   → This is syntactic mapping — insufficient
│   Syntactic mapping renames but doesn't translate concepts
│   Does it also convert units? (cents → dollars, dates → timezones)
│   ├── YES → Moving toward conceptual translation — improve it
│   └── NO → ACL is too thin — add full conceptual translation
└── YES (translates concepts: status codes, money, business rules)
    → This is conceptual translation — correct approach
    Does the ACL translate business concepts, not just data types?
    ├── YES (status codes → domain statuses, currency conversions)
    │   → Full conceptual translation — protects model integrity
    └── NO (translates data types but not domain concepts)
        → Expand translation to cover domain semantics
        Example: legacy "pending_approval" → domain "awaiting_review"
```

### Rationale
Syntactic mapping (renaming fields) doesn't protect the domain model. If the legacy system has `order_status = 'P'` for pending and the context uses `OrderStatus::Pending`, a simple field rename is insufficient — it must translate status codes into domain enumerations. True conceptual translation converts every foreign concept (status systems, currency formats, date representations, business rule codes) into the context's native domain language. A thin ACL that only renames fields creates the illusion of protection without actually protecting.

### Recommended Default
Conceptual translation that converts foreign concepts, not just field names

### Risks
- Thin ACL: renames fields but doesn't translate concepts — false sense of protection
- Partial translation: some concepts translated, others passed through raw
- Bidirectional asymmetry: inbound translation covers concepts, outbound only maps fields

### Related Rules
- Translate conceptually, not just syntactically (DBC-04/05-rules.md)
- Structure ACL with Translator, Facade, and Adapter (DBC-04/05-rules.md)
- Provide bidirectional translation (DBC-04/05-rules.md)

### Related Skills
- Build Anti-Corruption Layer for Legacy Integration (DBC-04/06-skills.md)
- Test ACL translation logic in isolation (DBC-04/06-skills.md)
- Design Interface Contracts (SLP-13/06-skills.md)
