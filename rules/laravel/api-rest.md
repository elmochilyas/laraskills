---
paths:
  - "**/*.php"
  - "**/routes/api.php"
---

# Laravel 13 REST API Rules

> Enforced REST API standards. Violations require refactoring before merge.

## Resource Naming

```php
// CORRECT
Route::get('/users', ...);
Route::post('/users', ...);
Route::get('/users/{user}/orders', ...);

// FORBIDDEN — actions in URLs
Route::post('/getUsers', ...);
Route::post('/createUser', ...);
Route::get('/user', ...);
```

## Model Exposure

```php
// FORBIDDEN — exposing models directly
return User::all();
return $user;
return response()->json($users);

// REQUIRED
return UserResource::collection(User::paginate());
return new UserResource($user);
```

## Status Codes

```php
// REQUIRED mapping
GET    → 200
POST   → 201
PATCH  → 200
DELETE → 204
Validation → 422
Auth   → 401
Forbidden → 403
Not found → 404

// FORBIDDEN
return response()->json(['error' => '...'], 200); // Use proper code
```

## Versioning

```php
// REQUIRED
Route::prefix('v1')->group(function () { ... });

// FORBIDDEN — versionless or query-string versioning
/api/users?version=2
```

## Pagination

```php
// Cursor pagination preferred for large datasets
User::orderBy('id')->cursorPaginate($perPage);

// Max page size: 100
abs($request->integer('per_page', 20)) > 100 ? 100 : ...
```

## No Business Logic in Controllers

```php
// FORBIDDEN
public function store(Request $request) {
    // business logic, DB queries, email sending
}

// REQUIRED
public function store(StoreUserRequest $request, CreateUserAction $action) {
    return new UserResource($action->execute($request->toDto()));
}
```

## See Also

- Skill: `laravel-api-rest`
- Skill: `laravel-api-jsonapi`
- Rule: `rules/laravel/architecture.md`
