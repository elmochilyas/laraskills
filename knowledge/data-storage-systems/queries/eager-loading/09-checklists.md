# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.3 Eager loading (with, load, loadMissing, nested dot notation)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always eager load for list endpoints applied
- [ ] Narrow eager loading applied
- [ ] Conditional loading with loadMissing applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Blind eager loading**: `Post::with(['comments', 'tags', 'author', 'author.profile'])` on a list endpoint where only the author name is displayed. Over-hydration: loading data that's never used. prevented
- [ ] Not narrowing columns**: `with('comments')` selects all columns from comments table. Use `with('comments:id,post_id,body')` to reduce data transfer. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] All loops accessing relationships use eager loading
- [ ] Query count is 2 (one for parent, one for related) instead of N+1
- [ ] Lazy loading prevention catches accidental N+1 in development

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Always eager load for list endpoints applied
- [ ] Narrow eager loading applied
- [ ] Conditional loading with loadMissing applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Identify all relationships accessed in the loop/view completed
- [ ] Add `with('relationship')` to the initial query: `User::with('posts')->get()` completed
- [ ] For nested relationships: `User::with('posts.comments')->get()` completed
- [ ] For multiple relationships: `User::with(['posts', 'profile'])->get()` completed
- [ ] Constrain eager loads: `User::with(['posts' => fn($q) => $q->where('published', true)])->get()` completed

---

# Performance Checklist

- [ ] Performance: Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subq...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Blind eager loading**: `Post::with(['comments', 'tags', 'author', 'author.profile'])` on a list endpoint where only the author name is displayed. Over-hydration: loading data that's never used. prevented
- [ ] Not narrowing columns**: `with('comments')` selects all columns from comments table. Use `with('comments:id,post_id,body')` to reduce data transfer. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] All relationships accessed in the loop are eager loaded
- [ ] Nested relationships loaded with dot notation
- [ ] Constrained eager loads filter related data
- [ ] Query count verified with Debugbar or DB::listen
- [ ] Lazy loading prevention enabled in non-production
- [ ] All loops accessing relationships use eager loading
- [ ] Query count is 2 (one for parent, one for related) instead of N+1
- [ ] Lazy loading prevention catches accidental N+1 in development
- [ ] No over-eager loading of unused relationships

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Eager-Load Relationships In Loops prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Partial eager loading prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Blind eager loading**: `Post::with(['comments', 'tags', 'author', 'author.profile'])` on a list endpoint where only the author name is displayed. Over-hydration: loading data that's never used. prevented
- [ ] Not narrowing columns**: `with('comments')` selects all columns from comments table. Use `with('comments:id,post_id,body')` to reduce data transfer. prevented

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge

Reference: ./04-standardized-knowledge.md

# Related Rules

Reference: ./05-rules.md

# Related Skills

Reference: ./06-skills.md

# Related Decision Trees

Reference: ./07-decision-trees.md

# Related Anti-Patterns

Reference: ./08-anti-patterns.md
