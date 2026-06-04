# Manual Validator Usage — Engineering Rules

---

## Rule 1: Always Validate Input in Non-HTTP Contexts

---

## Category

Architecture

---

## Rule

Use `Validator::make()` to validate input in CLI commands, queued jobs, scheduled tasks, and any non-HTTP context that accepts external data. Do not skip validation because the input source is "internal."

---

## Reason

CLI arguments, file imports, queued job payloads, and API webhooks can all contain invalid or malicious data. The absence of a FormRequest does not remove the need for validation. Manual validation uses the same rule engine as FormRequests and provides the same guarantees.

---

## Bad Example

```php
class ImportUsersCommand extends Command
{
    public function handle(): void
    {
        $data = csv_to_array($this->argument('file'));
        User::insert($data); // No validation — invalid data enters DB
    }
}
```

---

## Good Example

```php
class ImportUsersCommand extends Command
{
    public function handle(): void
    {
        $data = csv_to_array($this->argument('file'));
        foreach ($data as $row) {
            $validator = Validator::make($row, [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'unique:users'],
            ]);
            if ($validator->fails()) {
                $this->error('Validation failed: ' . $row['email'] ?? 'unknown');
                continue;
            }
            User::create($validator->validated());
        }
    }
}
```

---

## Exceptions

CLI commands that only run internal, trusted operations with hardcoded or system-generated data may skip validation.

---

## Consequences Of Violation

Data integrity risks: invalid data enters the database. Security risks: injection through internal data sources.

---

## Rule 2: Always Check $validator->fails() Before Proceeding

---

## Category

Reliability

---

## Rule

Always check `$validator->fails()` after constructing a manual validator. Never assume validation passes and proceed directly with `$validator->validated()`.

---

## Reason

`validated()` throws `ValidationException` when validation fails. Without checking `fails()` first, invalid data causes an unhandled exception at the point of accessing validated data, potentially aborting batch operations or leaving transactions open.

---

## Bad Example

```php
$validator = Validator::make($data, $rules);
$user = User::create($validator->validated()); // Throws if validation fails
```

---

## Good Example

```php
$validator = Validator::make($data, $rules);

if ($validator->fails()) {
    throw new ValidationException($validator);
}

User::create($validator->validated());
```

---

## Exceptions

When using `$validator->validate()` (which throws automatically on failure), the check is built in.

---

## Consequences Of Violation

Reliability risks: unhandled exceptions in commands and jobs. Data integrity risks: partial batch operations on failure.

---

## Rule 3: Handle Authorization Separately for Manual Validators

---

## Category

Security

---

## Rule

Add explicit authorization checks via Gates or Policies alongside any manual validator usage. Manual validators do not include an `authorize()` method — security is not automatic.

---

## Reason

`Validator::make()` provides validation only — it has no concept of authorization. In a FormRequest, `authorize()` runs before validation. In manual contexts (commands, actions), authorization must be implemented separately to prevent unauthorized access to validated operations.

---

## Bad Example

```php
class DeleteUserAction
{
    public function execute(array $input): void
    {
        $validator = Validator::make($input, ['id' => 'required|exists:users']);
        $user = User::findOrFail($validator->validated()['id']);
        // No authorization — anyone can delete any user
        $user->delete();
    }
}
```

---

## Good Example

```php
class DeleteUserAction
{
    public function __construct(private User $currentUser) {}

    public function execute(array $input): void
    {
        $validator = Validator::make($input, ['id' => 'required|exists:users']);
        $user = User::findOrFail($validator->validated()['id']);

        Gate::authorize('delete', $user); // Explicit authorization

        $user->delete();
    }
}
```

---

## Exceptions

For idempotent or public operations (registration, password reset) where authorization is not applicable, explicit authorization may be skipped.

---

## Consequences Of Violation

Security risks: unauthorized operations in commands and jobs. Audit gaps: missing authorization checks in non-HTTP contexts.

---

## Rule 4: Throw ValidationException for Consistent Error Handling

---

## Category

Architecture

---

## Rule

When manual validation fails, throw `Illuminate\Validation\ValidationException` rather than generic exceptions, abort calls, or custom error responses.

---

## Reason

`ValidationException` is the standardized validation failure signal in Laravel. It is caught by Laravel's exception handler, which provides consistent JSON (API) or redirect (web) responses. Using generic exceptions bypasses this pipeline and forces each consumer to implement its own error handling.

---

## Bad Example

```php
if ($validator->fails()) {
    abort(422, $validator->errors()->first()); // Non-standard error format
}
```

---

## Good Example

```php
if ($validator->fails()) {
    throw new ValidationException($validator); // Standard Laravel behavior
}
```

---

## Exceptions

In CLI commands where a user must see errors in the terminal, catch `ValidationException` and format output manually. In actions, re-throw or return result objects.

---

## Consequences Of Violation

Maintenance risks: inconsistent error handling across the application. User experience: incompatible error response formats.

---

## Rule 5: Use setData() for Batch Validation

---

## Category

Performance

---

## Rule

When validating multiple data items with the same rules (e.g., CSV rows, API batch payloads), construct the Validator once and call `setData()` for each item. Do not create a new Validator instance per item.

---

## Reason

Validator construction includes rule parsing, message resolution, and factory setup. For large batches (hundreds or thousands of items), constructing a new Validator per item creates unnecessary overhead. `setData()` replaces only the data array while preserving the rule configuration.

---

## Bad Example

```php
foreach ($rows as $row) {
    $validator = Validator::make($row, $rules); // New Validator per row
    if ($validator->fails()) { /* handle */ }
}
```

---

## Good Example

```php
$validator = Validator::make([], $rules); // Construct once

foreach ($rows as $row) {
    $validator->setData($row); // Reuse — only data changes
    if ($validator->fails()) {
        $this->error("Row failed: " . json_encode($validator->errors()->all()));
        continue;
    }
    User::create($validator->validated());
}
```

---

## Exceptions

When different rows require different validation rules, construct a new Validator per batch of rows with the same rules.

---

## Consequences Of Violation

Performance risks: unnecessary Validator construction overhead in large batches. Scalability risks: increased memory and CPU usage for batch operations.

---

## Rule 6: Keep Validation Rules Co-Located with the Action or Command

---

## Category

Maintainability

---

## Rule

Define validation rules inline within the action, command, or service where manual validation occurs. Do not extract rules to separate rule classes unless they are reused across multiple contexts.

---

## Reason

Rules defined inline are visible at the point of use, making it immediately clear what constraints apply. Separate rule files for single-use scenarios create unnecessary indirection and navigation overhead.

---

## Bad Example

```php
// app/Rules/ImportUserRules.php — single-use rule set
class ImportUserRules
{
    public static function get(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users'],
        ];
    }
}

// In the command — must navigate to a separate file to see rules
$validator = Validator::make($data, ImportUserRules::get());
```

---

## Good Example

```php
class ImportUsersCommand extends Command
{
    public function handle(): void
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users'],
        ];

        $validator = Validator::make($data, $rules);
        // Rules are visible right here
    }
}
```

---

## Exceptions

When the exact same validation rules are used in multiple manual contexts (e.g., import command and API endpoint), extract to a shared rule class or method.

---

## Consequences Of Violation

Maintenance risks: navigation overhead to find relevant rules. Code organization: unnecessary abstractions for single-use rule sets.
