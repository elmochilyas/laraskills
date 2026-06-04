## Rule: Mark All Sensitive Properties as Volatile

Apply #[Volatile] to every public property that holds sensitive data — passwords, tokens, API keys, PII.

---

## Category

Security

---

## Rule

Audit every public property in every Livewire component. Apply #[Volatile] to any property whose value must never appear in the HTML source, network response, or JavaScript console. This includes payment tokens, one-time passwords, intermediate raw data containing PII, and any secrets.

---

## Reason

Every public property that is not marked #[Volatile] is serialized into the Livewire component snapshot and sent to the frontend with every response. This snapshot is visible in the HTML source and network tab. Without explicit opt-out, sensitive data is silently exposed.

---

## Bad Example

`php
class ProcessPayment extends Component
{
    public string  = ''; // Sent to frontend — exposed
    public int  = 0;
}
`

---

## Good Example

`php
class ProcessPayment extends Component
{
    #[Volatile]
    public string  = ''; // Never serialized — secure
    public int  = 0;
}
`

---

## Exceptions

If a property holds user input that the user themselves provided (e.g., a password field in a registration form), the password must still be marked volatile. Never keep plaintext passwords in normal properties.

---

## Consequences Of Violation

Security risks: sensitive data exposed in client-visible response. Compliance risks: PII and secrets visible in violation of data protection requirements.

---

## Rule: Use Volatile for Intermediate Computation Results

Mark large temporary data structures as #[Volatile] to reduce snapshot size.

---

## Category

Performance

---

## Rule

If a public property holds intermediate computation results that are used only within a single request cycle (processed arrays, transformed data, temporary collections), mark it #[Volatile]. Keep only the final output that the template needs as a normal property.

---

## Reason

Large intermediate data arrays (processed reports, merged datasets, temporary collections) can be hundreds of kilobytes. Without #[Volatile], this data is serialized and sent to the frontend on every re-render, even though the client never uses it. Marking it volatile eliminates this unnecessary payload.

---

## Bad Example

`php
class ReportViewer extends Component
{
    public array  = [];
    public array  = []; // Large array — sent to frontend
}
`

---

## Good Example

`php
class ReportViewer extends Component
{
    public array  = [];
    #[Volatile]
    public array  = []; // Large array — not serialized
}
`

---

## Exceptions

If the intermediate data must persist across multiple component interactions (not just a single request cycle), do not mark it volatile. Use a normal property instead.

---

## Consequences Of Violation

Performance risks: large unnecessary data in every snapshot. Bandwidth waste: intermediate data transferred despite being unused on client.

---

## Rule: Never Rely on Volatile Persistence

Do not assume a volatile property's value will be available in a subsequent request. Set it explicitly in each action method that needs it.

---

## Category

Design

---

## Rule

Always set volatile properties within the action method that uses them. Do not rely on values set in mount() or a previous action persisting. If a value is needed across multiple actions, use a normal property or fetch it fresh each time.

---

## Reason

Volatile properties are reset to their default value after every request in the dehydrate phase. A value set in mount() is gone after the first render. An action that sets a volatile value cannot expect that value to survive into the next request.

---

## Bad Example

`php
class ProcessPayment extends Component
{
    #[Volatile]
    public string  = '';

    public function mount(): void
    {
        ->paymentToken = PaymentGateway::generateToken();
        // Reset after this render — token lost
    }

    public function process(): void
    {
        // ->paymentToken is '' — not the generated token
    }
}
`

---

## Good Example

`php
class ProcessPayment extends Component
{
    #[Volatile]
    public string  = '';

    public function process(): void
    {
        ->paymentToken = PaymentGateway::generateToken();
        // Use within this request cycle, then it resets
    }
}
`

---

## Exceptions

None. Volatile properties are intentionally ephemeral. If you need persistence, use a normal property (and accept that it appears in the snapshot).

---

## Consequences Of Violation

Reliability risks: volatile property values silently reset between requests, causing logic errors. Debugging difficulty: hard to trace why a property that was set is now empty.

---

## Rule: Keep UI State in Normal Properties

Use normal (non-volatile) properties for all UI state that must persist across re-renders.

---

## Category

Design

---

## Rule

Store form input values, toggle states, selected item IDs, and other UI-persistent state in public properties without #[Volatile]. Reserve #[Volatile] exclusively for sensitive or intermediate data that must NOT persist.

---

## Reason

Volatile properties reset after every request. If a property like $search = '' is marked volatile, the search text disappears every time the user triggers any action. The form field empties, selections are lost, and the component becomes unusable for any interaction that requires state preservation.

---

## Bad Example

`php
class SearchUsers extends Component
{
    #[Volatile]
    public string  = ''; // Resets after every action — search breaks
}
`

---

## Good Example

`php
class SearchUsers extends Component
{
    public string  = ''; // Persists across requests — correct
}
`

---

## Exceptions

If a UI value is intentionally one-shot (e.g., a confirmation dialog's text that should reset after confirmation), it may be volatile. Document the intentional reset behavior.

---

## Consequences Of Violation

UX: form inputs and UI state reset on every interaction. Reliability: component becomes unusable for multi-step workflows.

---

## Rule: Set Volatile Properties in Action Methods

Initialize volatile properties inside action methods, not only in mount().

---

## Category

Framework Usage

---

## Rule

Move volatile property initialization from mount() into the action method that first uses the value. If the value is needed in the template, compute it inside the action and use it during that request's render cycle.

---

## Reason

mount() runs only once during the component's lifetime — on initial render. A volatile property set in mount() is available for that initial render but is reset to its default before the next request. On subsequent AJAX updates (actions, property updates), the volatile property has its default value, not the value from mount().

---

## Bad Example

`php
class ProcessPayment extends Component
{
    #[Volatile]
    public string  = '';

    public function mount(): void
    {
        ->tempToken = TokenService::generate();
        // Works on initial render, gone on next action
    }
}
`

---

## Good Example

`php
class ProcessPayment extends Component
{
    #[Volatile]
    public string  = '';

    public function startPayment(): void
    {
        ->tempToken = TokenService::generate();
        // Generated when user clicks "Pay", used in this request
    }
}
`

---

## Exceptions

If the volatile property is only used during the initial render and never in subsequent actions, setting it in mount() is correct. This is rare.

---

## Consequences Of Violation

Reliability risks: volatile properties set in mount() are available on initial render but reset on subsequent requests. Developers expect them to persist, leading to logic errors.
