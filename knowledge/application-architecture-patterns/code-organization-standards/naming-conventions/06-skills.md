# Skill: Apply Naming Conventions for Classes and Files

## Purpose
Establish and enforce consistent naming conventions across the codebase — Verb-Noun for actions, past-tense for events, {Domain}Service for services, and role-specific suffixes — making code organization and intent clear from filenames alone.

## When To Use
- Always — naming conventions should be established in every Laravel project
- Especially important when team grows beyond 3 developers
- Critical when using action classes, service classes, or domain-based organization

## When NOT To Use
- Prototypes or throwaway projects
- When conventions are so rigid they slow development without clear benefit

## Prerequisites
- Understanding of the project's architectural patterns (actions, services, events, DTOs)
- Team agreement on naming standards
- Documented convention reference

## Inputs
- List of existing class name patterns in the codebase
- Project's architectural pattern choices
- Team's agreed-upon naming standards

## Workflow
1. **Use Verb-Noun pattern for action classes.** Name actions as `CreateInvoice`, `ProcessRefund`, `SendWelcomeEmail`. The name communicates both the operation (Verb) and the subject (Noun). Avoid suffixes like `Action` — they're redundant.

2. **Use past-tense for event classes.** Name events as `UserRegistered`, `OrderShipped`, `PaymentFailed`. Past tense communicates that the event describes something that already happened, distinguishing events from commands.

3. **Use {Domain}Service for service names.** Name services with a domain or entity qualifier: `PaymentService`, `UserService`, `BillingService`. Never name a service just `Service`.

4. **Avoid generic suffixes.** Prohibit `Manager`, `Helper`, `Handler`, `Processor` as suffixes. These don't communicate architectural role. Use `Service`, `Action`, `UseCase`, `Normalizer`, `Gateway` instead.

5. **Use singular for services and models, plural for controllers.** `UserService` (singular), `Invoice` (singular), `InvoicesController` (plural). This follows Laravel and PHP community conventions.

6. **Use Noun+Data or Noun+Dto for DTOs.** Name DTOs `UserData`, `CreateInvoiceDto`, `RegistrationData`. The suffix immediately communicates "this is a data container, not a domain entity."

7. **Ensure filename matches class name exactly.** `CreateInvoice.php` contains `class CreateInvoice`. Including case. PSR-4 resolves class names to file names; mismatches cause autoload failures.

8. **Document naming conventions in team documentation.** Write down all conventions in CONTRIBUTING.md — class name patterns, suffix rules, and examples. Without documentation, naming is tribal knowledge.

## Validation Checklist
- [ ] All class names consistently use role-indicating suffixes
- [ ] Naming conventions are documented in project README or CONTRIBUTING.md
- [ ] No `Manager`, `Helper`, `Handler`, `Processor` classes
- [ ] Action classes follow Verb-Noun consistently
- [ ] Event classes use past-tense naming
- [ ] DTOs use Noun+Data or Noun+Dto suffix
- [ ] Every filename matches its class name exactly

## Common Failures
- **Inconsistent suffix usage:** `UserCreation`, `CreateUserAction`, `UserCreateService` used interchangeably. Pick one pattern and apply universally.
- **Generic naming:** `Manager`, `Helper`, `Handler` as suffixes. These obscure class responsibility.
- **Name drift:** Class named `UserService` now handles invoices and payments. Split into appropriate classes or rename.
- **Plural vs singular inconsistency:** `UserService` vs `UsersService`. Services are singular (one service per domain entity).

## Decision Points
- **Action suffix convention?** Use bare Verb-Noun (`CreateInvoice`) without `Action` suffix. The directory (Actions/) communicates the role.
- **DTO suffix: `Data` vs `Dto`?** Choose one (`UserData` or `UserDto`) and apply consistently across the codebase. `Data` is more readable; `Dto` is more explicit.

## Performance Considerations
- Long file paths can cause Windows MAX_PATH issues (260 characters). Deeply nested domains with long class names can approach this limit.
- No runtime performance impact from naming conventions.

## Security Considerations
- Naming does not affect security. However, clear naming helps audit code for security-sensitive operations.

## Related Rules
- Rule: Use Verb-Noun Pattern for Action Classes (COS-08/05-rules.md)
- Rule: Use Past-Tense for Event Classes (COS-08/05-rules.md)
- Rule: Use {Domain}Service for Service Names (COS-08/05-rules.md)
- Rule: Never Use `Manager`, `Helper`, `Handler`, or `Processor` as Suffixes (COS-08/05-rules.md)
- Rule: Use Singular for Service and Model Names (COS-08/05-rules.md)
- Rule: Use Noun+Data or Noun+Dto for Data Transfer Objects (COS-08/05-rules.md)
- Rule: Ensure File Name Matches Class Name Exactly (COS-08/05-rules.md)
- Rule: Document Naming Conventions in Team Documentation (COS-08/05-rules.md)

## Related Skills
- Apply Namespace Conventions Aligned with Directory Structure (COS-04/06-skills.md)
- Design a Service Class (SLP-01/06-skills.md)
- Create Action Classes for Business Operations (SLP-02/06-skills.md)

## Success Criteria
- Class names communicate architectural role without opening the file.
- Naming conventions are documented and consistently applied.
- No generic suffixes (`Manager`, `Helper`, etc.) exist.
- Filenames match class names exactly — no autoload errors.
