# Skill: Implement Relationship-Based Access Control (ReBAC) for Graph-Like Permissions

## Purpose
Design ReBAC authorization where access is determined by relationships between users and resources (e.g., "user can edit document because they are a member of the workspace that owns the document").

## When To Use
- Collaborative applications with nested resource hierarchies (workspaces → projects → documents)
- Social networks where access depends on relationships (friends, followers, group members)
- Multi-organization platforms where access propagates through organization → team → resource
- Google Zanzibar-style authorization (global consistency, relationship tuples)

## When NOT To Use
- Simple role-based or permission-based access (RBAC is simpler)
- Resources owned directly by users (use Policies with ownership checks)
- Applications with flat access control structures

## Prerequisites
- Understanding of user-resource relationship graph
- Policy system or ReBAC library (e.g., Appwrite, Ory Keto, custom implementation)
- Defined relationship types (owner, member, viewer, editor)

## Workflow
1. Define relationship types between users and resources (owner, member, collaborator)
2. Define resource hierarchy (workspace → project → document)
3. Implement relationship inheritance (workspace member inherits access to all projects)
4. Create policy methods that check relationship paths
5. Implement relationship tuple storage (subject, relation, object)
6. Write tests for each relationship chain and inheritance path
7. Handle relationship changes: revoke inherited access when parent relationship changes

## Validation Checklist
- [ ] Relationship types defined and documented
- [ ] Resource hierarchy mapped (parent-child inheritance)
- [ ] Relationship inheritance tested (parent grant propagates to children)
- [ ] Relationship revocation tested (parent revoke cascades correctly)
- [ ] Edge cases: circular relationships, multiple relationship paths
