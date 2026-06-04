# Anti-Patterns: Vertical Slice Architecture / Shared Kernel

## 1. Shared Kernel With 200+ Contracts

Every feature adds interfaces to the shared kernel "just in case," creating a bloated kernel with 200+ contracts, most used by a single feature.

Every item in the shared kernel is a backward-compatibility commitment. A bloated kernel creates cognitive overhead, makes the kernel hard to navigate, and turns it into a dumping ground. Only add contracts, DTOs, and events to `app/Kernel/` when they are actually consumed by multiple features. Audit the shared kernel every quarter and remove single-consumer contracts.

## 2. Feature Extraction Freeze

Stable features that have been candidates for extraction for years remain in the monorepo because nobody wants to figure out the process.

Features never get extracted, causing 500k+ LOC monorepos with 45-minute deploys. Without a documented extraction process, each extraction is a unique, error-prone manual procedure. Establish a feature lifecycle (new → stable → extracted) and maintain a documented process for extracting a feature into a standalone package. Set a size threshold for extraction.

## 3. Circular Domain Group Dependencies

Financial depends on Content, and Content depends on Financial — creating an unbreakable cycle.

Circular dependencies make features untestable in isolation, prevent feature extraction, and create tight coupling. Define static analysis rules (PHPStan/Psalm) that enforce dependency direction. Only `app/Kernel/` can be imported from anywhere. Outer rings depend on inner rings. Detect and fix cycles immediately.

## 4. Premature Sub-Feature Splitting

Creating sub-features for a 5-file feature, adding navigation overhead without benefit.

Sub-features add an additional directory level that should be earned by complexity. At 5 files, a flat feature structure is simpler and easier to navigate. Monitor file counts per feature and only evaluate splitting at approximately 20 files. The 20-file threshold is a heuristic that balances cohesion with organizational overhead.

## 5. Inconsistent Sub-Feature Conventions

`Billing/Invoicing/` has a service provider, but `Billing/Payments/` doesn't — routes are loaded from the parent provider instead.

Inconsistent conventions create confusion. Developers must check each sub-feature individually to understand its structure. All sub-features within a domain group must follow the same internal structure conventions (Controllers/, Models/, Services/, Providers/). Consistency makes any sub-feature predictable.

## 6. No Team Ownership Via CODEOWNERS

Changes to `app/Features/Financial/` are reviewed by whoever is available, regardless of domain knowledge.

Without explicit ownership, no one feels responsible for a domain group's quality. Orphaned features accumulate bugs and design debt. Use GitHub CODEOWNERS to map each domain group directory to a responsible team. Require the owning team's approval for all changes within that domain.

## 7. Shared Kernel Not Independently Versioned

The shared kernel lives in `app/Kernel/` with no versioning, so any change to a contract breaks all consuming features simultaneously.

When multiple domain groups depend on the shared kernel, manage it as a separate Composer package with its own versioning and release cycle. Independent versioning allows stable kernel releases and predictable upgrades. Domain groups cannot evolve independently if every kernel change breaks them.
