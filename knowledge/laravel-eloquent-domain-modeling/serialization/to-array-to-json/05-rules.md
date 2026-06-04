# ToArray / ToJson — Rules

## Rule 1: Never Override `toArray()` for HTTP API Responses — Use API Resources Instead
---
## Category
Architecture
---
## Rule
Do not override `toArray()` on Eloquent models for HTTP API serialization. Create an API Resource class instead.
---
## Reason
Model `toArray()` overrides bypass API Resource features (conditional attributes, pagination, wrapping, request-aware output) and couple the model to HTTP presentation concerns.
---
## Bad Example
```php
class User extends Model
{
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'full_name' => "{$this->first_name} {$this->last_name}",
        ];
    }
}
```
---
## Good Example
```php
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => "{$this->first_name} {$this->last_name}",
            'posts' => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}
```
---
## Exceptions
Non-HTTP serialization channels (queue payloads, broadcast events, CLI output) where Resources are inappropriate and model-level control is needed.
---
## Consequences Of Violation
Missing API Resource features; model–presentation coupling; inability to version response shapes independently of models.

---

## Rule 2: Override `toArray()` on a Base Model Only for Non-HTTP Serialization Conventions
---
## Category
Architecture
---
## Rule
If overriding `toArray()` on a model, do it on a base model class for application-wide serialization conventions (date format, key casing) for non-HTTP channels only.
---
## Reason
Per-model `toArray()` overrides are invisible and create surprises — a developer adding a field to a model expects it to appear in serialization, but a custom override may exclude it.
---
## Bad Example
```php
class User extends Model
{
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'created' => $this->created_at->toIso8601String(),
        ];
        // Forgot 'email' — it's silently missing from all serialization
    }
}
```
---
## Good Example
```php
abstract class BaseModel extends Model
{
    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d\TH:i:s\Z');
    }
}

class User extends BaseModel { }
// Default toArray includes all attributes with consistent dates
```
---
## Exceptions
Models that require a fundamentally different shape for non-HTTP channels (e.g., a simplified payload for queue jobs).
---
## Consequences Of Violation
Silent missing attributes in serialization output; developer confusion; unexpected behavior when new columns are added.

---

## Rule 3: Always Call `parent::toArray()` When Overriding, or Handle Relations Explicitly
---
## Category
Reliability
---
## Rule
When overriding `toArray()`, either call `parent::toArray()` to include the standard attribute + relation serialization, or explicitly handle all loaded relationships in the override.
---
## Reason
Custom `toArray()` overrides that omit the parent call skip recursive relationship serialization entirely, silently dropping all loaded relations from the output.
---
## Bad Example
```php
public function toArray(): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        // All loaded relations silently excluded
    ];
}
```
---
## Good Example
```php
public function toArray(): array
{
    return array_merge(parent::toArray(), [
        'formatted_name' => strtoupper($this->name),
    ]);
}

// Or handle relations explicitly
public function toArray(): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'posts' => $this->posts->toArray(),
        'profile' => $this->profile?->toArray(),
    ];
}
```
---
## Exceptions
Models where the explicit intent is to strip all relationships from serialization output.
---
## Consequences Of Violation
Relationship data silently disappearing from serialization; difficult debugging when loaded relations are expected but absent.

---

## Rule 4: Never Perform SQL Queries or Heavy Computation Inside `toArray()`
---
## Category
Performance
---
## Rule
Keep `toArray()` free of database queries, external API calls, or expensive computations. All data must be pre-loaded or pre-computed before serialization.
---
## Reason
`toArray()` is called during serialization, often in a loop over collections. Any query inside multiplies by the number of items, causing N+1 explosions that are invisible during development.
---
## Bad Example
```php
public function toArray(): array
{
    return [
        'id' => $this->id,
        'comment_count' => $this->comments()->count(), // N+1 query
        'score' => $this->computeExpensiveScore(),     // Heavy per-item
    ];
}
```
---
## Good Example
```php
// Pre-load before serialization
$users = User::withCount('comments')->get();
// toArray just reads pre-computed values
public function toArray(): array
{
    return [
        'id' => $this->id,
        'comment_count' => $this->comments_count,
    ];
}
```
---
## Exceptions
No common exceptions. Serialization must be a pure transformation of already-loaded data.
---
## Consequences Of Violation
N+1 query explosion on listing endpoints; API response times scaling linearly with dataset size; database load spikes.

---

## Rule 5: Use `JSON_THROW_ON_ERROR` in Critical `toJson()` Paths
---
## Category
Reliability
---
## Rule
Pass `JSON_THROW_ON_ERROR` flag when calling `toJson()` in critical code paths (queue payloads, webhooks, external API calls) to ensure encoding failures are surfaced as exceptions.
---
## Reason
`json_encode` silently returns `false` on failure, which serializes to `null`. This can corrupt data in queues, webhooks, or storage without any error signal.
---
## Bad Example
```php
// Queue job dispatches with corrupt payload silently
dispatch(new ProcessReport($model->toJson()));
// If encoding fails, $model->toJson() returns 'null' with no error
```
---
## Good Example
```php
try {
    $json = $model->toJson(JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    dispatch(new ProcessReport($json));
} catch (\JsonException $e) {
    Log::error('Failed to serialize model', [
        'model' => get_class($model),
        'id' => $model->id,
        'error' => $e->getMessage(),
    ]);
    throw $e;
}
```
---
## Exceptions
Non-critical display contexts where a null fallback is acceptable (e.g., optional debug output).
---
## Consequences Of Violation
Corrupted queue payloads silently entering the pipeline; data loss in external integrations; hours of debugging null values with no error trace.

---

## Rule 6: Set a Consistent Date Format via `serializeDate()` on a Base Model
---
## Category
Maintainability
---
## Rule
Override `serializeDate()` on a base model class to enforce a consistent date format across all model serialization, avoiding per-model date format inconsistencies.
---
## Reason
Without a centralized date format, each model uses the default `Y-m-d H:i:s` format, which differs from ISO 8601 that most API consumers expect. Per-model overrides create drift.
---
## Bad Example
```php
class User extends Model { /* default: 2024-01-15 10:30:00 */ }
class Post extends Model { /* default: 2024-01-15 10:30:00 */ }
// Both use MySQL-ish format, not ISO 8601
```
---
## Good Example
```php
abstract class BaseModel extends Model
{
    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d\TH:i:s\Z');
    }
}

class User extends BaseModel { /* 2024-01-15T10:30:00Z */ }
class Post extends BaseModel { /* 2024-01-15T10:30:00Z */ }
```
---
## Exceptions
Models that intentionally expose a different date format for specific integration requirements (document the exception).
---
## Consequences Of Violation
Inconsistent date formats across API responses; frontend parsing errors; ISO 8601 vs MySQL format confusion.

---

## Rule 7: Never Log Raw `$model->toArray()` Without Filtering Sensitive Data
---
## Category
Security
---
## Rule
Always filter or explicitly select fields before logging model serialization output. Never log `$model->toArray()` directly.
---
## Reason
`toArray()` includes all model attributes, including `password`, `api_token`, PII, and other sensitive fields listed in `$hidden` — but `$hidden` only affects serialization, and logging may use a different code path.
---
## Bad Example
```php
Log::info('User created', $user->toArray());
// Log includes password, remember_token, api_token — visible in log files
```
---
## Good Example
```php
Log::info('User created', [
    'id' => $user->id,
    'email' => $user->email,
    'created_at' => $user->created_at,
]);
// Or use a safe DTO
Log::info('User created', UserAuditDTO::fromModel($user)->toArray());
```
---
## Exceptions
Development-only debug logging where the environment is trusted and logs are never persisted.
---
## Consequences Of Violation
Credential and PII leakage in log files; compliance violations (GDPR, PCI, HIPAA); security audit failures.

---

## Rule 8: Pre-Load All Relations Before Calling `toArray()` on Collections
---
## Category
Performance
---
## Rule
Eager-load all relationships that should appear in serialization output before calling `toArray()` on a model collection. Never rely on lazy loading during array conversion.
---
## Reason
`toArray()` recursively serializes all loaded relations. Any unloaded relation triggers lazy loading per model per relation, producing N+1 queries inside the serialization loop.
---
## Bad Example
```php
$users = User::all(); // No relations loaded
return $users->toArray();
// Each user triggers queries for posts, profile, roles — N+1x3
```
---
## Good Example
```php
$users = User::with('posts', 'profile', 'roles')->get();
return $users->toArray();
// All relations pre-loaded — serialization is in-memory only
```
---
## Exceptions
Relationships accessed via `whenLoaded()` in an API Resource where the relation is intentionally optional.
---
## Consequences Of Violation
N+1 query explosion on every listing endpoint; database load that scales with page size; response times degrading proportionally.

---

## Rule 9: Use `toJson(JSON_UNESCAPED_UNICODE)` for Internationalized Content
---
## Category
Reliability
---
## Rule
Pass `JSON_UNESCAPED_UNICODE` to `toJson()` when the model contains non-ASCII text (accented characters, CJK, Arabic, emoji) to preserve human-readable output.
---
## Reason
Without `JSON_UNESCAPED_UNICODE`, `json_encode` escapes multibyte characters to `\uXXXX` sequences, producing larger, non-human-readable payloads that some consumers may not decode correctly.
---
## Bad Example
```php
$model->toJson();
// "café" becomes "caf\u00e9" — larger payload, harder to read
```
---
## Good Example
```php
$model->toJson(JSON_UNESCAPED_UNICODE);
// "café" stays "café" — readable, smaller payload
```
---
## Exceptions
Systems where ASCII-only output is a requirement (legacy integrations, strict protocol constraints).
---
## Consequences Of Violation
Inflated payload sizes (especially for CJK text); consumer-side decoding issues; developer difficulty debugging internationalized content.

---

## Rule 10: Audit Custom `jsonSerialize()` Overrides for Deviations from `toArray()`
---
## Category
Maintainability
---
## Rule
When overriding `jsonSerialize()`, document why it must differ from `toArray()` and add tests that verify both methods produce correct output.
---
## Reason
`jsonSerialize()` and `toArray()` serving different shapes is confusing and error-prone. Developers expect them to produce the same output. Any difference must be intentional and tested.
---
## Bad Example
```php
public function jsonSerialize(): array
{
    return array_merge($this->toArray(), ['extra' => 'value']);
    // No documentation, no tests — why is this different?
}
```
---
## Good Example
```php
// jsonSerialize adds "type" discriminator for polymorphic queue routing
// See ADR-004: Queue Payload Discriminator
public function jsonSerialize(): array
{
    return array_merge($this->toArray(), ['type' => 'user']);
}

// Test
public function test_json_serialize_includes_type(): void
{
    $json = $this->user->jsonSerialize();
    $this->assertSame('user', $json['type']);
}
```
---
## Exceptions
No common exceptions. Deviations must always be documented and tested.
---
## Consequences Of Violation
Confusing output differences between `json_encode($model)` and `$model->toArray()`; untested behavior leading to production surprises.
