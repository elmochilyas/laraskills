## Always Eager-Load in Controllers
---
## Category
Architecture
---
## Rule
Controller methods must eagerly load all relationships that the view, API resource, or serialization will access.
---
## Reason
This creates a clear contract: the controller fetches everything the downstream consumer needs. If a new relationship is added to the view, the controller must be updated — making the data dependency explicit and auditable. Views and resources should never trigger lazy loads.
---
## Bad Example
```php
class PostController
{
    public function index(): View
    {
        $posts = Post::paginate(20);
        // No eager loading — view triggers N+1
        return view('posts.index', compact('posts'));
    }
}
```
---
## Good Example
```php
class PostController
{
    public function index(): View
    {
        $posts = Post::with('comments', 'author')->paginate(20);
        return view('posts.index', compact('posts'));
    }
}
```
---
## Exceptions
Single-model pages (show/detail) where only one model is fetched and lazy loading costs are bounded to 1 extra query.
---
## Consequences Of Violation
N+1 query explosion. A listing page for 50 posts that displays each author name and comment count triggers 101 queries instead of 3.
---
## Use loadMissing in Accessors
---
## Category
Maintainability
---
## Rule
Call `$this->loadMissing('relation')` inside accessors that reference a relationship, not `load()`.
---
## Reason
`loadMissing()` only queries the database if the relationship is not already loaded. `load()` always queries, even when the relation is present. In accessors — which may be called on both pre-loaded and unloaded models — `loadMissing()` prevents redundant queries without adding conditional logic.
---
## Bad Example
```php
public function getDisplayNameAttribute(): string
{
    $this->load('profile'); // Always queries, even if profile is loaded
    return $this->profile->display_name ?? $this->name;
}
```
---
## Good Example
```php
public function getDisplayNameAttribute(): string
{
    $this->loadMissing('profile'); // Only queries if not loaded
    return $this->profile->display_name ?? $this->name;
}
```
---
## Exceptions
Code paths where the relationship is never pre-loaded (documented guarantee). In that case both `load()` and `loadMissing()` query once.
---
## Consequences Of Violation
One extra query per accessor call on pre-loaded models. For a collection of 100 users each calling the accessor: 100 unnecessary queries.
---
## Prefer Explicit with() Over $with Model Property
---
## Category
Performance
---
## Rule
Use explicit `with()` on specific queries rather than `protected $with` on the model class.
---
## Reason
`$with` applies globally to every query on that model — including relationship resolution, serialization, and unrelated queries. A relation added to `$with` because it is "sometimes needed" forces every query to pay the join cost. Explicit `with()` scopes the eager loading to only the queries that need it.
---
## Bad Example
```php
class Post extends Model
{
    protected $with = ['comments', 'author', 'tags'];
    // Every Post query loads all three relations — even count queries
}
```
---
## Good Example
```php
// In controller:
Post::with('comments', 'author', 'tags')->paginate(20);
// Other queries do not load these relations
```
---
## Exceptions
Relations that are genuinely needed on every query (e.g., `User` always needing `Profile`). Review each `$with` entry individually and document the reason.
---
## Consequences Of Violation
Unnecessary joins on every query. A simple `Post::count()` or `Post::pluck('title')` loads three extra relations. For high-traffic endpoints, this waste compounds into significant CPU and I/O overhead.
---
## Use Constrained Loading for Nested Relations
---
## Category
Performance
---
## Rule
Apply constraints (limits, WHERE clauses) to nested eager loads to prevent loading excessive child records.
---
## Reason
Without constraints, `Post::with('comments.replies.likes')` loads every comment, every reply, and every like for every post. A single post with hundreds of comments, each with replies and likes, can load millions of child rows. Constrained loading limits the data to only what is needed.
---
## Bad Example
```php
Post::with('comments.replies.likes')->paginate(20);
// 20 posts × 50 comments × 10 replies × 5 likes = 50,000 rows loaded
```
---
## Good Example
```php
Post::with(['comments' => fn($q) => $q->latest()->limit(5)->with([
    'replies' => fn($q) => $q->latest()->limit(3),
])])->paginate(20);
// 20 posts × 5 comments × 3 replies = 300 rows — controlled
```
---
## Exceptions
Relationships guaranteed to have few child rows per parent (< 10) with documented data guarantees.
---
## Consequences Of Violation
Memory exhaustion from loading millions of child rows per request. The response time degrades linearly with data growth, and the server may run out of memory for large datasets.
---
## Never Lazy-Load in Blade Templates
---
## Category
Architecture
---
## Rule
Blade templates must access only pre-loaded relationships. Do not access `$model->relation` inside a view unless the controller has already eager-loaded it.
---
## Reason
Blade templates are presentation logic — they should not fetch data. A template accessing `$post->comments` triggers a lazy load if not pre-loaded, and the developer may not notice because the page renders correctly. This embeds hidden N+1 queries in the view layer.
---
## Bad Example
```blade
@foreach($posts as $post)
    <div>{{ $post->title }}</div>
    <span>{{ $post->author->name }}</span> // N+1 if not pre-loaded
@endforeach
```
---
## Good Example
```blade
@foreach($posts as $post)
    <div>{{ $post->title }}</div>
    <span>{{ $post->author->name }}</span> // Controller called with('author')
@endforeach
```
---
## Exceptions
Single-model show pages where only one lazy load is triggered — bounded cost of 1 extra query.
---
## Consequences Of Violation
Hidden N+1 queries in the presentation layer. The controller looks clean, but the view layer silently triggers hundreds of queries. Detection tools may not flag template code as readily as controller code.
---
## Use loadCount Instead of Full Relation Loading
---
## Category
Performance
---
## Rule
Use `withCount()` when you only need the count of related records, not the records themselves.
---
## Reason
`with('comments')` loads every comment row into memory just to call `->count()`. `withCount('comments')` executes a single aggregate subquery returning only the count — no child rows are hydrated. This reduces memory by orders of magnitude for large relations.
---
## Bad Example
```php
$posts = Post::with('comments')->get();
foreach ($posts as $post) {
    echo $post->comments->count(); // All comments loaded, only count needed
}
```
---
## Good Example
```php
$posts = Post::withCount('comments')->get();
foreach ($posts as $post) {
    echo $post->comments_count; // No comments loaded — only the count
}
```
---
## Exceptions
When access to individual related records is also needed later in the same request — load full relation once.
---
## Consequences Of Violation
Thousands of child rows loaded into memory when only a count was required. For a list of 50 posts each with hundreds of comments: tens of thousands of model instances created and immediately discarded.
