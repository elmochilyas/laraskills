# Decision Trees: Offset-Based Pagination

## Tree 1: paginate() vs simplePaginate()

```
Does the UI need to show total page count or page numbers?
├── YES → paginate(). Includes total count and last_page.
├── NO → Does the UI need a "load more" / infinite scroll pattern?
│   ├── YES → simplePaginate(). Faster, no total count.
│   └── NO → paginate(). Safer default.
└── UNSURE → paginate(). Can always switch to simplePaginate later.
```

## Tree 2: Per-Page Limit Decision

```
What type of data is being paginated?
├── Small records (<100 bytes each) → Max per_page: 100
├── Medium records (100-1000 bytes) → Max per_page: 50
├── Large records (1KB+ each, includes eager loaded relations) → Max per_page: 20
└── Media/upload content (images, files) → Max per_page: 10. Consider offset pagination not appropriate.
```

## Tree 3: Offset vs Cursor Decision

```
Dataset size and characteristics?
├── < 1,000 records → Offset pagination. Simple, fast enough.
├── 1,000 - 10,000 records → Offset pagination. Acceptable performance. Monitor for slow queries.
├── 10,000 - 100,000 records → Consider cursor pagination. Offset starts to slow.
└── > 100,000 records → Cursor pagination. Offset is too slow.
```
