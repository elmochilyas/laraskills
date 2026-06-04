# Decision Trees — Request Lifecycle Integration

## Tree 1: Middleware vs FormRequest

**Decision Context**: Choosing between FormRequest validation and middleware-based validation for request processing.

**Decision Criteria**:
- Scope of validation (single endpoint vs multiple)
- Mutability of validation logic
- Dependencies required for validation

**Decision Tree**:
```
Is the validation specific to a single endpoint or resource?
├── YES → Use FormRequest — validation lives with the endpoint; easy to maintain
└── NO → Is the validation shared across many endpoints (common header check, content-type)?
    ├── YES → Use middleware — shared logic that applies globally or to a route group
    └── NO → Does the validation require constructor injection (repositories, services)?
        ├── YES → Use FormRequest — middleware requires more effort for DI
        └── NO → Use FormRequest — standard approach for endpoint-specific validation
```

**Rationale**: FormRequest is endpoint-specific validation. Middleware is cross-endpoint request processing. FormRequest provides better DI support.

**Recommended Default**: FormRequest for endpoint validation. Middleware only for truly cross-cutting concerns.

**Risks**: Using middleware for endpoint-specific validation pollutes the global pipeline. Using FormRequest for global validation duplicates logic across endpoints.

---

## Tree 2: Validation Before vs After Authentication

**Decision Context**: Whether to validate input before or after the user is authenticated.

**Decision Criteria**:
- Whether authentication data affects validation rules
- Performance (fail-fast on invalid input)
- Security posture

**Decision Tree**:
```
Does validation require the authenticated user (authorization, user-specific rules)?
├── YES → Validate after authentication — $this->user() must be available in the FormRequest
└── NO → Is fail-fast on invalid input preferred (avoid unnecessary auth overhead)?
    ├── YES → Validate before authentication — reject invalid input before auth
    └── NO → Does the application use a standard auth middleware on the route?
        ├── YES → Validate after auth — standard middleware pipeline order
        └── NO → Validate before auth — order ensures validation runs regardless of auth
```

**Rationale**: Validation runs before auth in the middleware pipeline by default. Move auth earlier if validation needs authenticated data.

**Recommended Default**: Route groups with auth middleware before FormRequest. Validate after auth if the FormRequest uses `$this->user()`.

**Risks**: Validating before auth prevents using user data in rules. Authenticating first on invalid input wastes auth processing.
