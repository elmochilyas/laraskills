# Decision Trees — Deprecation Header Implementation

## Tree 1: Deprecation Header Injection Strategy

**Decision Context**: How to inject deprecation headers — middleware-based, controller-based, or response macro-based.

**Decision Criteria**:
- Consistency requirements
- Per-endpoint vs per-version deprecation
- Configuration complexity tolerance

**Decision Tree**:
```
Is deprecation per-version (entire version is deprecated)?
├── YES → Use middleware applied to the version's route group — single config, consistent, easiest
└── NO → Is deprecation per-endpoint within a version?
    ├── YES → Are there more than 5 deprecated endpoints?
    │   ├── YES → Middleware with endpoint config map — centralized configuration
    │   └── NO → Controller-based with #[Deprecated] attribute or inline header — simpler for few endpoints
    └── NO → Is deprecation conditional (based on consumer, load, or other runtime factors)?
        ├── YES → Middleware with runtime evaluation — flexible but complex
        └── NO → Middleware-based (covers all standard cases)
```

**Rationale**: Middleware is the most consistent and maintainable approach for per-version deprecation. Per-endpoint deprecation with few endpoints can use simpler controller-based injection.

**Recommended Default**: Middleware-based deprecation header injection applied to deprecated route groups.

**Risks**: Controller-based injection is inconsistent across endpoints. Missing headers on some endpoints while present on others confuses consumers.

---

## Tree 2: Deprecation Pairing Strategy

**Decision Context**: What headers to include alongside the Deprecation header — whether to pair with Sunset, Link, and response body deprecation fields.

**Decision Criteria**:
- Consumer actionability requirements
- Deprecation timeline certainty
- Documentation availability

**Decision Tree**:
```
Is the deprecation timeline and sunset date determined?
├── YES → Pair Deprecation + Sunset (date) + Link (migration guide) + response body deprecation field
└── NO → Is the deprecation timeline still being finalized?
    ├── YES → Add Deprecation header only (no Sunset yet); add response body deprecation field; add Link to migration info
    └── NO → Are you planning to publish a migration guide?
        ├── YES → Pair Deprecation + Link (migration guide) at minimum; add Sunset when date is set
        └── NO → Add Deprecation header + response body deprecation field; Sunset and Link come later
```

**Rationale**: The Deprecation header alone is a warning without action. Paired with Sunset and Link, it becomes an actionable instruction for consumers.

**Recommended Default**: Always pair Deprecation with at least a Link header to migration information. Add Sunset when the date is determined.

**Risks**: Deprecation without Sunset leaves consumers uncertain about urgency. Deprecation without Link leaves consumers searching for migration info.
