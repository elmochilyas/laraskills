# Decision Trees: Cursor-Based Pagination

## Tree 1: Cursor vs Offset Pagination Selection

```
Does the API require page number navigation?
├── YES → Offset pagination. Cursor doesn't support direct page access.
├── NO → Is the dataset larger than 10,000 records?
│   ├── YES → Cursor pagination. Offset becomes slow at deep pages.
│   └── NO → Does data change frequently (real-time inserts/deletes)?
│       ├── YES → Cursor pagination. Offset suffers from result drift.
│       └── NO → Offset pagination. Simpler to implement.
└── Is this for infinite scroll UI?
    ├── YES → Cursor pagination. Natural fit for infinite scroll.
    └── NO → Evaluate other factors.
```

## Tree 2: Cursor Column Selection

```
Is there a naturally ordered, unique column?
├── Auto-incrementing ID → Use as default cursor column. Simplest option.
├── Created_at timestamp → Use if unique. Consider timestamp + ID composite.
├── UUID primary key → Use UUID. Ensure it's indexed for sort order.
├── Composite (multiple columns) → Multi-column cursor. Encode both values.
└── No suitable column → Add auto-incrementing ID or composite cursor.
```

## Tree 3: Cursor Encoding Strategy

```
Should cursors be human-readable?
├── NO → Base64-encoded JSON with version and metadata. Secure enough.
├── NO, need tamper-proof → Base64-encoded + HMAC signature. Server validates.
├── NO, need opaque → Encrypted cursors. Decode on server side only.
└── YES (rare) → Not recommended. Raw cursors enable enumeration.
```
