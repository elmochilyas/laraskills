## Rule 1: Use the same term everywhere in code, database, events, and UI for the same domain concept
---
## Category
Architecture
---
## Rule
A domain concept must have exactly one term that is used consistently across all technical artifacts: class names, method names, table names, event names, API endpoints, and user-facing labels.
---
## Reason
Inconsistent terminology creates confusion, bugs from misunderstood concepts, and makes it hard for domain experts to validate the system.
---
## Bad Example
```
Concept: a financial transaction
Code: FinancialTransaction
DB: fin_txns
Events: money_moved
UI: "Finance Entry"
Domain expert: "What's a 'finance entry'? I said 'transaction'."
```
---
## Good Example
```
Concept: Transaction (agreed with domain experts)
Code: Transaction
DB: transactions
Events: TransactionInitiated, TransactionCompleted
UI: "Transaction"
```
---
## Exceptions
When the same concept has legitimately different meanings in different bounded contexts (e.g., "Order" in Sales vs. "Order" in Logistics).
---
## Consequences Of Violation
Confusion, bugs, validation failure with domain experts.
---
## Rule 2: Evolve the language with domain experts—it belongs to them, not developers
---
## Category
Architecture
---
## Rule
Hold regular (bi-weekly) Ubiquitous Language workshops with domain experts to validate terms, resolve ambiguities, and evolve the language as understanding deepens.
---
## Reason
The Ubiquitous Language must reflect the domain experts' mental model; developers changing terminology unilaterally breaks the shared understanding.
---
## Bad Example
```
Developers rename "Loan" to "CreditProduct" for code convenience.
Domain expert: "What's a credit product? We issue loans."
```
---
## Good Example
```
Workshop: "Is 'Loan' still the right term, or should we use 'CreditFacility'?"
Domain expert: "Actually, 'Loan' is internal; 'CreditFacility' is the legal term."
Team updates code to CreditFacility.
```
---
## Exceptions
When the domain is well-established (e.g., accounting) and the terms are already standardized by regulation.
---
## Consequences Of Violation
Code diverges from domain, expert validation becomes impossible.
---
## Rule 3: When a term is overloaded, qualify it with the bounded context
---
## Category
Architecture
---
## Rule
If the same word has different meanings in different contexts, prefix it with the context name: `SalesOrder`, `ShippingOrder`, `KitchenOrder`.
---
## Reason
Unqualified overloaded terms create confusion; qualified terms make the context explicit without redefining the word.
---
## Bad Example
```
// "Order" used in Sales, Billing, and Shipping contexts — different meanings
```
---
## Good Example
```
SalesOrder: Contains items customer wants to purchase
BillingOrder: Contains payment terms and total
ShippingOrder: Contains delivery address and package details
```
---
## Exceptions
When the bounded context is so clearly separated in code (namespaces, modules) that the context prefix is redundant.
---
## Consequences Of Violation
Ambiguity, wrong assumptions about what "Order" means in a given context.
---
## Rule 4: Rename code when the language changes—do not keep old code names
---
## Category
Architecture
---
## Rule
When the Ubiquitous Language evolves to a better term, rename classes, methods, database columns, and event names to match. Do not add comments explaining the old name.
---
## Reason
Stale code names keep the old (incorrect) terminology alive, perpetuating the confusion the language change was meant to resolve.
---
## Bad Example
```
// Class still named "Loan" even though language changed to "CreditFacility"
// Comment: "Formerly known as Loan"
```
---
## Good Example
```
class CreditFacility { /* renamed */ }
// All references updated via IDE refactoring
```
---
## Exceptions
When renaming would break a published API contract (use aliases and deprecation period).
---
## Consequences Of Violation
Outdated terminology in code, cognitive dissonance, language drift.
---
## Rule 5: Use the language in conversations and documentation—not just in code
---
## Category
Architecture
---
## Rule
Use the Ubiquitous Language in all team communication: Slack, tickets, documentation, meeting notes, whiteboard sessions. Call out and correct deviations.
---
## Reason
If the language is only in code but not in conversations, it's not "ubiquitous"—it's just a code convention.
---
## Bad Example
```
Meeting: "Yeah, so the user clicks the thing and it creates a record in the database."
No domain terms used. Domain expert feels alienated.
```
---
## Good Example
```
Meeting: "The Loan Officer submits the CreditFacility application, which creates a PendingApplication."
Domain terms used. Domain expert can correct or confirm.
```
---
## Exceptions
Casual internal developer conversations where brevity matters (but still prefer domain terms).
---
## Consequences Of Violation
Language stays artificial, domain experts excluded, code-language gap persists.
