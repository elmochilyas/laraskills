# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** Cursor Pagination Metadata
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Cursor Metadata Field Selection

---

### Decision Context

Determining which metadata fields (`next_cursor`, `prev_cursor`, `has_more`, `path`, `per_page`) to include in cursor-paginated responses based on client navigation requirements.

---

### Decision Criteria

* architectural
* maintainability
* security

---

### Decision Tree

Does the UI require forward-only navigation or bidirectional (forward + backward)?
├── Forward-only (infinite scroll, activity feeds) → Include minimal metadata
│   ├── Include `next_cursor`, `has_more`, `per_page`, `path`
│   ├── Set `prev_cursor` to null or omit entirely
│   └── Does the client need to know the total number of items?
│       ├── YES → Include `total` only if the count query cost is acceptable
│       └── NO → Omit `total` — the core advantage of cursor pagination
└── Bidirectional (admin panels, messaging, audit logs) → Include full metadata
    ├── Include `next_cursor`, `prev_cursor`, `has_more`, `per_page`, `path`
    └── Are both `next_cursor` and `prev_cursor` always populated?
        ├── YES → Both are present except at boundaries (first/last page)
        └── NO → Set null at boundaries, never omit the key

---

### Rationale

Forward-only UIs never need backward navigation. Exposing `prev_cursor` adds payload bytes and implies backward pagination support that is not tested or maintained. `has_more` is the critical field for "load more" UI state.

---

### Recommended Default

**Default:** Include `next_cursor`, `prev_cursor` (null on first page), `has_more`, `per_page`, `path`; omit `total`
**Reason:** Full metadata supports all client types; `has_more` is an unambiguous end-of-data signal.

---

### Risks Of Wrong Choice

Forward-only UIs get unnecessary bytes from `prev_cursor`. Missing `has_more` forces clients to infer end-of-data from null `next_cursor`, which is ambiguous with API errors. Including `total` defeats cursor pagination's performance advantage.

---

### Related Rules

* Always Include `has_more` in Every Cursor-Paginated Response
* Never Rely on Total Count with Cursor Pagination

---

### Related Skills

* Implement Cursor Pagination Design
* Return Cursor Pagination Metadata in Standard JSON Envelope

---

---

## Cursor Encoding and Security Strategy

---

### Decision Context

Choosing cursor encoding strategy that balances security (opacity, tamper-resistance) with the performance and complexity budget.

---

### Decision Criteria

* security
* architectural

---

### Decision Tree

Are cursor values exposed to external or untrusted clients?
├── YES → Encode cursors as opaque strings
│   ├── Is cursor tampering a realistic threat?
│   │   ├── YES → HMAC-sign or encrypt the cursor payload
│   │   │   ├── HMAC: `base64( json_encode(id:15, dir:'next') + HMAC )`
│   │   │   └── Encrypt: `base64( encrypt( json_encode(id:15, dir:'next') ) )`
│   │   └── NO → Base64-encode the JSON cursor payload
│   └── Does the cursor need to include sort direction?
│       ├── YES → Encode `{ id, direction, ... }` in the cursor payload
│       └── NO → Encode `{ id, ... }` — direction inferred from endpoint
└── NO (internal-only API on isolated network) → Raw IDs may be acceptable
    ├── Still prefer base64 encoding for consistency
    └── Document that cursors are internal-only

---

### Rationale

Raw cursors expose database internals and enable client-side cursor construction. Base64 encoding provides basic opacity; HMAC signing adds tamper evidence. The encoding strategy should match the trust boundary of the API.

---

### Recommended Default

**Default:** Base64-encoded JSON payload `base64(json_encode(['id' => $id, 'direction' => 'next']))`; HMAC-sign for sensitive data
**Reason:** Base64 is fast and provides sufficient opacity; HMAC prevents forged cursors at minimal cost.

---

### Risks Of Wrong Choice

Raw cursors expose auto-increment IDs and enable sequential enumeration. Unencoded cursors are parsed and depended upon by clients, making encoding changes breaking. Expired/invalid cursors not handled return 500 errors.

---

### Related Rules

* Always Encode Cursors as Opaque Base64 Strings
* Validate and Sanitize Incoming Cursors

---

### Related Skills

* Cursor Encoding Strategies
* Cursor Pagination Design

---

---

## Sort Column Uniqueness and Tiebreaker Selection

---

### Decision Context

Choosing sort columns and tiebreaker strategies to ensure deterministic, gap-free cursor pagination.

---

### Decision Criteria

* reliability
* performance

---

### Decision Tree

Is the primary sort column guaranteed unique by a database constraint?
├── YES (UUID, unique index, primary key) → Use the column directly
│   └── Is the sort order monotonically increasing?
│       ├── YES → Ideal cursor candidate (e.g., auto-increment ID)
│       └── NO (UUID v4) → Works correctly but may have performance implications
└── NO (created_at, name, non-unique index) → Add a unique tiebreaker column
    ├── Is there a natural tiebreaker (primary key)?
    │   ├── YES → Append primary key as secondary sort: `ORDER BY created_at DESC, id DESC`
    │   └── NO → Consider adding a monotonically increasing column for pagination
    └── Does the cursor encode both sort columns?
        ├── YES → Encode both primary and tiebreaker values in cursor payload
        └── NO → Rebuild cursor to include tiebreaker — required for correctness

Is the sort column mutable (updated_at, name)?
├── YES → Mutable sort columns invalidate existing cursors — consider immutable alternatives
└── NO → Safe for indefinite cursor validity

---

### Rationale

Non-unique sort columns cause records with the same value to appear on multiple pages or be skipped entirely. A primary key tiebreaker ensures deterministic, gap-free pagination. Mutable sort columns invalidate cursors as the referenced record's position changes.

---

### Recommended Default

**Default:** Use primary key (`id`) as the cursor column for simplicity; if sorting by `created_at`, always add `ORDER BY created_at DESC, id DESC`
**Reason:** Primary key is unique, monotonically increasing, and immutable — the ideal cursor column.

---

### Risks Of Wrong Choice

Non-unique sort columns cause duplicate records across pages or skipped records. Mutable sort columns cause cursor invalidation when the referenced record is updated.

---

### Related Rules

* Use a Unique Sort Column with a Tiebreaker
* Never Rely on Total Count with Cursor Pagination

---

### Related Skills

* Keyset Pagination Design
* Multi-Column Cursor Pagination
