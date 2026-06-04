# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Form Requests & Validation |
| Knowledge Unit | Manual Validator Usage |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Manual validator usage — calling `Validator::make()` directly outside of FormRequests — is required when validation occurs in non-HTTP contexts such as commands, queued jobs, service classes, and domain actions. The `Validator` class is resolved from the container, instantiated with data and rules, and its `passes()`, `fails()`, or `validate()` methods determine the outcome. Manual validation is a necessary escape hatch when the auto-validating FormRequest pattern does not fit the execution context.

---

## Core Concepts

- **Validator::make() factory**: `Validator::make($data, $rules, $messages, $attributes)` — creates a new Validator instance
- **Validation result methods**: `passes()` (bool), `fails()` (bool), `validate()` (passes or throws), `validated()` (returns validated data), `errors()` (returns MessageBag)
- **Stateless per-run**: Each `passes()` call constructs the internal `MessageBag` fresh; Validator can be reused with `setData()`
- **Factory resolution**: Resolves the Validator, injects presence verifier (for `unique`/`exists`), sets container, adds extensions
- **Same internal flow**: Manual `passes()` follows the exact same loop as FormRequest auto-validation — the difference is who triggers it

---

## When To Use

- Non-HTTP contexts: CLI commands, queued jobs, scheduled tasks
- Service classes and domain actions that receive data from non-HTTP sources
- Batch processing where multiple records need independent validation
- Testing custom validation rules in isolation
- Applications that accept data via multiple channels (API, file import, CLI)

## When NOT To Use

- HTTP controller actions (use FormRequests)
- Simple validation that can be expressed inline in a controller
- When FormRequest auto-validation is already in place

---

## Best Practices

- **Use `Fluent` or `Aggregate` for validator access** — avoid resolving directly from container for simple cases
- **Always check validation result** before proceeding — `$validator->fails()` should gate business logic
- **Wrap validation results in DTOs** — return `ValidatedData` or throw `ValidationException` from the action
- **Keep rules co-located** with the action/command that uses them — not in a separate rules class
- **Use custom messages** for non-HTTP contexts where users see errors directly in terminal or logs
- **Throw `ValidationException`** for consistency with Laravel's validation pipeline

---

## Architecture Guidelines

- `ValidationFactory::make()` resolves the Validator, injects presence verifier, and adds extensions
- Manual Validator uses the EXACT same rule parsing as FormRequests — all custom rules work identically
- `setData()` allows Validator reuse for bulk validation scenarios
- `ValidationException` thrown from manual validation is caught by Laravel's exception handler
- For API contexts, `ValidationException` returns JSON 422; for CLI, it's a regular exception
- Use `Validator::resolver()` to customize the validator class globally if needed

---

## Performance

Manual validation has the same performance characteristics as FormRequest validation. The Validator is lightweight to construct (~0.1ms). For batch validation, reuse the Validator with `setData()` instead of creating a new instance per item. Database rules like `unique` add query overhead.

---

## Security

Manual validation does NOT bypass security — the `Validator` class runs the same rule engine as FormRequests. However, manual validators don't have an `authorize()` method — authorization must be handled separately via Gates/Policies in the action/command context.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Skipping validation in commands | "It's internal code" | Invalid data enters the system | Always validate non-HTTP input |
| Not checking validator result | Assuming data is valid | Process invalid data | Always check `$validator->fails()` |
| Forgetting authorization | Manual Validator has no authorize() | No access control | Add explicit Gate/Policy check |
| Creating Validator per item in batch | New Validator for each row | Performance overhead | Use `setData()` to reuse Validator |
| Not throwing ValidationException | Returning raw errors | Inconsistent error handling | Throw ValidationException for consistency |

---

## Anti-Patterns

- **Skipping validation entirely** in CLI commands and jobs
- **Not checking `$validator->fails()`** — assuming validation always passes
- **Manual validation inside a FormRequest** — defeats the purpose of FormRequest
- **Throwing generic exceptions** instead of `ValidationException` from manual validators

---

## Examples

**Manual validation in a command:**
```php
class ImportUsersCommand extends Command
{
    public function handle(): void
    {
        $data = csv_to_array($this->argument('file'));

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
        ]);

        if ($validator->fails()) {
            $this->error('Validation failed:');
            foreach ($validator->errors()->all() as $error) {
                $this->error("- $error");
            }
            return;
        }

        User::create($validator->validated());
    }
}
```

**Manual validation in an action:**
```php
class RegisterUserAction
{
    public function execute(array $input): User
    {
        $validator = Validator::make($input, [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return User::create($validator->validated());
    }
}
```

**Batch validation with setData():**
```php
$rules = ['email' => 'required|email|unique:users'];
$validator = Validator::make([], $rules);

foreach ($users as $user) {
    $validator->setData($user);
    if ($validator->fails()) {
        // Handle failure for this user
    }
}
```

---

## Related Topics

- form-request-fundamentals — FormRequest auto-validation
- validation-rule-patterns — Rule syntax and parsing
- custom-validation-rules — Creating reusable rules
- conditional-validation — Field-dependent rules
- after-validation-hooks — Post-validation processing

---

## AI Agent Notes

- `ValidationFactory::make()` calls `$this->resolve()` which defaults to `new Validator(...)`
- `resolve()` can be overridden via `Validator::resolver()` for custom Validator classes
- Manual `passes()` follows the exact same loop as FormRequest auto-validation
- `setData()` replaces the internal data array — Validator can be reused
- `ValidationException` thrown from manual validation is handled by Laravel's exception handler
- The Validator is stateless per `passes()` call — each call constructs `MessageBag` fresh

---

## Verification

- [ ] Manual validation used only in non-HTTP contexts
- [ ] `$validator->fails()` always checked before proceeding
- [ ] Authorization handled separately via Gates/Policies
- [ ] `ValidationException` thrown for consistent error handling
- [ ] Batch validation uses `setData()` to reuse Validator
- [ ] Custom messages provided for CLI/terminal output
- [ ] Rules co-located with the action/command using them
- [ ] Tests cover both pass and fail paths
