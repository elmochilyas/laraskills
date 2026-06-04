# Decision Trees — Global Exception Handler Configuration

## Tree 1: Callback Registration Order

**Decision Context**: Determining the order in which renderable callbacks should be registered.

**Decision Criteria**:
- Exception specificity (specific vs general)
- Framework vs custom precedence
- Fallback requirement

**Decision Tree**:
```
Register callbacks in this order:
1. Most specific framework exceptions first (AuthenticationException, ValidationException)
2. Custom application exceptions next (UserNotFoundException, OrderConflictException)
3. Grouped category handlers next (OperationalException, ProgrammerException)
4. Throwable catch-all LAST — ensures every exception produces a JSON response
```

**Rationale**: Callbacks are evaluated in registration order; first match wins. Specific exceptions must be registered before their parent class handlers.

**Recommended Default**: Framework exceptions → custom exceptions → category handlers → Throwable fallback.

**Risks**: Registering Throwable first catches everything and prevents specific handling. Registering category handlers before specific exceptions means the category handler runs instead of the specific one.

---

## Tree 2: Renderable vs Reportable Separation

**Decision Context**: Whether to handle error rendering and reporting in the same callback or separate them.

**Decision Criteria**:
- Separation of concerns
- Error tracking integration
- Testing requirements

**Decision Tree**:
```
Does the exception need both custom rendering AND custom reporting (Sentry, Slack, PagerDuty)?
├── YES → Separate them: use renderable() for HTTP response, reportable() for side effects
└── NO → Does the exception need only custom rendering (no special reporting)?
    ├── YES → Use renderable() only — reportable is handled by default behavior
    └── NO → Does the exception need only custom reporting (Sentry enrichment)?
        ├── YES → Use reportable() only — renderable is handled by existing callbacks
        └── NO → Register nothing — default handler behavior is sufficient
```

**Rationale**: Keeping rendering and reporting separate follows single responsibility and makes both easier to test independently.

**Recommended Default**: Use renderable() for response customization. Use reportable() for error tracking enrichment. Keep them separate.

**Risks**: Combining rendering and reporting in one callback makes it harder to test each concern independently and harder to modify one without affecting the other.
