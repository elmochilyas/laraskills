# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | ReBAC (Relationship-Based Access Control) |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Maturing |

---

## Overview

Relationship-Based Access Control (ReBAC) evaluates authorization based on relationships between entities. Instead of checking "can user edit document?" by role or attribute, ReBAC asks "does user have an 'owner' or 'editor' relationship with this document?" ReBAC is inspired by Google Zanzibar (the consistent, global authorization system behind Google Calendar, Drive, YouTube). In Laravel, ReBAC patterns emerge in multi-tenant team collaboration (users have roles within teams; teams have access to resources) and content management systems (authors, editors, reviewers per document).

---

## Core Concepts

- **Relationship Tuple**: `(user, relationship, resource)` — `(alice, editor, document:123)`.
- **Subject**: The entity requesting access (user, group, service account).
- **Resource**: The entity being accessed (document, project, team).
- **Relationship**: The type of connection between subject and resource (owner, editor, viewer, member).
- **Relation Expansion**: Evaluating all users who have a specific relationship with a resource through nested relationships.
- **Zanzibar Model**: `object#relation@user` — `document:123#viewer@alice`.
- **ReBAC Graph**: A directed graph where nodes are entities and edges are relationships.

---

## When To Use

- Complex team/permission structures (Google Drive-style sharing)
- Multi-tenant applications with team-based resource access
- Content management with per-resource author/editor/reviewer roles
- Hierarchical permissions (organization → team → project → document)

## When NOT To Use

- Simple role-based applications (RBAC is sufficient)
- Single-owner resources with no sharing (simple model ownership)
- Applications where relationships are one-dimensional (all users have the same access type)

---

## Best Practices

- **Start with RBAC, Add ReBAC Where Needed**: RBAC handles 80% of authorization. ReBAC for shared resources with per-resource relationships.
- **Use a Relationship Store**: Store relationship tuples in a dedicated table or service (not ad-hoc in the resource model).
- **Consistency**: ReBAC must be strongly consistent — a user's relationship change should immediately affect authorization.
- **Evaluation Performance**: ReBAC evaluation can involve graph traversal. Cache relationship results for high-traffic resources.
- **Audit Relationship Changes**: Log all relationship tuple changes (grant, revoke, transfer ownership).

---

## Architecture Guidelines

- Relationship tuple table: `object_type`, `object_id`, `relation`, `subject_type`, `subject_id`
- Intersection with RBAC: users have roles (RBAC), roles have relationships to resources (ReBAC)
- Evaluation: join relationships table to determine access
- Graph traversal: for nested relationships (org → team → resource), iterate through the relationship chain
- External services: Google Zanzibar open-source implementations (SpiceDB, Keto) for large-scale ReBAC

---

## Performance Considerations

- Relationship lookups: indexed queries on relationship tuples — 1-5ms
- Graph traversal: depth N requires N queries — use recursive CTEs or caching
- Relationship caching: cache resolved relationships per user+resource
- Tuple storage: relationship table grows with resource sharing — index aggressively

---

## Security Considerations

- **Consistency**: ReBAC decisions must be based on the latest relationship state. Use database transactions for relationship changes.
- **Relationship Sprawl**: Limit who can create relationships to prevent privilege escalation.
- **Zombie Relationships**: When a resource is deleted, all related tuples must be removed (cascade).
- **Audit Trail**: Every relationship change must be logged — who granted, who received, on which resource.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Modeling relationships in resource table columns | `document.owner_id`, `document.editor_ids` | Not scalable for complex sharing | Use a relationship tuples table |
| Lack of consistency | Eventual consistency for permissions | User sees stale access after relationship change | Use strong consistency (DB transactions) |
| Not cleaning up relationship on resource delete | Forgetting cascade | Orphaned relationship tuples | Delete on resource cascade or scheduled cleanup |
| Graph traversal without caching | Every request traverses the full chain | Slow for deeply nested relationships | Cache resolved relationships |

---

## Anti-Patterns

- **Embedding relationship in JSON columns**: Not queryable; hard to maintain
- **ReBAC without RBAC foundation**: ReBAC handles resource relationships; RBAC handles application access
- **No relationship type vocabulary**: Inconsistent relationship names (owner, admin, manager all mean different things)

---

## Examples

**Relationship tuple model:**
```php
// app/Models/ResourceRelationship.php
class ResourceRelationship extends Model
{
    protected $fillable = [
        'resource_type',   // 'document', 'project', 'team'
        'resource_id',
        'relation',        // 'owner', 'editor', 'viewer'
        'user_id',
    ];

    public function scopeWithRelation($query, string $relation, int $userId)
    {
        return $query->where('relation', $relation)
                     ->where('user_id', $userId);
    }
}
```

**ReBAC policy evaluation:**
```php
// DocumentPolicy
public function edit(User $user, Document $document): bool
{
    // Check if user has an 'editor' or 'owner' relationship with the document
    return ResourceRelationship::where('resource_type', 'document')
        ->where('resource_id', $document->id)
        ->whereIn('relation', ['owner', 'editor'])
        ->where('user_id', $user->id)
        ->exists();
}
```

---

## Related Topics

- ABAC (Attribute-Based Access Control)
- RBAC design
- Multi-tenancy security
- Team-based authorization
- Google Zanzibar model

---

## AI Agent Notes

- ReBAC is maturing in the Laravel ecosystem with no canonical package. Most implementations are custom.
- For large-scale ReBAC, consider external services (SpiceDB, Keto) rather than custom implementations.
- ReBAC complexity is often unnecessary — evaluate carefully before adopting.

---

## Verification

- [ ] ReBAC need justified (shared resources with per-resource relationships)
- [ ] Relationship tuples stored in dedicated table (not embedded in resource)
- [ ] Relationship changes use strong consistency (DB transactions)
- [ ] Resource deletion cascades to relationship tuples
- [ ] Graph traversal cached for frequently accessed resources
- [ ] Relationship vocabulary documented (owner, editor, viewer, etc.)
- [ ] Relationship changes logged for audit
- [ ] RBAC foundation exists for non-relationship authorization
