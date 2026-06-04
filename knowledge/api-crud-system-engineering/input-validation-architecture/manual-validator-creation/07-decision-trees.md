# Decision Trees: Manual Validator Creation

## Tree 1: FormRequest vs Manual Validator

```
Is the data source an HTTP request?
├── YES, HTTP endpoint with user input → Use FormRequest. Don't use manual Validator::make().
├── YES, but data comes from multiple sources (request + DB + API) → FormRequest for HTTP portion. Manual validator for merged data.
├── NO, queued job validation → Manual validator with Validator::make(). Catch ValidationException.
├── NO, CLI command arguments → Manual validator with Validator::make(). Return error output.
├── NO, API response validation (outgoing) → Manual validator. Validate external API response shape.
└── NO, service-layer defense in depth → Manual validator as additional validation layer. Don't duplicate FormRequest rules.
```

## Tree 2: Error Handling Approach

```
What context is the manual validator used in?
├── HTTP controller with service layer → Throw ValidationException. Framework handler formats the response.
├── Queued job → Catch ValidationException. Log failure. Mark job as failed (don't release).
├── CLI command → Catch ValidationException. Output errors to console. Exit with code 1.
├── Batch processing → Return ValidationResult object with per-item passes/fails/errors. Don't throw.
└── External API response validation → Log validation failures. Return error to caller. Don't throw.
```

## Tree 3: Validator Instance Reuse

```
Is this validation in a loop or batch operation?
├── YES, validating multiple items → Create fresh Validator::make() per item. Validators cache results.
├── YES, but items share the same rules → Create fresh per item. Extract rules to variable for reuse. Don't reuse validator.
├── NO, single item validation → Single Validator::make() instance. Check passes()/fails() once.
└── NO, but validator is called multiple times → Single instance, but only after first pass/fail. Cache rules, not validator.
```

## Tree 4: ValidationResult vs Throw

```
Does the caller need to handle partial success?
├── YES, batch with some passing, some failing → Return ValidationResult { passes, data, errors }.
├── YES, but fail-fast on first error → Throw ValidationException immediately. Don't process remaining items.
├── NO, all-or-nothing operation → Throw ValidationException. Let exception handler process it.
├── NO, the caller is a controller → Throw ValidationException. Matches FormRequest behavior.
└── NO, the caller is a job → Catch ValidationException. Log and fail. Don't let it bubble.
```

## Tree 5: Rule Consistency

```
Does this manual validation duplicate FormRequest rules?
├── YES, same rules for same data → Don't duplicate. Reference shared rule arrays or skip manual validation.
├── PARTIALLY, some overlapping rules → Extract overlapping rules to shared method. Only manual-validate additional rules.
├── NO, completely different data (not in FormRequest) → Define rules inline or in dedicated rule class.
└── NO, additional constraints on top of FormRequest (defense in depth) → Define only the additional constraints. Don't re-validate already-validated data.
```
