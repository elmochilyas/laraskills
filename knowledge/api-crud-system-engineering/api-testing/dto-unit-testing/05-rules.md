# DTO Unit Testing — Rules

## Test Construction From Each Input Type
---
## Category
Testing
---
## Rule
Test DTO construction from every input source the DTO supports: `fromArray()`, `fromRequest()`, `fromModel()`, and direct constructor.
---
## Reason
Each factory method or named constructor may have different mapping logic. A DTO that constructs correctly from an array may fail when built from a model (wrong key mapping, missing fields). Testing each input source independently ensures all construction paths produce identical, correct DTOs.
---
## Bad Example
```php
it('constructs from array', function () {
    $dto = PostDTO::fromArray(['title' => 'Hello']);
    expect($dto->title)->toBe('Hello');
    // Never tests fromModel or fromRequest
});
```
---
## Good Example
```php
it('constructs from array', function () {
    expect(PostDTO::fromArray(['title' => 'Hello'])->title)->toBe('Hello');
});

it('constructs from model', function () {
    $post = Post::factory()->make(['title' => 'Hello']);
    expect(PostDTO::fromModel($post)->title)->toBe('Hello');
});
```
---
## Exceptions
When the DTO only supports one input type (e.g., direct constructor only), test that single path thoroughly.
---
## Consequences Of Violation
`fromModel` silently drops fields; `fromRequest` maps wrong keys; inconsistent DTOs produced depending on input source.
---

## Test Default Values For Optional Fields
---
## Category
Testing
---
## Rule
Assert that optional fields get the expected default values when not provided during construction.
---
## Reason
A DTO's default value contract is as important as its required field contract. Missing or wrong defaults propagate silently through the entire pipeline — a `status` defaulting to `null` instead of `'draft'` can break business logic downstream.
---
## Bad Example
```php
it('constructs from array', function () {
    $dto = PostDTO::fromArray(['title' => 'Hello']);
    expect($dto->title)->toBe('Hello');
    // Does not test default value for 'status'
});
```
---
## Good Example
```php
it('uses draft as default status', function () {
    $dto = PostDTO::fromArray(['title' => 'Hello']);

    expect($dto->status)->toBe('draft');
});

it('allows overriding default status', function () {
    $dto = PostDTO::fromArray(['title' => 'Hello', 'status' => 'published']);

    expect($dto->status)->toBe('published');
});
```
---
## Exceptions
When the DTO has no optional fields (all fields required), default-value tests are not applicable.
---
## Consequences Of Violation
Null or wrong default values cause downstream bugs; unclear contract — consumers don't know what happens when a field is omitted.
---

## Test Type Enforcement
---
## Category
Testing
---
## Rule
Assert that passing the wrong type to a typed DTO property throws a `TypeError`.
---
## Reason
PHP 8.2 typed properties are the primary defense against data corruption at the API boundary. A DTO that accepts `int` for a `string` field silently coerces the value, potentially masking upstream validation failures. Testing type enforcement proves the DTO's type contract is enforced at runtime.
---
## Bad Example
```php
it('constructs from array', function () {
    $dto = PostDTO::fromArray(['title' => 'Hello', 'views' => 100]);
    expect($dto->views)->toBe(100);
    // Does not test that string 'abc' for views throws TypeError
});
```
---
## Good Example
```php
it('rejects non-integer views', function () {
    expect(fn() => PostDTO::fromArray(['title' => 'Hello', 'views' => 'not-a-number']))
        ->toThrow(TypeError::class);
});

it('rejects non-string title', function () {
    expect(fn() => PostDTO::fromArray(['title' => 123]))
        ->toThrow(TypeError::class);
});
```
---
## Exceptions
When the DTO uses `mixed` type parameters, type enforcement tests may not apply.
---
## Consequences Of Violation
Data type corruption at the API boundary; downstream code receives `string` where `int` expected; cascading type errors in business logic.
---

## Test Serialization
---
## Category
Testing
---
## Rule
Assert that `toArray()`, `toJson()`, and `json_encode($dto)` produce the expected output structure.
---
## Reason
A DTO that constructs correctly but serializes incorrectly produces broken API responses. Missing keys in `toArray()`, wrong key names, or unexpected nested structures all break the serialization contract. Testing serialization catches these gaps.
---
## Bad Example
```php
it('constructs from array', function () {
    $dto = PostDTO::fromArray(['title' => 'Hello', 'status' => 'draft']);
    expect($dto->title)->toBe('Hello');
    // Does not test toArray output
});
```
---
## Good Example
```php
it('serializes to expected array', function () {
    $dto = PostDTO::fromArray(['title' => 'Hello', 'status' => 'draft']);

    expect($dto->toArray())->toBe([
        'title' => 'Hello',
        'status' => 'draft',
        'published_at' => null,
    ]);
});

it('serializes to JSON', function () {
    $dto = PostDTO::fromArray(['title' => 'Hello']);

    expect($dto->toJson())->toBeJson();
    expect(json_decode($dto->toJson(), true))->toHaveKey('title');
});
```
---
## Exceptions
When the DTO is never serialized (internal use only), serialization tests are optional.
---
## Consequences Of Violation
API responses missing or incorrectly named keys; clients parse null fields; serialization bugs found only at integration test level.
---

## Test Immutability
---
## Category
Testing
---
## Rule
Assert that the DTO has no public setters and cannot be modified after construction.
---
## Reason
Mutable DTOs defeat their purpose as predictable data contracts. If a service modifies a DTO after construction, the original data is lost and side effects propagate unpredictably. Immutability is the core guarantee — test it explicitly.
---
## Bad Example
```php
// No immutability test — DTO may have setters
it('constructs from array', function () {
    $dto = PostDTO::fromArray(['title' => 'Hello']);
    expect($dto->title)->toBe('Hello');
});
```
---
## Good Example
```php
it('enforces immutability', function () {
    $dto = PostDTO::fromArray(['title' => 'Hello', 'status' => 'draft']);

    expect($dto)->not->toHaveMethods(['setTitle', '__set', 'update']);
    // Using readonly class or private setters
});
```
---
## Exceptions
When the DTO intentionally requires mutability (rare — consider using a different pattern), document and test the mutation behavior explicitly.
---
## Consequences Of Violation
Accidental DTO mutation in service layer; data race conditions in concurrent operations; hard-to-debug state changes.
---

## Test Nested DTOs Recursively
---
## Category
Testing
---
## Rule
Test construction and serialization of DTOs that contain other DTOs as properties.
---
## Reason
A parent DTO may construct and serialize correctly, but its nested child DTO may have a bug that only surfaces during recursive serialization. Testing nested DTOs as a unit catches these hidden issues.
---
## Bad Example
```php
it('constructs post with author', function () {
    $dto = PostDTO::fromArray([
        'title' => 'Hello',
        'author' => ['name' => 'John', 'email' => 'john@example.com'],
    ]);

    expect($dto->title)->toBe('Hello');
    expect($dto->author)->toBeInstanceOf(AuthorDTO::class);
    // Does not test that author serializes correctly
});
```
---
## Good Example
```php
it('constructs post with nested author', function () {
    $dto = PostDTO::fromArray([
        'title' => 'Hello',
        'author' => ['name' => 'John', 'email' => 'john@example.com'],
    ]);

    expect($dto->author->name)->toBe('John');
});

it('serializes nested DTOs recursively', function () {
    $dto = PostDTO::fromArray([
        'title' => 'Hello',
        'author' => ['name' => 'John', 'email' => 'john@example.com'],
    ]);

    $array = $dto->toArray();
    expect($array['author'])->toHaveKey('name');
    expect($array['author'])->toHaveKey('email');
});
```
---
## Exceptions
When the DTO contains no nested object or collection properties, recursion tests are not needed.
---
## Consequences Of Violation
Nested DTOs silently drop fields during serialization; consumer receives incomplete nested data; debugging requires tracing through multiple layers.
---
