# Decomposition: Organizing by feature/vertical slice within app/

## Topic Overview

Feature-based organization (also called vertical slicing) groups code by business feature rather than technical layer. Instead of `app/Http/Controllers/PaymentController.php` and `app/Services/PaymentService.php` and `app/Models/Payment.php` spread across three directories, a feature-based approach places all Payment-related code in a `app/Features/Payment/` directory containing the controller, service, model, events, and jobs that belong to that feature.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
COS-05-feature-based-organization/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Organizing by feature/vertical slice within app/
- **Purpose:** Feature-based organization (also called vertical slicing) groups code by business feature rather than technical layer. Instead of `app/Http/Controllers/PaymentController.php` and `app/Services/PaymentService.php` and `app/Models/Payment.php` spread across three directories, a feature-based approach places all Payment-related code in a `app/Features/Payment/` directory containing the controller, service, model, events, and jobs that belong to that feature.
- **Difficulty:** Intermediate
- **Dependencies:** COS-01 Default structure

## Dependency Graph

This KU depends on: COS-01 Default structure
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** A "feature" is a cohesive business capability. Common feature examples: UserRegistration, Checkout, InvoiceGeneration, SubscriptionManagement. Each feature gets its own directory containing all the cl...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent architectural patterns covered in related KUs.

## Future Expansion Opportunities

None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization