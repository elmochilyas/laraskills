# DTO Integration: payload() Method — Rules

## Use payload() Over validated() in Controllers
---
## Category
Architecture | Maintainability
---
## Rule
Define a `payload()` method on the FormRequest that returns a typed DTO, and use `$request->payload()` in controllers instead of `$request->validated()`.
---
## Reason
Array access with `validated()` uses magic string keys with no compile-time safety. A typed DTO provides IDE autocompletion, refactoring support, and an explicit contract for consumers.
---
## Bad Example
```php
public function store(StorePostRequest $request): PostResource
{
    $post = Post::create($request->validated()); // Magic keys, no type safety
}
```
---
## Good Example
```php
public function store(StorePostRequest $request): PostResource
{
    $post = $this->posts->create($request->payload()); // Typed DTO
}
```
---
## Exceptions
Trivial CRUD endpoints where validated data maps exactly to model fillable attributes — but prefer `payload()` once a DTO exists.
---
## Consequences Of Violation
Controllers access raw arrays with string-keyed data; refactoring field names requires hunting through all call sites; no type safety in method signatures.

---

## Use Only $this->validated() as payload() Data Source
---
## Category
Security | Reliability
---
## Rule
Construct the DTO exclusively from `$this->validated()` inside `payload()` — never use `$this->all()`, `$this->input()`, or `$this->json()`.
---
## Reason
`$this->validated()` returns only fields that passed validation rules. Using `$this->all()` or `$this->input()` bypasses the validation contract, allowing unvalidated or malicious data into the DTO.
---
## Bad Example
```php
public function payload(): PostData
{
    return PostData::from([
        'title' => $this->input('title'), // Unvalidated — may fail rules
        'body' => $this->all()['body'],    // Bypasses validation entirely
    ]);
}
```
---
## Good Example
```php
public function payload(): PostData
{
    return PostData::from([
        ...$this->validated(),
        'author_id' => $this->user()->id,
    ]);
}
```
---
## Exceptions
Server-generated fields merged in `payload()` (user ID, IP, timestamps) need not be validated — they come from the authenticated context, not user input.
---
## Consequences Of Violation
Invalid data enters the domain layer; validation rules can be bypassed via alternate input methods; security vulnerabilities from unvalidated data.

---

## Return Readonly/Immutable DTOs from payload()
---
## Category
Reliability | Security
---
## Rule
Return readonly (PHP 8.1+) or immutable DTOs from `payload()` — prevent downstream mutation after construction.
---
## Reason
Mutable DTOs allow any consumer to modify data after `payload()` returns, making it impossible to trust that the DTO still reflects validated input when it reaches the service layer.
---
## Bad Example
```php
class PostData
{
    public function __construct(
        public string $title, // Publicly mutable
    ) {}
}
```
---
## Good Example
```php
class PostData
{
    public function __construct(
        public readonly string $title,
    ) {}
}
```
---
## Exceptions
When using Spatie Laravel Data which supports immutable by default — still mark properties as `readonly` where possible.
---
## Consequences Of Violation
Data corruption when middleware or controller code mutates DTO properties; debug sessions chasing changes to "validated" data.

---

## Keep payload() Free of I/O and Side Effects
---
## Category
Reliability | Performance
---
## Rule
Keep `payload()` as a pure data mapping method — no database queries, API calls, file operations, or job dispatches.
---
## Reason
`payload()` is called during request resolution; performing I/O here adds latency to every request and may execute side effects even if the controller later throws an exception.
---
## Bad Example
```php
public function payload(): PostData
{
    $category = Category::find($this->validated('category_id')); // DB query in payload
    return PostData::from([...$this->validated(), 'category_name' => $category->name]);
}
```
---
## Good Example
```php
public function payload(): PostData
{
    return PostData::from([...$this->validated()]); // Pure mapping — no I/O
}
// Resolve category name in the service layer instead
```
---
## Exceptions
Reading from authenticated user context (`$this->user()->id`) is acceptable — it is in-memory and already resolved.
---
## Consequences Of Violation
Increased request latency; side effects that execute even when the controller handler fails; difficulty testing `payload()` without mocking I/O.

---

## Prefer Constructor-Based DTOs Over from() for Complex Mapping
---
## Category
Performance | Maintainability
---
## Rule
Use constructor-based DTO construction for complex mapping (type casting, defaults, conditional fields); use Spatie's `from()` for simple validated-to-DTO pass-through.
---
## Reason
`from()` uses reflection and works well for exact field matching but lacks control for type coercion, default values, or computed fields. Constructor-based construction is explicit, type-safe, and faster.
---
## Bad Example
```php
public function payload(): PostData
{
    return PostData::from($this->validated()); // Can't handle type coercion or computed fields
}
```
---
## Good Example
```php
public function payload(): PostData
{
    $data = $this->validated();
    return new PostData(
        title: $data['title'],
        slug: Str::slug($data['title']),
        authorId: $this->user()->id,
    );
}
```
---
## Exceptions
Simple DTOs where every validated field maps 1:1 to a DTO property — Spatie's `from()` reduces boilerplate.
---
## Consequences Of Violation
Type errors from unmatched field types; missed defaults or computed fields; performance overhead from reflection in tight loops.

---

## Document payload() Return Type with PHPDoc
---
## Category
Maintainability
---
## Rule
Add a PHPDoc `@return` annotation to every `payload()` method specifying the exact DTO class returned.
---
## Reason
Without a `@return` annotation, IDE autocompletion and static analysis tools cannot determine the DTO type, negating the type-safety benefit of using DTOs.
---
## Bad Example
```php
public function payload() // No return type hint or PHPDoc
{
    return PostData::from($this->validated());
}
```
---
## Good Example
```php
/** @return PostData */
public function payload(): PostData
{
    return PostData::from($this->validated());
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
IDE treats `$request->payload()` as `mixed`; no autocompletion for DTO properties; static analysis misses type mismatches.
