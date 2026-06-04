# Decision Trees: Nested Resource Controllers

## Tree 1: Nesting Depth

```
How many levels deep is the resource hierarchy?
├── 1 level (parent → child) → Standard resource nesting. Use ->shallow().
├── 2 levels (parent → child → grandchild) → Consider max. Use shallow. Evaluate if top-level is better.
└── 3+ levels → Refactor. Use top-level resources with parent references.
```

## Tree 2: Shallow vs Full Nesting

```
Does the child resource have a globally unique ID?
├── YES → Shallow nesting. /posts/{post} instead of /users/{user}/posts/{post}.
├── NO (child ID is only unique within parent) → Full nesting required.
└── PARTIALLY (UUID children) → Shallow nesting. UUIDs are globally unique.
```

## Tree 3: Controller Organization

```
How many nested resources exist?
├── 1-3 → Separate controllers per resource. PostController handles all Post operations.
├── 4-10 → Organize by domain: Admin/UserPostController, Api/UserPostController.
└── 10+ → Directory per resource with action files.
```
