# Anti-Patterns — Spatie Laravel Data Integration

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Spatie Laravel Data Integration |
| Difficulty | Advanced |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Manual + Spatie Mix | High | Medium | Code review: some DTOs use Spatie, others use manual patterns |
| Data as FormRequest Replacement | Medium | Medium | Code review: Spatie Data used without FormRequest at all |
| Ignoring Package Updates | Medium | Medium | Code review: pinned abandoned version with known bugs |
| Over-Reliance on Automatic Construction | Medium | Medium | Code review: no tests for Data class construction |
| Validation Exception in Controllers | High | Medium | Bug reports: 500 errors from uncaught DataValidationException |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Not Using DataCollection | Array of nested Data objects typed as `array` instead of `DataCollection` | Loses type safety for collections of nested DTOs; iteration requires manual casting |
| Missing Custom Casts | Application-specific types (Money, Email) not registered as custom casts | Type coercion is manual at every construction site instead of centralized |
| No TypeScript Generation | TypeScript generation configured but never run in CI | Frontend types drift from backend DTOs; manual synchronization required |

---

## Anti-Pattern Details

### AP-SLD-01: Manual + Spatie Mix

**Description**: Some DTOs in the codebase use Spatie `Data` with `Data::from()` and automatic casting, while others use manual named constructors (`fromArray`, `toArray`). The two patterns coexist without clear boundaries. Developers must remember which DTOs use which pattern, and TypeScript generation (a key Spatie feature) is unavailable for the manual DTOs.

**Root Cause**: Incremental adoption without a team-wide decision. One developer introduces Spatie for their feature, but the rest of the codebase continues with the existing manual pattern. No migration plan or cutoff date is established.

**Impact**:
- Inconsistent developer experience: some DTOs are auto-constructed, others require manual factories
- TypeScript generation is incomplete (only Spatie DTOs are included)
- Testing patterns differ between the two DTO types
- Refactoring between patterns requires changing the entire DTO and all its callers

**Detection**:
- Code review: some DTOs extend `Data`, others have `fromArray`/`toArray`
- Code review: `Data::from()` and `new XxxDto(...)` coexist in the same feature
- Developer confusion: "Does this DTO use Spatie or manual?"

**Solution**:
- Choose one approach at the project level and apply it consistently
- If migrating from manual to Spatie, do it in a single sprint for all existing DTOs
- Write a migration guide and enforce the chosen pattern in code review
- Configure PHPStan to flag DTOs that don't follow the chosen pattern

**Example**:
```php
// BEFORE: Mixed patterns
// Spatie DTO
class CreateUserData extends Data
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}
}

// Manual DTO in the same codebase
class UpdateUserDto
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
    ) {}
    public static function fromArray(array $data): self { /* ... */ }
    public function toArray(): array { /* ... */ }
}

// AFTER: Consistent pattern (choose one)
// All Spatie or all manual — never both
```

---

### AP-SLD-02: Data as FormRequest Replacement

**Description**: The team uses Spatie Data's built-in validation as a complete replacement for Laravel FormRequests. All validation logic (HTTP validation, business rule validation) is defined in the Data class. The controller receives raw request data and passes it directly to `Data::from($request->all())`, bypassing the dedicated HTTP validation layer.

**Root Cause**: The developer sees Spatie Data's validation as "enough" and doesn't want to maintain both a FormRequest and a Data class. They view FormRequests as duplication.

**Impact**:
- HTTP validation concerns are mixed with data structure concerns in the Data class
- Data class becomes HTTP-coupled (validates HTTP-specific rules like `unique:users,email`)
- Validation rules can't be reused across different entry points (the Data class always validates everything)
- `Data::from()` with invalid input throws an exception — must be caught and handled appropriately

**Detection**:
- Code review: controller calls `Data::from($request->all())` instead of `Data::from($request->validated())`
- Code review: Data class `rules()` includes `unique:table,column` (database validation in Data)
- Code review: no FormRequest exists for the endpoint

**Solution**:
- Use FormRequests for HTTP validation (format, required fields, uniqueness)
- Use Spatie Data for structural validation (types, nested structures, custom casts)
- Pass `$request->validated()` to `Data::from()`, never `$request->all()`
- Decision: if Spatie Data handles all validation, ensure the team is aware of the tradeoffs

**Example**:
```php
// BEFORE: Data as FormRequest replacement
class CreateUserController
{
    public function __invoke(Request $request): JsonResponse
    {
        $data = CreateUserData::from($request->all()); // ❌ raw input, no FormRequest
        // ...
    }
}

class CreateUserData extends Data
{
    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'], // ❌ HTTP/db validation in Data
        ];
    }
}

// AFTER: FormRequest + Data
class CreateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
        ];
    }
}

class CreateUserController
{
    public function __invoke(CreateUserRequest $request): JsonResponse
    {
        $data = CreateUserData::from($request->validated()); // ✅ validated data
    }
}
```

---

### AP-SLD-03: Validation Exception in Controllers

**Description**: `Data::from()` throws `DataValidationException` when input data fails validation. If the controller does not catch this exception, it propagates as a 500 error instead of a proper validation error response. The API returns a generic server error instead of telling the client which fields are invalid.

**Root Cause**: The developer doesn't realize `Data::from()` throws on validation failure. They assume it returns null or fills defaults like a FormRequest. The exception is unhandled because the error path wasn't tested.

**Impact**:
- API consumers receive 500 errors for invalid input (consumer's fault, but server error)
- Debugging is confusing: "the validation works in tests but throws 500 in production"
- Frontend developers can't display field-level error messages
- Logs fill with DataValidationException stack traces for every bad request

**Detection**:
- Bug reports: 500 errors when submitting invalid data to endpoints using Spatie Data
- Code review: `Data::from()` call without try-catch in the controller
- Logs: recurring DataValidationException errors

**Solution**:
- Catch `DataValidationException` in the controller and return a 422 response
- Use Spatie Data's automatic exception handling (configurable in the package)
- Alternatively, validate the data before calling `Data::from()`
- Add tests for invalid input scenarios

**Example**:
```php
// BEFORE: Unhandled validation exception
class CreateUserController
{
    public function __invoke(CreateUserRequest $request): JsonResponse
    {
        $data = CreateUserData::from($request->validated()); // ❌ throws 500 on invalid
        $user = $this->createUser->execute($data);
        return response()->json($user, 201);
    }
}

// AFTER: Handle validation exception
class CreateUserController
{
    public function __invoke(CreateUserRequest $request): JsonResponse
    {
        try {
            $data = CreateUserData::from($request->validated());
        } catch (DataValidationException $e) {
            return response()->json([
                'errors' => $e->getErrors(),
            ], 422);
        }
        $user = $this->createUser->execute($data);
        return response()->json($user, 201);
    }
}
```
