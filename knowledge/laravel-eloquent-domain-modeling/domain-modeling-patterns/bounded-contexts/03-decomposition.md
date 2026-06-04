# Bounded Contexts — Decomposition

## Prime Directive
Organize a Laravel application into bounded contexts with clear ownership, consistent ubiquitous language per context, and well-defined communication patterns between contexts.

## 1. Problem Space Decomposition

### 1.1 Context Identification
- **Concern:** Finding the right boundaries between contexts.
- **Sub-concerns:**
  1. Subdomain analysis: which parts of the business have different language/priorities
  2. Team structure: aligning contexts with team ownership
  3. Change frequency: grouping code that changes for the same reasons
  4. Model consistency: ensuring models within a context are internally consistent

### 1.2 Inter-Context Communication
- **Concern:** How contexts exchange information.
- **Sub-concerns:**
  1. Synchronous vs asynchronous communication
  2. Shared data ownership (which context owns a given concept)
  3. Translation/mapping between context languages
  4. Transactional boundaries across contexts

### 1.3 Context Mapping
- **Concern:** Documenting relationships between contexts.
- **Sub-concerns:**
  1. Partnership vs shared kernel vs customer-supplier vs conformist patterns
  2. Anti-corruption layer design
  3. Open-host service / published language for cross-context APIs

### 1.4 Code Organization
- **Concern:** Physical layout of context code in the Laravel app.
- **Sub-concerns:**
  1. Directory structure per context
  2. Namespace conventions
  3. Autoloading and class resolution
  4. Shared infrastructure vs per-context infrastructure

## 2. Solution Space Decomposition

### 2.1 Context Structure
- **Decision:** Organization per context.
- **Implementation slices:**
  1. `app/Contexts/{ContextName}/` — modules in main app
  2. `packages/{vendor}/{context-name}/` — separate packages
  3. `app/Services/{ContextName}/` — service-layer grouping

### 2.2 Intra-Context Architecture
- **Decision:** How each context is internally structured.
- **Implementation slices:**
  1. Eloquent models + domain methods (Active Record)
  2. Eloquent models + actions/services (action-oriented)
  3. Eloquent models + repositories + DTOs (repository pattern)

### 2.3 Inter-Context Communication
- **Decision:** Mechanism for cross-context interaction.
- **Implementation slices:**
  1. Laravel events (same process, decoupled via listeners)
  2. Queue jobs (async, processed by other context)
  3. API calls (microservice-style)
  4. Direct method calls through an ACL class

### 2.4 Context Map Documentation
- **Decision:** How to maintain the context map.
- **Implementation slices:**
  1. Markdown doc in `docs/context-map.md`
  2. Diagrams via PlantUML or Mermaid
  3. Automated contract tests verifying inter-context interfaces

## 3. Integration Points

| Component | Interaction |
|-----------|-------------|
| Context A Models | Owned by Context A; never directly used in Context B |
| Anti-Corruption Layer | Translates Context A concepts to Context B concepts |
| Shared Kernel | Minimal shared code (interfaces, value objects) |
| Domain Events | Published by one context, subscribed by another |
| Queue Workers | Process cross-context jobs |
| API Gateway | Routes requests to appropriate context controllers |
| Database | May be shared (with schema per context) or separate per context |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization