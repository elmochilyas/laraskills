# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Pagination Strategies
**Knowledge Unit:** Pagination Link Headers
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Link Header Inclusion Strategy

---

## Decision Context

Deciding whether to include pagination links in HTTP `Link` headers, response body, or both, based on client capabilities and infrastructure constraints.

---

## Decision Criteria

* architectural
* maintainability
* security

---

## Decision Tree

Can all target clients reliably access HTTP response headers?
├── YES → Do proxies, CDNs, or load balancers strip custom headers including Link?
│   ├── YES → Body-only links (header stripping breaks header-based navigation)
│   └── NO → Are there clients that specifically depend on Link headers (GitHub-style)?
│       ├── YES → Include in both headers and body (maximum compatibility)
│       └── NO → Include in both headers and body (defensive best practice)
└── NO → Body-only links (some clients cannot access headers)

Does the pagination strategy limit Link header options?
├── Cursor → Include only `prev` and `next` (omit `first` and `last`)
└── Offset → Include `first`, `last`, `prev`, and `next`

---

## Rationale

Some clients (browsers, simple HTTP clients) cannot easily access response headers; others (GitHub API client libraries) expect header-based navigation. Dual inclusion supports all clients. Cursor pagination cannot provide meaningful `first`/`last` URLs.

---

## Recommended Default

**Default:** Include links in both HTTP Link headers and response body `links` object
**Reason:** Maximum client compatibility; supports both header-parsing and body-parsing clients.

---

## Risks Of Wrong Choice

Header-only breaks for clients that can't access headers. Body-only misses standard REST convention. Including `first`/`last` for cursor pagination misleads clients.

---

## Related Rules

* Include Links in Both Headers and Response Body
* Use RFC 5988 Format for Link Headers
* Preserve All Existing Query Parameters in Link URLs

---

## Related Skills

* Implement Pagination via Link Headers

---

## Query Parameter Preservation Decision

---

## Decision Context

Determining which query parameters to preserve when generating pagination Link header URLs.

---

## Decision Criteria

* maintainability
* security

---

## Decision Tree

Do the paginated endpoints accept filter, sort, or search query parameters?
├── YES → Merge ALL existing query parameters into pagination link URLs
│   └── Include: filters (status, category), sort (sort_by, order), search (q), per_page
│   └── Exclude: authentication tokens, API keys, session IDs
└── NO → Only pagination parameters are needed in link URLs
    └── Include: page/cursor, per_page

Are there sensitive parameters that should not appear in URLs?
├── YES → Exclude them from link URLs; use POST or header-based passing
└── NO → All parameters are safe for URL exposure

---

## Rationale

Clients navigating to next/prev pages expect to retain their current filter, sort, and search context. Omitting these parameters breaks the user's session. However, authentication tokens and sensitive data must never appear in link URLs.

---

## Recommended Default

**Default:** Merge all non-sensitive query parameters into pagination link URLs
**Reason:** Preserves filter/sort/search context across pagination navigation.

---

## Risks Of Wrong Choice

Omitting filters causes clients to lose their search/filter context when navigating pages. Including auth tokens in URLs exposes credentials in logs and referrer headers.

---

## Related Rules

* Preserve All Existing Query Parameters in Link URLs

---

## Related Skills

* Implement Pagination via Link Headers
