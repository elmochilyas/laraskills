# Decision Trees — Exception-to-Code Mapping

## Tree 1: Mapping Resolution Strategy

**Decision Context**: Determining how to resolve an exception to its error code — exact class match vs parent class vs interface.

**Decision Criteria**:
- Exception hierarchy depth
- Interface usage
- Mapping granularity requirements

**Decision Tree**:
```
Does the exception class have a direct entry in the mapping table?
├── YES → Return the mapped error code — exact match takes priority
└── NO → Does any parent class of the exception have a mapping?
    ├── YES → Return the closest parent class's mapping — fall through hierarchy
    └── NO → Does the exception implement an interface (HasErrorCode) with a getErrorCode() method?
        ├── YES → Call getErrorCode() on the exception — interface-based resolution
        └── NO → Return the catch-all fallback code (SYSTEM.INTERNAL_ERROR)
```

**Rationale**: Resolution order: exact class → parent class → interface → fallback. This ensures specific exceptions get specific codes while unmapped exceptions always have a safe default.

**Recommended Default**: Register exact FQCN for all custom exceptions. Use parent class mapping for framework exceptions. Register a Throwable fallback.

**Risks**: Relying only on parent class mapping loses granularity for specific subclasses. No fallback means unmapped exceptions leak through to Symfony/Whoops.

---

## Tree 2: Framework Exception Coverage

**Decision Context**: Which Laravel framework exceptions need explicit mapping in the handler.

**Decision Criteria**:
- Exception likelihood
- Response impact
- Framework upgrade stability

**Decision Tree**:
```
Is the exception thrown by Laravel core for common scenarios?
├── YES → Map explicitly — AuthenticationException, AuthorizationException, ModelNotFoundException, ValidationException, ThrottleRequestsException, QueryException
└── NO → Is the exception from a Laravel package that your application uses?
    ├── YES → Map explicitly in the package's service provider registration
    └── NO → Does the exception have security implications if unmapped?
        ├── YES → Map explicitly — prevent information disclosure via default error behavior
        └── NO → Rely on the Throwable fallback — low-priority exceptions can use the generic code
```

**Rationale**: Framework exceptions that correspond to HTTP error codes (401, 403, 404, 422, 429, 500) must have explicit mappings.

**Recommended Default**: Map all six Laravel core exceptions explicitly. Map package exceptions in their service providers.

**Risks**: Unmapped framework exceptions return generic 500 errors instead of appropriate 4xx responses. Over-mapping every possible exception creates maintenance burden.
