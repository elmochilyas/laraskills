# Decision Trees — Validation Rule Inheritance

## Tree 1: Store vs Update Rule Inheritance Strategy

**Decision Context**: Whether to extend store rules for update or keep them completely separate.

**Decision Criteria**:
- Similarity between store and update validation
- Field mutability differences
- Maintenance cost

**Decision Tree**:
```
Are the validation rules for store and update 80%+ identical?
├── YES → Use rule inheritance — base class with store/update overriding specific rules
└── NO → Do store and update differ significantly (different fields, conditions)?
    ├── YES → Keep rules completely separate — inheritance adds confusion, not value
    └── NO → Does the update only add "sometimes" + ignore current ID (unique rule)?
        ├── YES → Use inheritance — override specific rules with update-appropriate versions
        └── NO → Keep rules separate — they diverged beyond inheritance benefits
```

**Rationale**: Inheritance reduces duplication when rules are similar. Separate rules are clearer when they diverge significantly.

**Recommended Default**: Inheritance with a base FormRequest containing shared rules. Override with update-specific rules.

**Risks**: Forcing inheritance on divergent rules creates confusing conditional logic. Keeping near-identical rules separate creates maintenance duplication.

---

## Tree 2: Rule Composition via Traits

**Decision Context**: Using traits to compose validation rules across different FormRequests.

**Decision Criteria**:
- Common rule groups shared by multiple requests
- Mixing DTO payload methods with rules
- Trait organization

**Decision Tree**:
```
Is there a set of rules shared by 3+ FormRequests (address validation, contact info)?
├── YES → Extract to a trait — single source of truth for common rule groups
└── NO → Are rules composed from multiple trait sources?
    ├── YES → Order trait composition carefully — later traits override earlier ones
    └── NO → Are traits used only for rules without state/metadata?
        ├── YES → Define rule methods in traits: `addressRules()`, return the rule array
        └── NO → Keep rules in the FormRequest — traits add complexity without reuse benefit
```

**Rationale**: Traits provide reusable rule composition without inheritance constraints.

**Recommended Default**: Extract to trait when 3+ requests share the same rule group. Keep in class for 1-2 requests.

**Risks**: Trait overrides create subtle bugs when multiple traits define the same method. Deep trait composition is harder to debug than inheritance.
