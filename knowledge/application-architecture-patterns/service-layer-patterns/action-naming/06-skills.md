# Skill: Name Action Classes Using Verb-Noun Conventions

## Purpose
Name action classes strictly with Verb-Noun naming (e.g., `CreateUserAction`), use the Action suffix to prevent model conflicts, group by domain subdirectory, and establish a controlled verb vocabulary for consistency.

## When To Use
- Always for action classes — consistency matters more than the specific convention choice

## When NOT To Use
- Using actions without the Action suffix (acceptable if consistent across the entire codebase)

## Prerequisites
- Team convention documentation for approved verbs
- Domain subdirectories established in `app/Actions/`

## Inputs
- List of business operations for action classes
- Controlled verb vocabulary

## Workflow
1. **Use Verb-Noun naming with Action suffix.** The verb describes the operation; the noun describes the target. Examples: `CreateUserAction`, `ProcessPaymentAction`, `GenerateInvoiceAction`. The Action suffix prevents naming conflicts with models.

2. **Group actions by domain subdirectory.** Use `app/Actions/Billing/`, `app/Actions/User/`, etc. A flat directory with 100+ action files is unmanageable. Domain subdirectories make actions discoverable.

3. **Establish a controlled verb vocabulary.** Document approved verbs: Create, Update, Delete, Process, Send, Generate, Cancel, Approve, Reject, Archive. Use consistently — don't let `Create`/`Make`/`Generate` be used interchangeably.

4. **Use `execute()` or `handle()` consistently as the single public method.** Pick one convention and apply across all actions. Developers should know to call `$action->execute()` without checking the class.

5. **Avoid action names that are too long.** A name like `ProcessAndNotifyPaymentAction` signals the action is doing too much. Split into separate actions orchestrated by a service.

6. **Avoid generic action names.** Every action name must identify the specific business operation. `ProcessAction` (process what?) is never acceptable.

## Validation Checklist
- [ ] All actions use Verb-Noun naming with Action suffix
- [ ] Actions are grouped by domain subdirectory
- [ ] Controlled verb vocabulary is documented and followed
- [ ] Single public method uses `execute()` or `handle()` consistently
- [ ] No action name is unreasonably long (3-4 words max)
- [ ] No generic action names (`ProcessAction`, `HandleAction`)

## Common Failures
- **Generic action names.** `ProcessAction`, `HandleAction` — doesn't communicate what the action does.
- **Inconsistent verb choices.** `MakeOrder`, `CreateOrder`, `GenerateOrder` for the same operation type.
- **Too-specific names.** `CreateUserWithWorkspaceAndSendWelcomeEmailAction` — action doing too much.
- **Action name collision.** Two actions with same name in different domains without suffix distinction.
- **Inconsistent method name.** Some use `execute()`, others `handle()`, others `run()`.

## Decision Points
- **Action suffix vs no suffix?** Use the Action suffix to prevent naming conflicts with model classes. Omit only if consistent across the entire codebase without causing collisions.

## Performance Considerations
- No impact from naming conventions.

## Security Considerations
- No implications.

## Related Rules
- Rule: Verb-Noun Naming with Action Suffix (SLP-08/05-rules.md)
- Rule: Group by Domain Subdirectory (SLP-08/05-rules.md)
- Rule: Controlled Verb Vocabulary (SLP-08/05-rules.md)
- Rule: Avoid Long Action Names (SLP-08/05-rules.md)
- Rule: Use Handle or Execute Consistently (SLP-08/05-rules.md)
- Rule: Avoid Generic Action Names (SLP-08/05-rules.md)

## Related Skills
- Name Service Classes with Business Language (SLP-07/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)
- Design Single-Action Classes (LAP-15/06-skills.md)

## Success Criteria
- All action classes follow Verb-Noun naming with consistent Action suffix.
- Actions are grouped by domain subdirectory for navigability.
- Controlled verb vocabulary prevents inconsistent verb choices.
- Single public method uses the same name (`execute` or `handle`) across all actions.
