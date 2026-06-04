# PSR-4 Autoloading for Multi-Layer Projects — Decomposition

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-05-psr4-multi-layer
- **Last Updated:** 2026-06-04

---

## Topic Overview
PSR-4 autoloading for multi-layer projects covers the configuration, mechanics, and architectural implications of using multiple PSR-4 namespace roots to enforce layer boundaries in Laravel applications following Clean Architecture, Hexagonal, or layered patterns.

---

## Decomposition Strategy
This topic splits along two axes: (1) configuration mechanics — how to set up PSR-4 roots in `composer.json` and the implications of each approach — and (2) architectural enforcement — how namespace isolation enables dependency rule verification through imports and static analysis. The decomposition avoids overlapping with generic Composer autoloading topics by focusing specifically on multi-root configurations for layered architecture.

---

## Proposed Folder Structure
```
02-layered-architecture-patterns/LAP-05-psr4-multi-layer/
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
|------|---------|------------|--------------|
| PSR-4 Multi-Layer | Configure multiple namespace roots for layered architecture enforcement | Intermediate | PHP Namespaces, Composer autoloading, Laravel directory structure |
| Multi-Root Configuration | Setting up non-overlapping PSR-4 roots per layer | Intermediate | PSR-4 Multi-Layer |
| Optimized Autoloading | Production classmap generation and deployment integration | Intermediate | Multi-Root Configuration |
| Namespace-Based Enforcement | Using import visibility to detect layer violations | Advanced | Dependency Rule, Architecture Testing |

---

## Dependency Graph
```
PHP Namespaces → PSR-4 Autoloading → Multi-Root Configuration
                                     → Optimized Autoloader → Deployment
                                     → Namespace Enforcement → Architecture Tests
```

---

## Boundary Analysis
**In scope**: PSR-4 configuration for layered architectures, multi-root setup, composer.json autoload section, namespace-based dependency enforcement, optimized autoloader for production/Octane, common configuration mistakes (trailing backslash, overlapping roots).

**Out of scope**: Generic Composer autoloading fundamentals, classmap vs PSR-4 comparison, package development PSR-4, Composer plugin development, autoload-dev section details, PHP namespace syntax basics.

---

## Future Expansion Opportunities
- PSR-4 root discovery patterns for modular monoliths
- Automated composer.json validation for layer root compliance
- CI integration for namespace boundary verification
- Octane-specific autoloader optimization patterns
