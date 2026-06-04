# Decision Trees — Authentication Error Responses

## Tree 1: Error Code Selection by Auth Failure Type

**Decision Context**: Choosing the appropriate error code for different authentication failure modes.

**Decision Criteria**:
- Token presence (missing vs present)
- Token validity (expired vs malformed vs valid)
- Guard type (Sanctum, Passport, custom)

**Decision Tree**:
```
Is the request missing any authentication credentials?
├── YES → Return USER.AUTH_UNAUTHENTICATED — generic "authentication required" with WWW-Authenticate header
└── NO → Are credentials present but invalid?
    ├── YES → Is the token expired?
    │   ├── YES → Return USER.AUTH_TOKEN_EXPIRED — client can silently refresh token
    │   └── NO → Return USER.AUTH_TOKEN_INVALID — token is malformed or tampered; client must re-authenticate
    └── NO → Is the guard type different from the expected one?
        ├── YES → Return USER.AUTH_UNAUTHENTICATED with guard-specific WWW-Authenticate schemes
        └── NO → Return USER.AUTH_UNAUTHENTICATED (fallback)
```

**Rationale**: Distinguishing expired vs invalid tokens enables client-side refresh logic without requiring user re-login.

**Recommended Default**: Missing → `USER.AUTH_UNAUTHENTICATED`. Expired → `USER.AUTH_TOKEN_EXPIRED`. Invalid → `USER.AUTH_TOKEN_INVALID`.

**Risks**: Returning the same code for all auth failures prevents client-side refresh optimization. Too-granular codes may leak token validation internals.

---

## Tree 2: 401 vs 403 Distinction

**Decision Context**: Determining whether a request failure should be 401 (authentication) or 403 (authorization).

**Decision Criteria**:
- Authentication state (is the user identified?)
- Credential presence
- Resource access level

**Decision Tree**:
```
Is the user authenticated (has valid credentials)?
├── NO → Is the endpoint protected by auth middleware?
│   ├── YES → Return 401 — authentication required
│   └── NO → Allow request to proceed (public endpoint)
└── YES → Does the user have permission for this action?
    ├── NO → Return 403 — authenticated but not authorized
    └── YES → Process the request normally
```

**Rationale**: 401 means "I don't know who you are." 403 means "I know who you are, but you can't do this." The distinction is critical for client-side behavior.

**Recommended Default**: Return 401 for missing/invalid credentials. Return 403 for authenticated-but-denied.

**Risks**: Returning 403 for missing credentials (common mistake) breaks HTTP semantics and prevents automatic re-authentication flows.
