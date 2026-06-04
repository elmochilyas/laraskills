# Decision Trees: Model Factory Relationships

## Tree 1: Relationship Creation Approach

```
Which relationship type?
├── Belongs-To (child → parent)
│   ├── Parent already exists → Comment::factory()->for($existingPost)->create()
│   └── Parent needs creation → Comment::factory()->for(Post::factory())->create()
├── Has-Many (parent → children)
│   ├── Fixed count → Post::factory()->has(Comment::factory()->count(3))->create()
│   └── Random count → Post::factory()->has(Comment::factory()->count(rand(1, 5)))->create()
├── Belongs-To-Many (pivot)
│   ├── With pivot data → User::factory()->hasAttached(Role::factory(), ['assigned_by' => $user->id])->create()
│   └── Without pivot data → User::factory()->hasAttached(Role::factory()->count(3))->create()
└── Morph (polymorphic)
    ├── Known parent type → Comment::factory()->for($post, 'commentable')->create()
    └── Unknown parent type → Comment::factory()->morphFor(Post::factory(), 'commentable')->create()
```

## Tree 2: Recycle vs New Parent

```
Does the test scenario require distinct parents?
├── YES (each child needs different parent attributes) → Create parent per child
├── NO (children share same parent) → recycle($parent)
├── PARTIALLY (some share, some differ) → Recycle base, override per-child
└── Parent is irrelevant to test → Recycle a default parent
```

## Tree 3: State vs Inline

```
Is this relationship pattern reused across multiple tests?
├── YES → Define factory state: User::factory()->withPosts(3)
├── NO, but chain is >3 calls → Extract inline helper function in test file
└── NO, chain is 2-3 calls → Use inline factory methods
```
