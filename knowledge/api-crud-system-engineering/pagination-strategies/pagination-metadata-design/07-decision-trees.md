# Decision Trees: Pagination, Filtering, and Sorting

## Tree 1: Filter Strategy Selection

```
How many filterable fields are needed?
├── 1-3 fields → Simple equality: ?filter[status]=active
├── 4-10 fields → Scoped filters with operators: ?filter[age][gte]=18
├── 10+ fields → Consider JSON filter or dedicated search endpoint
└── Complex cross-field logic → Use dedicated filter classes per field
```

## Tree 2: Sort Strategy Selection

```
How many sortable fields are needed?
├── 1-2 fields → Simple sort: ?sort=name, ?sort=-created_at
├── 3-5 fields → Multi-column sort: ?sort=-created_at,name
└── Complex sorting (multiple columns, directions per column) → Named sort presets: ?sort=recent, ?sort=popular
```

## Tree 3: Pagination Metadata Structure

```
Which pagination strategy is used?
├── Offset pagination → Include: current_page, per_page, total, last_page, from, to, links
├── Simple pagination (no total) → Include: current_page, per_page, from, to, next/prev links only
├── Cursor pagination → Include: next_cursor, prev_cursor, has_more
└── Infinite scroll → Include: next_cursor, has_more. Omit total and page numbers.
```
