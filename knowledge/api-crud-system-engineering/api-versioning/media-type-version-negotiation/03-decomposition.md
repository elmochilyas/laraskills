# Media Type Version Negotiation — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** api-versioning
- **Knowledge Unit:** Media Type Version Negotiation
- **Last Updated:** 2026-06-04

---

## Topic Overview
Media Type Version Negotiation covers using the HTTP Accept header with custom vendor media types (e.g., `application/vnd.api.v2+json`) for API version negotiation, keeping URLs clean while supporting version-specific responses.

---

## Decomposition Strategy
This KU is separated from general versioning strategies because media type negotiation uses a fundamentally different mechanism (content negotiation vs. routing) and has unique concerns around Accept header parsing, middleware implementation, and fallback behavior.

---

## Proposed Folder Structure
```
api-versioning/
└── media-type-version-negotiation/
    ├── 02-knowledge-unit.md
    ├── 03-decomposition.md
    ├── 04-standardized-knowledge.md
    ├── 05-rules.md
    ├── 06-skills.md
    ├── 07-decision-trees.md
    ├── 08-anti-patterns.md
    └── 09-checklists.md
```

---

## Knowledge Unit Inventory
| Name | Purpose | Difficulty | Dependencies |
|------|---------|------------|-------------|
| Media Type Version Negotiation | Implement version negotiation via Accept header media types | Advanced | HTTP Content Negotiation, Versioning Strategy Selection |

---

## Dependency Graph
```
Versioning Strategy Selection
  ├─ HTTP Content Negotiation
  └─ Media Type Version Negotiation
       ├─ URL Path Versioning
       └─ Query String Versioning
```

---

## Boundary Analysis
**In scope:** Custom media type registration, Accept header parsing, middleware-based negotiation, route group negotiation, fallback/default version behavior, Content-Type response headers
**Out of scope:** Other versioning strategies, CORS handling, API gateway version routing, version governance policies

---

## Future Expansion Opportunities
- Quality value-based weighted negotiation
- Multi-representation negotiation (JSON, XML, Protobuf)
- IANA media type registration guidance
