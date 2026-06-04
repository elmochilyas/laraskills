# ECC Anti-Patterns — Team-Scale Organizational Strategies

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Code Organization Standards |
| **Knowledge Unit** | Team-scale organizational strategies (10+ engineers) |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Flat Namespace With Multi-Team
2. No Shared Kernel Owner
3. Over-Partitioning
4. No Contract Versioning

---

## Repository-Wide Anti-Patterns

- God Services
- Massive Configuration Files

---

## Anti-Pattern 1: Flat Namespace With Multi-Team

### Description
All 10+ engineers sharing a single `App\` namespace. No per-domain or per-team namespace roots. Every team's code lives in the same namespace, causing merge conflicts, class name collisions, and unclear ownership.

### Why It Happens
Sticking with Laravel defaults beyond the team size they support. Not recognizing when multi-team coordination requires namespace partitioning.

### Warning Signs
- Multiple teams modify files in the same namespace
- Merge conflicts on `AppServiceProvider.php` or `routes/web.php` are weekly
- Class name collisions between teams
- No one knows who owns which namespace

### Preferred Alternative
Give each team its own namespace root with separate PSR-4 mapping. Use per-domain service providers. Establish a shared kernel with explicit ownership.

### Related Rules
- R02: Give Each Domain Its Own Service Provider (COS-06/05-rules.md)

---

## Anti-Pattern 2: No Shared Kernel Owner

### Description
Everyone contributes to `Shared/` or `Support/`, no one maintains it. The shared kernel becomes unmaintained code, dead utilities, and orphaned abstractions. No one is responsible for quality, documentation, or cleanup.

### Why It Happens
Shared kernel seen as "free space" everyone can use. No explicit ownership assigned.

### Warning Signs
- `app/Shared/` has files with no recent commits
- Dead code in shared directories
- No owner listed for shared infrastructure
- Shared code quality is below team standards

### Preferred Alternative
Assign explicit ownership for the shared kernel. Rotate ownership quarterly. Establish quality and documentation standards for shared code.

---

## Anti-Pattern 3: Over-Partitioning

### Description
Creating separate modules or domains for each team member on a 12-person team — 12 domains where 3-4 would suffice. The overhead of module boundaries, service providers, and contracts exceeds the coordination cost it saves.

### Why It Happens
Applying the "team-to-domain" rule too literally at small team scale.

### Warning Signs
- Modules with 1-2 files each
- More domains than meaningful business boundaries
- Cross-domain coordination overhead exceeds coordination cost

### Preferred Alternative
Partition only at meaningful business boundaries, not team member count. Start with 3-4 domains, expand as the organization grows.
