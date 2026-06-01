# Laravel 13 GraphQL — Lighthouse, Federation & Schema Design

## When to Use

Use this skill when implementing GraphQL APIs in Laravel 13 using Lighthouse. GraphQL solves over-fetching and under-fetching problems inherent in REST. Best suited for mobile apps, dashboards, complex frontends, and aggregated data systems. Not every project needs GraphQL — simple CRUD APIs are better served by REST or JSON:API. This skill covers schema design, directives, resolvers, validation, authentication, N+1 prevention with DataLoader, query complexity protection, subscriptions, and Federation for distributed graphs.

---

## When to Choose GraphQL

### Good Candidates

```text
✓ Mobile apps (bandwidth constrained)
✓ Dashboards and analytics UIs
✓ Complex frontend applications
✓ Aggregated data from multiple backends
✓ Public APIs for developer ecosystems
✓ Real-time features (subscriptions)
```

### Avoid For

```text
✗ Simple CRUD APIs (REST is simpler)
✗ File upload/download servers
✗ Internal microservice communication (use gRPC)
✗ Logging and monitoring endpoints
```

---

## Lighthouse Installation & Setup

```bash
composer require nuwave/lighthouse

php artisan vendor:publish --tag=lighthouse-schema
php artisan vendor:publish --tag=lighthouse-config

# Optional: GraphQL IDE
composer require mll-lab/laravel-graphiql --dev
```

### Configuration

```php
// config/lighthouse.php
return [
    'route' => [
        'uri' => '/graphql',
        'name' => 'graphql',
        'middleware' => [
            \Illuminate\Routing\Middleware\ThrottleRequests::class . ':api',
        ],
    ],

    'guard' => ['api'],

    'schema' => [
        'register' => base_path('graphql/schema.graphql'),
    ],

    'cache' => [
        'enable' => env('LIGHTHOUSE_CACHE_ENABLE', false),
        'key' => 'lighthouse-schema',
    ],

    'debug' => env('APP_DEBUG', false),
];
```

---

## Schema-First Design

### Always Define Schema Before Resolvers

```graphql
# graphql/schema.graphql

type Query {
    me: User! @auth
    users: [User!]! @paginate
    user(id: ID! @eq): User @find
    posts: [Post!]! @paginate
    post(id: ID! @eq): Post @find
}

type Mutation {
    createUser(input: CreateUserInput! @spread): User! @create
    updateUser(id: ID!, input: UpdateUserInput! @spread): User! @update
    deleteUser(id: ID!): User @delete
    login(email: String!, password: String!): AuthPayload!
}

type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]! @hasMany
    created_at: DateTime!
    updated_at: DateTime!
}

type Post {
    id: ID!
    title: String!
    content: String!
    author: User! @belongsTo
    comments: [Comment!]! @hasMany
    created_at: DateTime!
}

type Comment {
    id: ID!
    body: String!
    author: User! @belongsTo
    post: Post! @belongsTo
}

input CreateUserInput {
    name: String! @rules(apply: ["required", "string", "max:255"])
    email: String! @rules(apply: ["required", "email", "unique:users,email"])
    password: String! @rules(apply: ["required", "string", "min:8"])
}

input UpdateUserInput {
    name: String @rules(apply: ["string", "max:255"])
    email: String @rules(apply: ["email", "unique:users,email"])
}

type AuthPayload {
    token: String!
    user: User!
}
```

---

## Lighthouse Directives

### Core Query Directives

```graphql
type Query {
    # Returns all records from the model
    allUsers: [User!]! @all

    # Paginated results (default: 20 per page)
    users: [User!]! @paginate(defaultCount: 20, maxCount: 100)

    # Find a single record by primary key
    user(id: ID! @eq): User @find

    # Find the first matching record
    firstUser(email: String! @eq): User @first

    # Filter with conditions
    activeUsers(active: Boolean! @eq): [User!]! @all

    # Where conditions
    searchUsers(name: String! @where(key: "name", operator: "like")): [User!]! @all

    # Paginate with multiple where conditions
    filteredUsers: [User!]! @paginate
        @where(key: "active", value: true)
        @where(key: "deleted_at", value: null, operator: "IS NULL")
        @softDeletes
}
```

### Mutation Directives

```graphql
type Mutation {
    # CRUD mutations
    createUser(input: CreateUserInput! @spread): User! @create
    updateUser(id: ID!, input: UpdateUserInput! @spread): User! @update
    upsertUser(id: ID, input: UpsertUserInput! @spread): User! @upsert
    deleteUser(id: ID!): User @delete

    # With validation
    createPost(
        title: String! @rules(apply: ["required", "min:3", "max:255"])
        content: String! @rules(apply: ["required", "min:10"])
    ): Post! @create
}
```

### Relationship Directives

```graphql
type User {
    id: ID!
    name: String!
    posts: [Post!]! @hasMany
    profile: Profile @hasOne
}

type Post {
    id: ID!
    title: String!
    author: User! @belongsTo
    comments: [Comment!]! @hasMany
    tags: [Tag!]! @belongsToMany
}
```

### Custom Directives

```php
namespace App\GraphQL\Directives;

use Nuwave\Lighthouse\Schema\Directives\BaseDirective;
use Nuwave\Lighthouse\Support\Contracts\FieldMiddleware;

final class UpperCaseDirective extends BaseDirective implements FieldMiddleware
{
    public static function definition(): string
    {
        return /** @lang GraphQL */ <<<'GRAPHQL'
"""
Transform a string field to uppercase.
"""
directive @upperCase on FIELD_DEFINITION
GRAPHQL;
    }

    public function handleField(FieldValue $fieldValue, Closure $next): FieldValue
    {
        $resolver = $fieldValue->getResolver();

        return $next(
            $fieldValue->setResolver(function ($root, array $args, GraphQLContext $context, ResolveInfo $info) use ($resolver) {
                $result = $resolver($root, $args, $context, $info);

                return is_string($result) ? strtoupper($result) : $result;
            })
        );
    }
}
```

---

## Resolvers

### Thin Resolvers Pattern

Resolvers should delegate to Actions/Services. Never contain business logic.

```php
namespace App\GraphQL\Queries;

use App\Modules\User\Actions\SearchUsersAction;
use App\Modules\User\DTOs\SearchUsersDTO;

final class SearchUsers
{
    public function __construct(
        private readonly SearchUsersAction $action,
    ) {}

    public function __invoke(mixed $root, array $args): mixed
    {
        $dto = new SearchUsersDTO(
            query: $args['query'],
            filters: $args['filters'] ?? [],
        );

        return $this->action->execute($dto);
    }
}
```

```graphql
type Query {
    searchUsers(query: String!, filters: SearchFiltersInput): [User!]! @field(resolver: "App\\GraphQL\\Queries\\SearchUsers")
}
```

### Resolver Flow

```text
Query/Mutation
    ↓
Resolver (thin — delegates)
    ↓
Action (orchestration)
    ↓
Domain Service (business logic)
    ↓
Model / Repository
```

---

## Validation

```graphql
input CreateUserInput {
    name: String! @rules(apply: ["required", "string", "max:255"])
    email: String! @rules(apply: ["required", "email", "unique:users,email"])
    password: String!
        @rules(apply: ["required", "string", "min:8", "confirmed"])
        @rulesForArray(apply: ["min:8"])
}
```

### Custom Validation Rules

```graphql
input CreatePostInput {
    title: String! @rules(apply: ["required", "max:255"])
    content: String! @rules(apply: ["required", "min:100"])
    status: String!
        @rules(apply: ["required", "in:draft,published,archived"])
}
```

### Dedicated Rule Classes

```php
use Illuminate\Contracts\Validation\ValidationRule;

class AllowedDomain implements ValidationRule
{
    public function validate(string $attribute, mixed $value, \Closure $fail): void
    {
        $domain = substr(strrchr($value, '@'), 1);

        if (!in_array($domain, ['example.com', 'company.com'], true)) {
            $fail('The :attribute must be from an allowed domain.');
        }
    }
}
```

```graphql
input CreateUserInput {
    email: String! @rules(apply: [
        "required",
        "email",
        "unique:users,email",
        "App\\Rules\\AllowedDomain"
    ])
}
```

---

## Authorization

### Use Policies, Not Resolver Conditionals

```php
namespace App\Policies;

use App\Models\User;
use App\Models\Post;

class PostPolicy
{
    public function viewAny(?User $user): bool
    {
        return true; // Public posts are viewable by anyone
    }

    public function view(?User $user, Post $post): bool
    {
        return $post->is_published || $user?->id === $post->author_id;
    }

    public function create(User $user): bool
    {
        return $user->is_active;
    }

    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->author_id || $user->is_admin;
    }

    public function delete(User $user, Post $post): bool
    {
        return $user->id === $post->author_id;
    }
}
```

### Applying to Schema

```graphql
type Query {
    # @can checks policy
    posts: [Post!]! @paginate @can(ability: "viewAny")

    # @canModel injects the model
    post(id: ID! @eq): Post @find @canModel(ability: "view")
}

type Mutation {
    createPost(input: CreatePostInput! @spread): Post! @create
        @can(ability: "create")

    updatePost(id: ID!, input: UpdatePostInput! @spread): Post! @update
        @canModel(ability: "update", find: "id")

    deletePost(id: ID!): Post @delete
        @canModel(ability: "delete", find: "id")
}
```

---

## N+1 Prevention — DataLoader Pattern

### The Problem

```graphql
query {
    posts {
        title
        author {  # N+1: queries author for each post
            name
        }
    }
}
```

### Lighthouse Built-in Batching

Lighthouse automatically batches queries when using Eloquent relationship directives (`@hasMany`, `@belongsTo`, etc.). No extra setup needed.

### Custom DataLoader

```php
namespace App\GraphQL\Loaders;

use App\Modules\User\Models\User;
use Illuminate\Support\Facades\Cache;

class UserLoader
{
    public function loadByIds(array $ids): array
    {
        $users = User::whereIn('id', $ids)->get()->keyBy('id');

        return array_map(fn ($id) => $users[$id] ?? null, $ids);
    }

    public function loadByIdsCached(array $ids): array
    {
        $uncached = [];
        $results = [];

        foreach ($ids as $id) {
            $results[$id] = Cache::get("user.{$id}");
            if (!$results[$id]) {
                $uncached[] = $id;
            }
        }

        if ($uncached) {
            $fresh = User::whereIn('id', $uncached)->get();
            foreach ($fresh as $user) {
                Cache::put("user.{$user->id}", $user, 3600);
                $results[$user->id] = $user;
            }
        }

        return array_map(fn ($id) => $results[$id] ?? null, $ids);
    }
}
```

---

## Query Complexity Protection

### Depth Limiting

```php
// config/lighthouse.php
return [
    'security' => [
        'max_depth' => env('LIGHTHOUSE_MAX_DEPTH', 10),

        'max_complexity' => env('LIGHTHOUSE_MAX_COMPLEXITY', 1000),

        'max_query_count' => env('LIGHTHOUSE_MAX_QUERY_COUNT', 3),
    ],
];
```

### What it Prevents

```graphql
# FORBIDDEN — infinite nesting attack
query {
    users {
        posts {
            comments {
                author {
                    posts {
                        comments {
                            # ...
                        }
                    }
                }
            }
        }
    }
}
```

### Query Cost Analysis

```graphql
type Query {
    # Cost: 1 (simple field)
    me: User! @auth

    # Cost: 10 * defaultCount = 200
    users: [User!]! @paginate

    # Cost: 5 (field-level cost)
    expensiveReport: Report! @field(resolver: "App\\GraphQL\\Queries\\ExpensiveReport")
        @cost(complexity: 5)
}
```

---

## Subscriptions

```bash
composer require pusher/pusher-php-server
```

```php
// config/lighthouse.php
'subscriptions' => [
    'driver' => 'pusher',
    'storage' => 'redis',
    'broadcaster' => 'pusher',
],
```

```graphql
type Subscription {
    postCreated: Post!
    postUpdated: Post!
    postDeleted: Post!
}

type Mutation {
    createPost(input: CreatePostInput! @spread): Post! @create
        @broadcast(subscription: "postCreated")
}
```

---

## GraphQL Federation

### Architecture Overview

```text
Gateway (Apollo Router / custom)
    ├── Users Subgraph (Lighthouse)
    ├── Products Subgraph (Lighthouse)
    └── Billing Subgraph (Lighthouse)
```

### Subgraph Setup

```bash
composer require nuwave/lighthouse
```

```php
// config/lighthouse.php
'federation' => [
    'enabled' => true,
    'type' => 'subgraph',
    'name' => 'users',
],
```

### Federated Types

```graphql
# Users subgraph
extend type Query @shareable {
    users: [User!]! @paginate
}

type User @key(fields: "id") @extends {
    id: ID! @external
    name: String! @shareable
    email: String!
    posts: [Post!]! @hasMany
}

type Post @key(fields: "id") {
    id: ID!
    title: String!
    content: String!
}

# Products subgraph
extend type Query @shareable {
    products: [Product!]! @paginate
}

type Product @key(fields: "id") {
    id: ID!
    name: String!
    price: Float!
    createdBy: User! @provides(fields: "name")
}

type User @key(fields: "id") @extends {
    id: ID! @external
    name: String! @external
    products: [Product!]! @hasMany
}
```

### Federation Rules

```text
✓ Each service owns its data
✓ External types referenced via @external
✓ Keys must uniquely identify entities
✓ @shareable fields can be resolved by multiple subgraphs
✓ @provides fields are pre-resolved by the providing subgraph
✓ @requires fields must be resolved before the requiring field
```

---

## GraphQL Enterprise Checklist

- [ ] Schema defined before resolvers (SDL-first)
- [ ] Strong typing used throughout (avoid `JSON`, `Mixed`, `Any`)
- [ ] Resolvers delegate to Actions/Services
- [ ] N+1 queries eliminated (DataLoader or built-in batching)
- [ ] Query complexity/depth limits configured
- [ ] Rate limiting applied to `/graphql` endpoint
- [ ] Validation via `@rules` (not inline resolver logic)
- [ ] Authorization via Policies + `@can`/`@canModel`
- [ ] Pagination with `@paginate` (max count enforced)
- [ ] Subscriptions use Pusher/Redis driver
- [ ] Federation boundaries respected (each subgraph owns data)
- [ ] Cache layer for expensive resolvers
- [ ] Schema published as documentation

---

## References

- See skill: `laravel-api-rest` for REST alternatives
- See skill: `laravel-api-jsonapi` for JSON:API alternatives
- See skill: `laravel-api-grpc` for gRPC alternatives
- See skill: `laravel-api-microservices` for service boundaries
- See skill: `laravel-patterns` for Action/Services/Resolvers
- See skill: `laravel-security` for authentication and authorization
- See official: [Lighthouse Docs](https://lighthouse-php.com/)
- See official: [Apollo Federation](https://www.apollographql.com/docs/federation/)
- See rule: `rules/laravel/api-graphql.md` for enforced GraphQL rules
