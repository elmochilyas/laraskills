# Conditional Attributes — Engineering Rules

---

## Rule: Use Lazy Evaluation for Expensive Computations

---

## Category

Performance

---

## Rule

Always wrap expensive computations inside `when()` as closures (`fn() => ...`) rather than passing the result directly. The computation must only execute when the condition is true.

---

## Reason

Passing a function call result (`when($condition, $this->heavy())`) forces eager evaluation regardless of the condition, defeating the purpose of conditional inclusion and wasting resources on every request where the field is omitted.

---

## Bad Example

```php
'secret_key' => $this->when(
    $request->user()?->isAdmin(),
    $this->generateSecretKey()  // Executes every request, even for non-admins
),
```

---

## Good Example

```php
'report_url' => $this->when(
    $request->user()?->isAdmin(),
    fn() => route('admin.reports', $this->id)  // Only runs when condition is true
),
```

---

## Exceptions

Trivial operations (property reads, simple casts, string concatenation) do not need closure wrapping — the overhead of the closure itself can exceed the computation.

---

## Consequences Of Violation

Performance risks from unnecessary computation on every request; scalability risks as expensive operations multiply across collection items.

---

## Rule: Prefer whenHas for Model Attributes and whenNotNull for Computed Values

---

## Category

Design

---

## Rule

Use `whenHas($attribute)` when checking whether a raw model attribute exists. Use `whenNotNull($value)` when checking whether a computed or accessor-resolved value is non-null.

---

## Reason

`whenHas` checks attribute existence via `isset` on the model — a computed accessor that transforms null to a default value will cause `whenHas` to include the field while `whenNotNull` would exclude it. The methods differ in behavior and must be chosen intentionally.

---

## Bad Example

```php
// Accessor: getNameAttribute() { return $this->name ?? 'Guest'; }
'name' => $this->whenHas('name'),
// Includes 'name' even when original attribute is null, because accessor returns 'Guest'
```

---

## Good Example

```php
'name' => $this->whenNotNull($this->name),
// Omits 'name' only when the resolved accessor value is actually null
```

---

## Exceptions

Use `whenHas` for raw, unmodified model columns where no accessor transformation exists. Use `whenNotNull` for any field with an accessor, mutator, or computed value.

---

## Consequences Of Violation

Maintenance risks from subtle differences between attribute existence and resolved value; unpredictable API responses where fields appear or disappear based on accessor behavior.

---

## Rule: Never Rely on Conditional Omission as Sole Security Mechanism

---

## Category

Security

---

## Rule

Always pair conditional field visibility with proper authorization gates (policies, middleware) at the endpoint level. Conditional omission in the resource must never be the only protection for sensitive data.

---

## Reason

Conditional `when()` only removes the field from the JSON response — it does not prevent the data from being loaded in memory, does not prevent access to the endpoint, and does not prevent inference that hidden fields exist. Authorization must happen before the resource is ever constructed.

---

## Bad Example

```php
public function toArray($request): array
{
    return [
        'secret_key' => $this->when($request->user()?->isAdmin(), $this->secret_key),
        // No policy check on the controller — non-admin can still call the endpoint
    ];
}
```

---

## Good Example

```php
// Controller
public function show(User $user): UserResource
{
    $this->authorize('viewSensitive', $user);  // Gate first
    return new UserResource($user);
}

// Resource — conditional is formatting only, not authorization
public function toArray($request): array
{
    return [
        'secret_key' => $this->when(
            $request->user()?->isAdmin(),
            $this->secret_key
        ),
    ];
}
```

---

## Exceptions

No common exceptions. Endpoint-level authorization is always required for sensitive data.

---

## Consequences Of Violation

Security risks from unauthorized data access; data breach potential when conditional omission is mistaken for access control; regulatory compliance violations (GDPR, HIPAA).

---

## Rule: Split Resource When Most Fields Are Conditional

---

## Category

Maintainability

---

## Rule

When more than 70% of fields in a resource are wrapped in `when()`, `whenHas()`, or `whenNotNull()`, split the resource into separate per-endpoint or per-context resources instead.

---

## Reason

A resource dominated by conditionals is hard to read, test, and maintain. The logic for multiple endpoint shapes is tangled in one class. Clients face an unpredictable schema where field presence varies across requests. Separate resources make the contract explicit and testable.

---

## Bad Example

```php
public function toArray($request): array
{
    return [
        'id' => $this->when($isDetail, $this->id),
        'name' => $this->when($isDetail, $this->name),
        'email' => $this->when($isAdmin, $this->email),
        'bio' => $this->when($hasBio, $this->bio),
        'phone' => $this->when($isAdmin && $isDetail, $this->phone),
        'address' => $this->when($isDetail && $isAdmin, $this->address),
        // 8 out of 10 fields are conditional
    ];
}
```

---

## Good Example

```php
// UserSummaryResource — always returned, always the same fields
public function toArray($request): array
{
    return ['id' => $this->id, 'name' => $this->name];
}

// UserDetailResource — returned for detail views
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'bio' => $this->whenHas('bio'),
        'phone' => $this->phone,
    ];
}

// AdminUserResource — returned for admin views
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'secret_key' => $this->secret_key,
    ];
}
```

---

## Exceptions

Resources consumed exclusively by internal BFF (Backend for Frontend) APIs where the single client is the only consumer and understands the conditional contract.

---

## Consequences Of Violation

Maintainability risks from complex conditional logic; testing explosion (2^n combinations); client integration failures due to unpredictable schemas.

---

## Rule: Test Every Conditional Path

---

## Category

Testing

---

## Rule

For each `when()`, `whenHas()`, `whenNotNull()`, and `mergeWhen()` in a resource, write test cases that verify both the inclusion (condition true) and omission (condition false) paths.

---

## Reason

Conditional fields define the API contract for clients — a field that is accidentally always absent breaks consumers just as badly as a field that is always present. Without testing both paths, conditionals create undocumented, untested behavior that fails silently.

---

## Bad Example

```php
// Test only checks the happy path
public function test_user_resource_returns_bio(): void
{
    $user = User::factory()->make(['bio' => 'Hello']);
    $data = (new UserResource($user))->response()->getData(true);
    $this->assertArrayHasKey('bio', $data['data']);
    // Never tests that bio is omitted when null
}
```

---

## Good Example

```php
/** @dataProvider bioVisibilityProvider */
public function test_bio_visibility(bool $hasBio, bool $shouldAppear): void
{
    $user = User::factory()->make($hasBio ? ['bio' => 'Hello'] : ['bio' => null]);
    $data = (new UserResource($user))->response()->getData(true);

    if ($shouldAppear) {
        $this->assertArrayHasKey('bio', $data['data']);
    } else {
        $this->assertArrayNotHasKey('bio', $data['data']);
    }
}

public static function bioVisibilityProvider(): array
{
    return [
        'bio present when set' => [true, true],
        'bio omitted when null' => [false, false],
    ];
}
```

---

## Exceptions

No common exceptions. Every conditional must have both-path coverage.

---

## Consequences Of Violation

Reliability risks from untested field omission; client crashes when expected fields are missing; regression bugs when condition logic is changed.

---

## Rule: Limit mergeWhen Nesting to One Level

---

## Category

Maintainability

---

## Rule

Do not nest `mergeWhen()` calls inside other `mergeWhen()` calls. Use at most one level of `mergeWhen()` and avoid combining it with inline `when()` inside the merged array when those conditionals overlap.

---

## Reason

Multiple levels of `mergeWhen()` with overlapping conditions produce unpredictable field sets that are impossible to reason about. The resulting response schema becomes non-deterministic from the caller's perspective and untestable in practice.

---

## Bad Example

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        $this->mergeWhen($isAdmin, [
            'role' => $this->role,
            $this->mergeWhen($isSuperAdmin, [  // Nested mergeWhen
                'permissions' => $this->permissions,
                'secret_key' => $this->when($canViewKey, $this->secret_key),
            ]),
        ]),
    ];
}
```

---

## Good Example

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        $this->mergeWhen($isAdmin, [
            'role' => $this->role,
            'permissions' => $this->permissions,
            'secret_key' => $this->when($canViewKey, $this->secret_key),
        ]),
    ];
}
```

---

## Exceptions

No common exceptions. Exceeding one level of `mergeWhen()` should always be refactored into separate resources.

---

## Consequences Of Violation

Maintainability risks from untraceable field logic; testing combinatorial explosion (2^n paths); client confusion from unpredictable response shapes.

---

## Rule: Never Reference Sensitive Model Attributes in when()

---

## Category

Security

---

## Rule

Do not pass sensitive model attribute names (e.g., `'password'`, `'remember_token'`, `'secret'`) to `whenHas()`, `when()`, or any conditional method in a resource.

---

## Reason

Even when the field is conditionally omitted, referencing the attribute name in the resource code reveals its existence. A malicious client can infer model structure by observing which conditions produce which fields. Additionally, `whenHas('password')` checks if the password attribute exists, which leaks model schema information.

---

## Bad Example

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'email' => $this->email,
        'has_password' => $this->whenHas('password'),  // Leaks schema detail
    ];
}
```

---

## Good Example

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'email' => $this->email,
        'account_secured' => $this->when(
            $this->email_verified_at !== null,          // Reveals no schema internals
            true
        ),
    ];
}
```

---

## Exceptions

No common exceptions. Sensitive model attributes must be protected at the database query level (excluded from selects) and never referenced in any resource.

---

## Consequences Of Violation

Security risks from schema leakage; increased attack surface for model structure inference; compliance violations when sensitive field existence is revealed.

---

## Rule: Do Not Use Conditionals for API Version Branching

---

## Category

Architecture

---

## Rule

Never use `when($request->version === 'v1', ...)` or similar version checks inside resource conditionals. Use separate versioned resource classes instead.

---

## Reason

Version branching inside a single resource creates a monolithic class that serves multiple API contracts simultaneously. The resource becomes untestable (each conditional multiplies the test matrix by the number of versions), hard to reason about, and impossible to freeze for old versions.

---

## Bad Example

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        $this->when($request->version === 'v2', [
            'phone' => $this->phone,
        ]),
        $this->when($request->version === 'v1', [
            'old_field' => $this->legacy_value,
        ]),
    ];
}
```

---

## Good Example

```php
// V1/UserResource.php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'old_field' => $this->legacy_value,
    ];
}

// V2/UserResource.php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'phone' => $this->phone,
    ];
}
```

---

## Exceptions

Temporary migration shims during a transition period (max 1 release cycle) where a conditional version check is used until the old resource is fully deprecated.

---

## Consequences Of Violation

Maintainability risks from monolithic version logic; scalability risks as the number of versions grows; testing explosion with version × conditional combinations.

---

## Rule: Pair Conditional Visibility with Authorization Policies

---

## Category

Architecture

---

## Rule

When a conditional field depends on user permissions or roles, ensure the corresponding controller route or action is protected by an authorization policy or middleware that prevents unauthorized access at the endpoint level.

---

## Reason

Conditional omission in the resource only hides the field from the JSON body — it does not prevent the endpoint from responding, does not prevent data from being loaded, and leaks the existence of the hidden data. The authorization layer must reject unauthorized requests before the resource is constructed.

---

## Bad Example

```php
// No policy or middleware on the controller
public function show(User $user): UserResource
{
    return new UserResource($user);
}

// Resource conditionally hides secret_key
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'secret_key' => $this->when($request->user()?->isAdmin(), $this->secret_key),
    ];
}
```

---

## Good Example

```php
// Controller has authorization
public function show(User $user): UserResource
{
    $this->authorize('view', $user);
    return new UserResource($user);
}

// Resource uses conditional for formatting consistency, not security
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'secret_key' => $this->when($request->user()?->isAdmin(), $this->secret_key),
    ];
}
```

---

## Exceptions

Non-sensitive fields (bio, middle name, optional profile data) where omission is a convenience feature, not a security boundary.

---

## Consequences Of Violation

Security risks from unauthorized data access; data breach liability; regulatory violations for insufficient access control.

---

## Rule: Always Use Explicit Arrays in mergeWhen

---

## Category

Design

---

## Rule

Always pass an explicit, inline array to `mergeWhen()`. Never pass a variable containing an array or a value returned from another method.

---

## Reason

`mergeWhen()` with a dynamic or computed array makes it impossible to determine at a glance which fields appear under which conditions. An explicit inline array keeps the conditional field contract visible and verifiable in the resource class itself.

---

## Bad Example

```php
public function toArray($request): array
{
    $extraFields = $this->getAdminFields();
    return [
        'id' => $this->id,
        $this->mergeWhen($request->user()?->isAdmin(), $extraFields),
    ];
}

private function getAdminFields(): array
{
    // Hidden fields — reader must jump to another method to understand the contract
    return ['role' => $this->role, 'permissions' => $this->permissions];
}
```

---

## Good Example

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        $this->mergeWhen($request->user()?->isAdmin(), [
            'role' => $this->role,
            'permissions' => $this->permissions,
        ]),
    ];
}
```

---

## Exceptions

When the merged array is constructed from a reusable configuration (e.g., a trait providing shared admin fields across multiple resources).

---

## Consequences Of Violation

Maintainability risks from hidden field contracts; reduced readability; testing gaps from undiscoverable conditional paths.
