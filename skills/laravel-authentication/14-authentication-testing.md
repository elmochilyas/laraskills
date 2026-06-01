# Authentication Testing

## Objective

Define comprehensive authentication and authorization testing standards for Laravel applications, covering feature testing, policy testing, security testing, penetration testing considerations, and tenant isolation testing.

## Core Philosophy

Authentication and authorization are the most critical security boundaries. They must be tested exhaustively. Every auth-related code path must have automated tests. Security tests must verify both positive (allowed) and negative (denied) scenarios.

## Architecture Standards

### Test Pyramid for Auth

```
         ┌─────────────┐
         │  E2E/Pen    │  — Manual pentesting, browser tests
        ┌┴─────────────┴┐
       ┌┴───────────────┴┐
       │  Integration    │  — Multi-step auth flows, token chains
      ┌┴─────────────────┴┐
     ┌┴───────────────────┴┐
     │  Feature            │  — HTTP endpoint tests, policy tests
    ┌┴─────────────────────┴┐
   ┌┴───────────────────────┴┐
   │  Unit                   │  — Token validation, hash checking, policy logic
   └─────────────────────────┘
```

## Feature Testing

### Authentication Tests

```php
// tests/Feature/Auth/AuthenticationTest.php
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Login', function () {
    beforeEach(function () {
        $this->user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => Hash::make('Secret123!'),
        ]);
    });

    test('user can login with valid credentials', function () {
        $response = $this->postJson('/api/login', [
            'email' => 'john@example.com',
            'password' => 'Secret123!',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user']);
    });

    test('user cannot login with invalid password', function () {
        $response = $this->postJson('/api/login', [
            'email' => 'john@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrorFor('email');
    });

    test('user cannot login with non-existent email', function () {
        $response = $this->postJson('/api/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrorFor('email');
    });

    test('login is rate limited', function () {
        foreach (range(1, 6) as $i) {
            $response = $this->postJson('/api/login', [
                'email' => 'john@example.com',
                'password' => 'wrong-password',
            ]);
        }

        $response->assertStatus(429);
    });

    test('locked out user cannot login', function () {
        $this->user->update(['locked_until' => now()->addMinutes(15)]);

        $response = $this->postJson('/api/login', [
            'email' => 'john@example.com',
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(423);
    });

    test('session is regenerated after login', function () {
        $originalSessionId = session()->getId();

        $this->post('/login', [
            'email' => 'john@example.com',
            'password' => 'Secret123!',
        ]);

        expect(session()->getId())->not->toBe($originalSessionId);
    });
});

describe('Registration', function () {
    test('user can register with valid data', function () {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['token', 'user']);
        $this->assertDatabaseHas('users', ['email' => 'john@example.com']);
    });

    test('registration is rate limited', function () {
        foreach (range(1, 4) as $i) {
            $this->postJson('/api/register', [
                'name' => "User $i",
                'email' => "user{$i}@example.com",
                'password' => 'StrongPass123!',
                'password_confirmation' => 'StrongPass123!',
            ]);
        }

        $response = $this->postJson('/api/register', [
            'name' => 'User 5',
            'email' => 'user5@example.com',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
        ]);

        $response->assertStatus(429);
    });
});

describe('Logout', function () {
    test('authenticated user can logout', function () {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/logout');

        $response->assertNoContent();
        expect($user->tokens()->count())->toBe(0);
    });

    test('token is revoked after logout', function () {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/logout');

        $response = $this->withToken($token)->getJson('/api/user');
        $response->assertUnauthorized();
    });
});
```

## Authorization Testing

### Policy Tests

```php
// tests/Feature/Authorization/DocumentPolicyTest.php
describe('DocumentPolicy', function () {
    beforeEach(function () {
        $this->owner = User::factory()->create();
        $this->otherUser = User::factory()->create();
        $this->admin = User::factory()->admin()->create();
        $this->document = Document::factory()->for($this->owner)->create();
    });

    test('owner can view their document', function () {
        expect($this->owner->can('view', $this->document))->toBeTrue();
    });

    test('other user cannot view document', function () {
        expect($this->otherUser->can('view', $this->document))->toBeFalse();
    });

    test('admin can view any document', function () {
        expect($this->admin->can('view', $this->document))->toBeTrue();
    });

    test('owner can update their pending document', function () {
        $document = Document::factory()->for($this->owner)
            ->pending()->create();
        expect($this->owner->can('update', $document))->toBeTrue();
    });

    test('owner cannot update published document', function () {
        $document = Document::factory()->for($this->owner)
            ->published()->create();
        expect($this->owner->can('update', $document))->toBeFalse();
    });

    test('guest cannot create documents', function () {
        expect(Gate::forUser(null)->check('create', Document::class))->toBeFalse();
    });

    test('viewAny returns correct results', function () {
        Document::factory()->count(3)->for($this->owner)->create();
        Document::factory()->count(2)->for($this->otherUser)->create();

        $visibleDocuments = Document::whereIn('id',
            $this->owner->can('viewAny', Document::class)
                ? Document::pluck('id')
                : []
        );

        expect($visibleDocuments->count())->toBeGreaterThanOrEqual(3);
    });
});

// Policy method coverage — every method must be tested
describe('DocumentPolicy — all methods', function () {
    test('viewAny', fn () => /* test */);
    test('view', fn () => /* test */);
    test('create', fn () => /* test */);
    test('update', fn () => /* test */);
    test('delete', fn () => /* test */);
    test('restore', fn () => /* test */);
    test('forceDelete', fn () => /* test */);
});
```

### Gate Tests

```php
// tests/Feature/Authorization/GateTest.php
describe('Application Gates', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
    });

    test('user with permission can export reports', function () {
        $this->user->givePermissionTo('reports:export');
        expect($this->user->can('export-reports'))->toBeTrue();
    });

    test('user without permission cannot export reports', function () {
        expect($this->user->can('export-reports'))->toBeFalse();
    });

    test('admin can always export reports', function () {
        $admin = User::factory()->admin()->create();
        expect($admin->can('export-reports'))->toBeTrue();
    });
});
```

### Controller Authorization Tests

```php
// tests/Feature/Document/DocumentControllerTest.php
describe('Document Controller Authorization', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
        $this->document = Document::factory()->for($this->user)->create();
    });

    test('authenticated user can list documents', function () {
        $response = $this->actingAs($this->user)
            ->getJson('/api/documents');

        $response->assertOk();
    });

    test('unauthenticated user cannot list documents', function () {
        $response = $this->getJson('/api/documents');
        $response->assertUnauthorized();
    });

    test('owner can view their document', function () {
        $response = $this->actingAs($this->user)
            ->getJson("/api/documents/{$this->document->id}");

        $response->assertOk();
    });

    test('other user cannot view document', function () {
        $otherUser = User::factory()->create();

        $response = $this->actingAs($otherUser)
            ->getJson("/api/documents/{$this->document->id}");

        $response->assertForbidden();
    });

    test('admin can view any document', function () {
        $admin = User::factory()->admin()->create();
        $otherDocument = Document::factory()->create();

        $response = $this->actingAs($admin)
            ->getJson("/api/documents/{$otherDocument->id}");

        $response->assertOk();
    });
});
```

## Security Testing

### Rate Limiting Tests

```php
// tests/Feature/Security/RateLimitingTest.php
describe('Rate Limiting', function () {
    test('login endpoint rate limits after 5 attempts', function () {
        foreach (range(1, 5) as $i) {
            $this->postJson('/api/login', [
                'email' => 'test@example.com',
                'password' => 'wrong',
            ]);
        }

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'wrong',
        ]);

        $response->assertStatus(429);
    });

    test('rate limit resets after lockout period', function () {
        // TODO: Implement with cache time travel
        // Use Cache::set('login_attempts:...', 5, now()->subSeconds(1));
    });
});
```

### Credential Stuffing Tests

```php
// tests/Feature/Security/CredentialStuffingTest.php
describe('Credential Stuffing Protection', function () {
    test('consistent response time for valid and invalid emails', function () {
        $validEmail = 'existing@example.com';
        $invalidEmail = 'nonexistent-' . Str::random(10) . '@example.com';
        User::factory()->create(['email' => $validEmail]);

        $startTime = microtime(true);
        $this->postJson('/api/login', [
            'email' => $validEmail,
            'password' => 'wrong',
        ]);
        $validTime = microtime(true) - $startTime;

        $startTime = microtime(true);
        $this->postJson('/api/login', [
            'email' => $invalidEmail,
            'password' => 'wrong',
        ]);
        $invalidTime = microtime(true) - $startTime;

        // Response times should be within 100ms of each other
        expect(abs($validTime - $invalidTime))->toBeLessThan(0.1);
    });
});
```

### Session Security Tests

```php
// tests/Feature/Security/SessionSecurityTest.php
describe('Session Security', function () {
    test('session is regenerated on login', function () {
        $user = User::factory()->create();
        $oldSessionId = session()->getId();

        $this->actingAs($user);

        expect(session()->getId())->not->toBe($oldSessionId);
    });

    test('session is invalidated on logout', function () {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->post('/logout');
        $this->get('/dashboard')->assertRedirect('/login');
    });

    test('session is encrypted', function () {
        $cookieValue = Crypt::decrypt(
            cookie('laravel_session')->getValue(),
            unserialize: false,
        );

        // Session value should not be readable plaintext
        expect($cookieValue)->not->toContain('user_id');
    });
});
```

### CSRF Tests

```php
// tests/Feature/Security/CsrfTest.php
describe('CSRF Protection', function () {
    test('POST request without CSRF token fails', function () {
        $response = $this->post('/api/logout', [], [
            'X-CSRF-TOKEN' => 'invalid-token',
        ]);

        $response->assertStatus(419);
    });

    test('API route with token auth is not CSRF protected', function () {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/logout');

        $response->assertStatus(204); // Not 419
    });
});
```

## Penetration Testing Considerations

### Auth-Specific Pen Test Checklist

- [ ] **User enumeration** — Verify error messages and response times do not reveal user existence
- [ ] **Password brute force** — Verify rate limiting and account lockout function correctly
- [ ] **Credential stuffing** — Verify rate limiting by IP and email hash works
- [ ] **Session fixation** — Verify session ID regeneration on login
- [ ] **Session hijacking** — Verify session binding and HTTPS enforcement
- [ ] **Token theft** — Verify short TTL, rotation, and blacklisting
- [ ] **CSRF** — Verify token validation on all state-changing web routes
- [ ] **JWT attacks** — Verify algorithm whitelist, signature validation
- [ ] **OAuth2 attacks** — Verify PKCE enforcement, redirect URI validation
- [ ] **SAML attacks** — Verify assertion signature, not vulnerable to XML wrapping
- [ ] **Privilege escalation** — Verify authorization checks on every endpoint
- [ ] **IDOR** — Verify user cannot access another user's resources
- [ ] **MFA bypass** — Verify MFA is required for sensitive operations

## Tenant Isolation Testing

```php
// tests/Feature/Tenant/TenantIsolationTest.php
describe('Tenant Isolation', function () {
    beforeEach(function () {
        $this->tenantA = Tenant::factory()->create();
        $this->tenantB = Tenant::factory()->create();
        $this->userA = User::factory()->for($this->tenantA)->create();
        $this->userB = User::factory()->for($this->tenantB)->create();
        $this->documentA = Document::factory()->for($this->tenantA)->for($this->userA)->create();
        $this->documentB = Document::factory()->for($this->tenantB)->for($this->userB)->create();
    });

    test('user cannot access other tenant documents via API', function () {
        $response = $this->actingAs($this->userA)
            ->getJson("/api/documents/{$this->documentB->id}");

        $response->assertForbidden();
    });

    test('user cannot list other tenant documents', function () {
        $response = $this->actingAs($this->userA)
            ->getJson('/api/documents');

        $response->assertOk()
            ->assertJsonCount(1, 'data'); // Only tenant A documents
    });

    test('user cannot access other tenant via IDOR in request', function () {
        $response = $this->actingAs($this->userA)
            ->postJson('/api/documents', [
                'tenant_id' => $this->tenantB->id, // Possible IDOR
                'title' => 'Test',
            ]);

        $response->assertStatus(422); // Or assert document belongs to tenant A
    });

    test('tenant admin cannot access other tenant', function () {
        $adminA = User::factory()
            ->for($this->tenantA)
            ->admin()
            ->create();

        $response = $this->actingAs($adminA)
            ->getJson("/api/documents/{$this->documentB->id}");

        $response->assertForbidden();
    });

    test('global admin can access all tenants', function () {
        $globalAdmin = User::factory()->globalAdmin()->create();

        $responseA = $this->actingAs($globalAdmin)
            ->getJson("/api/documents/{$this->documentA->id}");
        $responseB = $this->actingAs($globalAdmin)
            ->getJson("/api/documents/{$this->documentB->id}");

        $responseA->assertOk();
        $responseB->assertOk();
    });
});
```

## Architecture Tests

```php
// tests/Architect/AuthArchitectureTest.php
describe('Authentication Architecture', function () {
    test('all controllers use FormRequest for validation')
        ->arch()
        ->expect('App\Http\Controllers')
        ->not->toUse(['request()->all', 'request()->input', '$request->all', '$request->input']);

    test('all state-changing actions have authorization')
        ->arch()
        ->expect('App\Http\Controllers')
        ->toHaveMethods(['authorize']);

    test('policies have all required methods')
        ->arch()
        ->expect('App\Policies')
        ->toHaveMethods(['viewAny', 'view', 'create', 'update', 'delete']);

    test('policies do not use AllowAll')
        ->arch()
        ->expect('App\Policies')
        ->not->toUse(['return true', 'return false']); // Must have conditional logic

    test('password hashing is never disabled')
        ->arch()
        ->expect('App')
        ->not->toUse(['Hash::setRounds(4)']); // Never weaken hashing in tests

    test('no debug endpoints in production')
        ->arch()
        ->expect('routes')
        ->each->not->toHaveMethods(['tinker', 'clockwork']);
});
```

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Testing only positive scenarios | Missing denied-access tests | Test both `can` and `cannot` |
| No rate limit tests | Rate limiting breaks silently | Test 429 responses |
| No tenant isolation tests | Data leak across tenants | Test cross-tenant access is denied |
| Testing auth in unit, not feature | Missing HTTP layer validation | Feature tests for endpoints, unit for logic |
| No brute force tests | Lockout not tested | Test lockout after N attempts |
| Forgetting password reset tests | Reset flow security gaps | Test token expiry, single-use, CSRF |
| No CSRF tests for web routes | CSRF protection regression | Test 419 on missing token |
| Hardcoded credentials in tests | Credential leak in test output | Use factory states, never real credentials |

## AI Coding Agent Rules

1. Every Policy method must have both `can` and `cannot` test cases
2. Every auth endpoint must have positive (200) and negative (401/403) test cases
3. Rate limiting must be tested with exact attempt counts
4. Tenant isolation must be tested with cross-tenant access attempts
5. Token lifecycle (create, validate, refresh, revoke, expire) must be tested end-to-end
6. Session regeneration must be verified on login, logout, and privilege escalation
7. MFA flows must be tested with both valid and invalid codes
8. Architecture tests must enforce auth patterns (Pest arch tests)
9. Penetration test scenarios must be documented and run pre-release
10. Test factories must not create admin users by default (least privilege in tests)

## Production Checklist

- [ ] All Policy methods tested (positive + negative)
- [ ] All auth endpoint status codes tested (200, 401, 403, 422, 429)
- [ ] Rate limiting tests for login, registration, password reset
- [ ] Token lifecycle tests (create → use → refresh → revoke → expire)
- [ ] Session management tests (regeneration, invalidation, binding)
- [ ] Tenant isolation tests (cross-tenant access attempts)
- [ ] MFA tests (TOTP/WebAuthn enable, verify, recovery codes)
- [ ] Security tests (CSRF, brute force, credential stuffing timing)
- [ ] Architecture tests enforce auth patterns
- [ ] Penetration test scenarios documented
- [ ] Test coverage for auth ≥ 90%
