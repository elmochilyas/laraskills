# Laravel 13 JSON:API — First-Party Resources

## When to Use

Use this skill when building APIs that need strict JSON:API specification compliance. Laravel 13 ships with a native `JsonApiResource` class that produces spec-compliant responses without external packages. Covers resource definition, attributes, relationships, sparse fieldsets, includes, compound documents, links, meta objects, error handling, and pagination. Preferred for large public APIs, enterprise integrations, and mobile backends.

---

## Laravel 13 Native JSON:API Resources

### Generating a JSON:API Resource

```bash
php artisan make:resource PostResource --json-api
```

This generates a class extending `Illuminate\Http\Resources\JsonApi\JsonApiResource` with `$attributes` and `$relationships` properties.

### Basic Resource Structure

```php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class PostResource extends JsonApiResource
{
    public $attributes = [
        'title',
        'content',
        'status',
    ];

    public $relationships = [
        'author' => AuthorResource::class,
    ];
}
```

This produces:

```json
{
    "data": {
        "type": "posts",
        "id": "1",
        "attributes": {
            "title": "Hello World",
            "content": "Post content here",
            "status": "published"
        },
        "relationships": {
            "author": {
                "data": {
                    "type": "authors",
                    "id": "5"
                }
            }
        },
        "links": {
            "self": "/api/v1/posts/1"
        }
    }
}
```

---

## Defining Attributes

### Simple Attribute List

```php
class UserResource extends JsonApiResource
{
    // Simple array — auto-resolves from model attributes
    public $attributes = [
        'name',
        'email',
        'role',
    ];
}
```

### Closure-Wrapped Attributes (Dynamic Values)

```php
class UserResource extends JsonApiResource
{
    public $attributes = [
        'name',
        'email',
        'is_admin' => fn () => $this->is_admin,
        'created_at' => fn () => $this->created_at->toIso8601String(),
        'avatar_url' => fn () => $this->avatar_url,
    ];
}
```

Closures are lazily evaluated — they only execute if the attribute is requested, making them ideal for expensive computations combined with sparse fieldsets.

### Minimal Attributes (for high-performance endpoints)

```php
class UserResource extends JsonApiResource
{
    // Only expose minimal fields
    public $attributes = [
        'name',
        'email',
    ];
}
```

### Sparse Fieldsets

Let clients request only the fields they need:

```php
// HTTP Request:
// GET /api/v1/users?fields[users]=id,name,email

// The resource automatically filters to only requested fields
// No extra code needed — JsonApiResource handles sparse fieldsets natively

class UserResource extends JsonApiResource
{
    public $attributes = [
        'name',
        'email',
        'role',
        'is_admin',
        'created_at',
        'updated_at',
    ];
}

// Response when ?fields[users]=name,email:
{
    "data": {
        "type": "users",
        "id": "1",
        "attributes": {
            "name": "John Doe",
            "email": "john@example.com"
        }
    }
}
```

### Sparse Fieldsets with Expensive Closures

```php
class PostResource extends JsonApiResource
{
    public $attributes = [
        'title',
        'content',
        'excerpt' => fn () => Str::limit($this->content, 200),
        'reading_time' => fn () => $this->calculateReadingTime(), // expensive
        'word_count' => fn () => str_word_count($this->content),
    ];
}

// Client requests: ?fields[posts]=title,excerpt
// Only `title` and `excerpt` execute — `reading_time` and `word_count` are skipped
```

### Benefits of Sparse Fieldsets

- Smaller payloads (bandwidth savings)
- Faster responses (less serialization)
- Reduced server load (expensive closures skipped)
- Client-controlled granularity

---

## Relationships

### Defining Relationships

```php
class PostResource extends JsonApiResource
{
    public $attributes = [
        'title',
        'content',
    ];

    public $relationships = [
        'author' => AuthorResource::class,
        'comments' => CommentResource::class,
        'tags' => TagResource::class,
    ];
}
```

### Relationship with Custom Resource

```php
use App\Http\Resources\AuthorResource;

class PostResource extends JsonApiResource
{
    public $relationships = [
        'author' => AuthorResource::class,
        'category' => CategoryResource::class,
    ];
}
```

### Relationship Output

```json
{
    "data": {
        "type": "posts",
        "id": "1",
        "attributes": { ... },
        "relationships": {
            "author": {
                "data": {
                    "type": "authors",
                    "id": "5"
                },
                "links": {
                    "self": "/api/v1/posts/1/relationships/author",
                    "related": "/api/v1/authors/5"
                }
            }
        }
    }
}
```

### Eager Loading in Controllers

Always eager-load relationships in the controller, never in the resource:

```php
use Illuminate\Http\Request;
use Illuminate\Http\Resources\JsonApi\JsonApiResourceCollection;

class PostController extends Controller
{
    public function show(string $id): PostResource
    {
        $post = Post::with(['author', 'comments', 'tags'])->findOrFail($id);

        return PostResource::make($post);
    }

    public function index(Request $request): JsonApiResourceCollection
    {
        $posts = Post::with(['author'])
            ->paginate();

        return PostResource::collection($posts);
    }
}
```

---

## Compound Documents (Includes)

### How Includes Work

```php
// HTTP Request:
// GET /api/v1/posts?include=author,comments

class PostController extends Controller
{
    public function index(Request $request): JsonApiResourceCollection
    {
        // Parse allowed includes from query
        $includes = $this->parseAllowedIncludes($request, ['author', 'comments', 'tags']);

        $posts = Post::with($includes)->paginate();

        return PostResource::collection($posts);
    }

    private function parseAllowedIncludes(Request $request, array $allowed): array
    {
        $requested = explode(',', $request->string('include', ''));

        return array_intersect($requested, $allowed);
    }
}
```

### Whitelisting Allowed Includes

```php
class PostController extends Controller
{
    // Whitelist explicitly — never trust client include values
    private array $allowedIncludes = [
        'author',
        'author.profile',
        'comments',
        'comments.author',
        'tags',
    ];

    public function index(Request $request): JsonApiResourceCollection
    {
        $includes = $this->resolveIncludes($request);

        $posts = Post::with($includes)->paginate();

        return PostResource::collection($posts);
    }

    private function resolveIncludes(Request $request): array
    {
        $raw = explode(',', $request->string('include', ''));
        $resolved = [];

        foreach ($raw as $include) {
            $include = trim($include);
            if (in_array($include, $this->allowedIncludes, true)) {
                $resolved[] = $include;
            }
        }

        return $resolved;
    }
}
```

### Deep Nested Includes

```php
// HTTP Request:
// GET /api/v1/posts?include=author.comments,comments.author

// Whitelist deep paths explicitly
private array $allowedIncludes = [
    'author',
    'author.comments',      // Two levels deep
    'comments',
    'comments.author',      // Two levels deep
    'comments.author.profile', // Three levels deep
];
```

### Max Relationship Depth Protection

```php
class PostController extends Controller
{
    private int $maxDepth = 2;

    private function resolveIncludes(Request $request): array
    {
        $raw = explode(',', $request->string('include', ''));
        $resolved = [];

        foreach ($raw as $include) {
            $include = trim($include);
            $depth = substr_count($include, '.');

            if ($depth <= $this->maxDepth && in_array($include, $this->allowedIncludes, true)) {
                $resolved[] = $include;
            }
        }

        return $resolved;
    }
}
```

### Compound Document Response

```json
{
    "data": {
        "type": "posts",
        "id": "1",
        "attributes": { ... },
        "relationships": {
            "author": {
                "data": { "type": "authors", "id": "5" }
            }
        }
    },
    "included": [
        {
            "type": "authors",
            "id": "5",
            "attributes": {
                "name": "John Doe",
                "email": "john@example.com"
            }
        }
    ]
}
```

---

## Links

### Self Links (Automatic)

```php
class PostResource extends JsonApiResource
{
    // Self link is generated automatically from the request URL
    // Default: /api/v1/posts/{id}

    // Customize the self link
    public function getSelfLink(): string
    {
        return route('api.v1.posts.show', $this->id);
    }
}
```

### Relationship Links

```php
class PostResource extends JsonApiResource
{
    public $relationships = [
        'author' => AuthorResource::class,
    ];

    // Relationship links are generated automatically:
    // "self": "/api/v1/posts/1/relationships/author"
    // "related": "/api/v1/authors/5"
}
```

### Top-Level Links

```php
class PostCollection extends JsonApiResourceCollection
{
    public function with($request): array
    {
        return [
            'links' => [
                'self' => route('api.v1.posts.index'),
                'create' => route('api.v1.posts.store'),
            ],
        ];
    }
}
```

---

## Meta Objects

### Resource-Level Meta

```php
class PostResource extends JsonApiResource
{
    public function with($request): array
    {
        return [
            'meta' => [
                'author_count' => $this->author->posts_count ?? 0,
            ],
        ];
    }
}
```

### Collection-Level Meta

```php
class PostCollection extends JsonApiResourceCollection
{
    public function with($request): array
    {
        return [
            'meta' => [
                'total' => $this->total(),
                'filtered' => $this->filteredCount(),
            ],
        ];
    }
}

// Never place metadata inside `attributes`
// CORRECT:
{
    "data": { "type": "posts", "id": "1", "attributes": { "title": "Hello" } },
    "meta": { "total_posts": 42 }
}

// FORBIDDEN:
{
    "data": { "type": "posts", "id": "1", "attributes": { "title": "Hello", "total_posts": 42 } }
}
```

---

## Pagination for JSON:API

### Length-Aware JSON:API Pagination

```php
class PostController extends Controller
{
    public function index(Request $request): JsonApiResourceCollection
    {
        $posts = Post::with(['author'])->paginate(
            perPage: $request->integer('per_page', 20),
            page: $request->integer('page', 1),
        );

        return PostResource::collection($posts);
    }
}

// Response:
{
    "data": [...],
    "meta": {
        "total": 100,
        "per_page": 20,
        "current_page": 1,
        "last_page": 5
    },
    "links": {
        "first": "/api/v1/posts?page=1",
        "last": "/api/v1/posts?page=5",
        "prev": null,
        "next": "/api/v1/posts?page=2"
    }
}
```

### Cursor Pagination for JSON:API

```php
class PostController extends Controller
{
    public function index(Request $request): JsonApiResourceCollection
    {
        $posts = Post::with(['author'])
            ->orderBy('id')
            ->cursorPaginate(
                perPage: $request->integer('per_page', 20),
                cursor: $request->string('cursor'),
            );

        return PostResource::collection($posts);
    }
}
```

---

## Error Handling

### JSON:API Error Objects

```php
// bootstrap/app.php — Laravel 11+ exception handling
use Illuminate\Validation\ValidationException;

->withExceptions(function (\Illuminate\Foundation\Configuration\Exceptions $exceptions) {
    $exceptions->render(function (ValidationException $e) {
        $errors = [];

        foreach ($e->errors() as $field => $messages) {
            foreach ($messages as $message) {
                $errors[] = [
                    'status' => '422',
                    'code' => 'VALIDATION_ERROR',
                    'title' => 'Validation Failed',
                    'detail' => $message,
                    'source' => ['pointer' => "/data/attributes/{$field}"],
                ];
            }
        }

        return response()->json(['errors' => $errors], 422);
    });
});
```

### Manual Error Response

```php
return response()->json([
    'errors' => [
        [
            'status' => '404',
            'code' => 'NOT_FOUND',
            'title' => 'Resource Not Found',
            'detail' => 'The requested post does not exist.',
        ],
    ],
], 404);
```

---

## Testing JSON:API Resources

```php
test('post resource returns valid json api structure', function () {
    $post = Post::factory()->create();

    $response = $this->getJson("/api/v1/posts/{$post->id}");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                'type',
                'id',
                'attributes' => ['title', 'content'],
                'relationships',
                'links',
            ],
        ])
        ->assertJsonPath('data.type', 'posts')
        ->assertJsonPath('data.id', (string) $post->id);
});

test('sparse fieldsets filter attributes', function () {
    $post = Post::factory()->create();

    $response = $this->getJson('/api/v1/posts?fields[posts]=title');

    $response->assertJsonStructure([
        'data' => [
            'attributes' => ['title'],
        ],
    ]);

    $response->assertJsonMissingPath('data.attributes.content');
});

test('includes load related resources', function () {
    $post = Post::factory()
        ->has(Comment::factory()->count(3))
        ->create();

    $response = $this->getJson('/api/v1/posts?include=comments');

    $response->assertJsonStructure([
        'included' => [
            '*' => ['type', 'id', 'attributes'],
        ],
    ]);
});

test('rejects invalid includes', function () {
    $post = Post::factory()->create();

    $response = $this->getJson('/api/v1/posts?include=malicious,nonexistent');

    $response->assertStatus(200);
    $response->assertJsonMissingPath('included');
});

test('paginates json api collection', function () {
    Post::factory()->count(25)->create();

    $response = $this->getJson('/api/v1/posts?per_page=10');

    $response->assertStatus(200)
        ->assertJsonCount(10, 'data')
        ->assertJsonStructure([
            'meta' => ['total', 'per_page', 'current_page'],
            'links' => ['first', 'last', 'prev', 'next'],
        ])
        ->assertJsonPath('meta.per_page', 10)
        ->assertJsonPath('meta.total', 25);
});
```

---

## Migration from spatie/laravel-json-api

```php
// Before (spatie):
use Spatie\JsonApi\Resources\JsonApiResource;

class PostResource extends JsonApiResource
{
    public function toAttributes($request): array
    {
        return [
            'title' => $this->title,
            'content' => $this->content,
        ];
    }
}

// After (Laravel 13 native):
use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class PostResource extends JsonApiResource
{
    public $attributes = [
        'title',
        'content',
    ];
}
```

---

## JSON:API Enterprise Checklist

- [ ] All resources use `JsonApiResource` (not `JsonResource`)
- [ ] IDs are strings (JSON:API spec requires string IDs)
- [ ] `Content-Type: application/vnd.api+json` set automatically
- [ ] Sparse fieldsets supported via `?fields[type]=field1,field2`
- [ ] Includes whitelisted and depth-limited
- [ ] Eager loading done in controller, never in resource
- [ ] Relationships defined with proper resource class mapping
- [ ] Self links generated for every resource
- [ ] Meta objects separated from attributes
- [ ] Pagination uses JSON:API `page` parameters
- [ ] Error responses use JSON:API error object format
- [ ] Unknown includes silently ignored (not 400)
- [ ] N+1 queries prevented via eager loading
- [ ] Max page size enforced (100)
- [ ] Tests verify JSON:API structure compliance

---

## References

- See skill: `laravel-api-rest` for REST fundamentals and HATEOAS
- See skill: `laravel-api-graphql` for GraphQL alternatives
- See skill: `laravel-api-grpc` for gRPC alternatives
- See skill: `laravel-api-microservices` for service boundaries
- See official: [JSON:API Specification](https://jsonapi.org/format/)
- See official: [Laravel 13 JsonApiResource Docs](https://laravel.com/docs/13.x/eloquent-resources#jsonapi-resources)
- See rule: `rules/laravel/api-jsonapi.md` for enforced JSON:API rules
