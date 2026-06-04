# Prevention Strategies — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Prevention Strategies |
| Focus | Anti-patterns in eager loading discipline, $with property, accessor loading, and view-level fetching |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | `$with` Global for Convenience | Performance | Critical |
| 2 | View-Level Lazy Loading (Blade Templates Fetching Data) | Architecture | Critical |
| 3 | No Eager Loading in Controllers | Performance | Critical |
| 4 | Using `load()` Instead of `loadMissing()` in Accessors | Performance | Medium |
| 5 | Unconstrained Nested Loading (Loading Millions of Child Rows) | Performance | High |
| 6 | Loading Full Relations When Only Count Is Needed | Performance | High |

---

## 1. `$with` Global for Convenience

### Category
Performance

### Description
Adding relations to `protected $with` on the model because they are "sometimes needed," forcing every query (including counts and existence checks) to load those relations.

### Preferred Alternative
```php
// Explicit with() per query where needed:
Post::with('comments', 'author', 'tags')->paginate(20);
```

### Detection Checklist
- [ ] Search for `protected $with` declarations
- [ ] Move rarely-needed relations to explicit `with()` calls
- [ ] Keep `$with` only for universally-needed relations

### Related
| Rule | `05-rules.md` — Prefer Explicit with() Over $with Model Property |

---

## 2. View-Level Lazy Loading (Blade Templates Fetching Data)

### Category
Architecture

### Description
Blade templates calling `$post->comments`, `$post->author` without pre-loading in the controller, embedding hidden N+1 queries in the presentation layer.

### Preferred Alternative
```php
// Controller pre-loads:
$posts = Post::with('comments', 'author')->paginate(20);
// View only renders:
@foreach($posts as $post)
    <span>{{ $post->author->name }}</span>
@endforeach
```

### Detection Checklist
- [ ] Review Blade templates for relationship access
- [ ] Move eager loading to controllers
- [ ] Verify views receive pre-loaded data

### Related
| Rule | `05-rules.md` — Never Lazy-Load in Blade Templates |

---

## 3. No Eager Loading in Controllers

### Category
Performance

### Description
Controller methods returning models without eager loading any relationships, causing the view to trigger N+1 queries.

### Preferred Alternative
```php
$posts = Post::with('comments', 'author')->paginate(20);
return view('posts.index', compact('posts'));
```

### Detection Checklist
- [ ] Review controller methods for missing `with()` calls
- [ ] Add eager loading for all relations consumed by view
- [ ] Verify query count stays low per endpoint

### Related
| Rule | `05-rules.md` — Always Eager-Load in Controllers |

---

## 4. Using `load()` Instead of `loadMissing()` in Accessors

### Category
Performance

### Description
Calling `$this->load('relation')` inside accessors, always querying even when the relation is already loaded.

### Preferred Alternative
```php
public function getDisplayNameAttribute(): string
{
    $this->loadMissing('profile');
    return $this->profile->display_name ?? $this->name;
}
```

### Detection Checklist
- [ ] Search for `$this->load(` in accessors
- [ ] Replace with `$this->loadMissing(`
- [ ] Verify no redundant queries on pre-loaded models

### Related
| Rule | `05-rules.md` — Use loadMissing in Accessors |

---

## 5. Unconstrained Nested Loading (Loading Millions of Child Rows)

### Category
Performance

### Description
Nesting eager loads without constraints: `Post::with('comments.replies.likes')` loads every comment, reply, and like — potentially millions of child rows.

### Preferred Alternative
```php
Post::with(['comments' => fn($q) => $q->latest()->limit(5)->with([
    'replies' => fn($q) => $q->latest()->limit(3),
])])->paginate(20);
```

### Detection Checklist
- [ ] Review nested `with()` calls for constraints
- [ ] Add limits to deep relation chains
- [ ] Verify memory usage of deeply nested loads

### Related
| Rule | `05-rules.md` — Use Constrained Loading for Nested Relations |

---

## 6. Loading Full Relations When Only Count Is Needed

### Category
Performance

### Description
Using `with('comments')` and then `$post->comments->count()` instead of `withCount('comments')`, loading thousands of comment rows just to get a number.

### Preferred Alternative
```php
$posts = Post::withCount('comments')->get();
foreach ($posts as $post) {
    echo $post->comments_count; // No child rows loaded
}
```

### Detection Checklist
- [ ] Search for `->count()` on eager-loaded relations
- [ ] Replace with `withCount()` for count-only needs
- [ ] Verify only needed data is loaded from database

### Related
| Rule | `05-rules.md` — Use loadCount Instead of Full Relation Loading |
