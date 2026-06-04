# Decision Trees: Error Code Taxonomy

## Tree 1: When To Add a New Error Code

```
Does this error scenario already have an error code?
├── YES → Use existing code. No new code needed.
├── NO → Is the error actionable differently than existing codes?
│   ├── YES → Add new code in appropriate category
│   ├── NO → Does the existing code's description cover this scenario?
│   │   ├── YES → Use existing code. Update documentation if needed.
│   │   └── NO → Add new code. Broader description may help.
│   └── UNSURE → Add new code. Better to have granularity and merge later than vice versa.
```

## Tree 2: Category Assignment

```
What type of error is this?
├── Invalid or missing input → VALIDATION_
├── Authentication failure (missing/invalid/expired credentials) → AUTH_
├── Authorization failure (authenticated but no permission) → AUTHORIZATION_
├── Resource not found → NOT_FOUND_
├── Resource conflict (duplicate, stale data, state conflict) → CONFLICT_
├── Rate limit exceeded → RATE_LIMIT_
├── Server error (internal failure, external service down) → SERVER_
└── None of the above → Define new category
```

## Tree 3: Granularity Decision

```
Will clients handle this error differently than other errors in the same category?
├── YES, clients need different UX/messaging per scenario → Per-scenario code (VALIDATION_001, VALIDATION_002)
├── NO, clients handle all errors in this category the same way → Single category code suffices
├── MOSTLY the same, but one scenario needs special handling → Add specific code for the special case. Rest share a general code.
└── UNSURE yet → Granular codes are easier to merge than to split. Start granular.
```
