# Decision Trees: Response Metadata and Links

## Tree 1: Metadata Content

```
What type of response is this?
├── Single resource → meta: { request_id, api_version }, links: { self }
├── Collection (paginated) → meta: { request_id, api_version, current_page, per_page, total, last_page }, links: { self, first, prev, next, last }
├── Error → meta: { request_id, api_version, error_code, status }
└── Created resource → meta: { request_id, api_version }, links: { self (new resource) }
```

## Tree 2: Include vs No Include

```
Do consumers frequently need related data?
├── YES, multiple consumers need different related data → ?include= support
├── YES, but all consumers need the same related data → Always include. No opt-in needed.
├── NO, consumers always make separate requests → No include support.
└── SOMETIMES, but relationships are small → Always include. Overhead is minimal.
```

## Tree 3: Sparse Fields vs Full Response

```
How many fields does the resource have?
├── 1-5 fields → Sparse fieldsets not needed. Always return all fields.
├── 5-15 fields → Consider sparse fieldsets for mobile consumers.
├── 15+ fields → Implement sparse fieldsets. Significant bandwidth savings.
└── Variable (some consumers need 3 fields, others need all 20) → Implement sparse fieldsets.
```
