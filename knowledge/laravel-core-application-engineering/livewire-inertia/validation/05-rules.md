## Rule: Prefer Rule Attributes Over Rules Array

Use #[Rule] PHP 8 attributes on properties in Livewire v3+ instead of the $rules array.

---

## Category

Code Organization

---

## Rule

Declare validation rules using #[Rule('required|min:3')] directly above the property declaration. Reserve the $rules array only for scenarios where rules must be dynamic (computed at runtime).

---

## Reason

The $rules array separates the rule definition from the property it validates. When a property is renamed, the corresponding rule in the $rules array is often missed, silently leaving the old rule in place. #[Rule] attributes are co-located with the property, making the relationship explicit and preventing drift.

---

## Bad Example

`php
class CreatePost extends Component
{
    public string  = '';
    public string  = '';

    protected  = [
        'title' => 'required|min:5',
        'body' => 'required|min:20',
        // If title is renamed, this rule is orphaned
    ];
}
`

---

## Good Example

`php
class CreatePost extends Component
{
    #[Rule('required|min:5')]
    public string  = '';

    #[Rule('required|min:20')]
    public string  = '';
}
`

---

## Exceptions

When rules depend on runtime values (e.g., 'max:' . User::MAX_FILE_SIZE), use $rules as a computed property or use #[Rule] with a rule object that accepts constructor parameters.

---

## Consequences Of Violation

Maintenance risks: property renames orphan validation rules. Readability: rules are distant from the properties they constrain.

---

## Rule: Validate at the Start of Every Action

Call $this->validate() as the first statement in every action that modifies data.

---

## Category

Security

---

## Rule

In any action that creates, updates, or deletes data, call $this->validate() before any business logic. Do not perform queries, authorize users, or manipulate data before validation.

---

## Reason

If validation is called after some business logic has already executed, partial work may be done (records created, emails sent, files uploaded) before the validation error aborts the action. This leaves the application in an inconsistent state with no rollback. Validating first ensures all-or-nothing execution.

---

## Bad Example

`php
public function save(): void
{
     = Post::create(['title' => ->title]); // Created before validation
    ->validate(); // Validation fails — post already exists
}
`

---

## Good Example

`php
public function save(): void
{
    ->validate(); // Fail fast before any side effects
    Post::create(['title' => ->title]);
}
`

---

## Exceptions

Actions that only read data (search, filter, navigate) do not need validation.

---

## Consequences Of Violation

Data integrity risks: partial writes before validation failure. Reliability risks: inconsistent state after validation error.

---

## Rule: Provide Real-Time Validation Feedback

Use alidateOnly() in the updated() hook to validate a single field as the user types.

---

## Category

UX

---

## Rule

Add an updated(string ) method that calls $this->validateOnly() to validate the changed field immediately. This provides real-time error feedback without waiting for form submission.

---

## Reason

Without real-time validation, the user fills out an entire form, clicks submit, and only then sees all errors at once. This is frustrating — the user must correct mistakes they could have fixed immediately. Real-time validation displays field-level errors the moment the field loses focus or changes, giving instant feedback.

---

## Bad Example

`php
class CreatePost extends Component
{
    #[Rule('required|min:5')]
    public string  = '';

    // No updated() hook — validation only on submit
}
`

---

## Good Example

`php
class CreatePost extends Component
{
    #[Rule('required|min:5')]
    public string  = '';

    public function updated(string ): void
    {
        ->validateOnly();
    }
}
`

---

## Exceptions

For fields with expensive validation rules (unique database checks), use .lazy modifier on wire:model to avoid per-keystroke validation. The updated hook still fires on blur/change.

---

## Consequences Of Violation

UX: users see all validation errors only after form submission. Higher form abandonment: users must re-enter data they thought was correct.

---

## Rule: Debounce Real-Time Validation

Use .debounce modifier on wire:model for fields that trigger expensive validation or server calls.

---

## Category

Performance

---

## Rule

For search fields, dependent dropdowns, and any field whose updated() hook performs a database query or API call, add .debounce.300ms (or longer) to wire:model to rate-limit the validation requests.

---

## Reason

Without debounce, a fast typist triggers a validation request on every keystroke — 5-10 requests per second for a single field. Each request executes the updated() hook, which may run validation rules, database queries, or other expensive operations. Debounce aggregates rapid changes into a single request after the user stops typing.

---

## Bad Example

`lade
{{-- No debounce — 10 requests per second while typing --}}
<input wire:model="search" wire:keydown="searchUsers">
`

---

## Good Example

`lade
{{-- 300ms debounce — one request after user pauses typing --}}
<input wire:model.debounce.300ms="search">
`

---

## Exceptions

For simple required/min/max validation rules that do not query the database, no debounce is needed. The alidateOnly() call is cheap enough to run per-keystroke.

---

## Consequences Of Violation

Performance risks: excessive AJAX requests overwhelm the server. Scalability risks: database queries on every keystroke degrade performance for all users.

---

## Rule: Use addError for Cross-Field Validation

Use $this->addError('field', 'message') for validation logic that involves multiple fields or computed conditions.

---

## Category

Framework Usage

---

## Rule

When a validation rule depends on the values of multiple fields (e.g., end_date must be after start_date), validate the condition in the action method or updated() hook and use $this->addError() to attach the error to the relevant field. Do not attempt to express cross-field rules in a single #[Rule] attribute.

---

## Reason

#[Rule] attributes validate a single property in isolation. They have no access to other property values. Cross-field rules require comparison between properties, which is only possible in an imperative validation block or custom rule object.

---

## Bad Example

`php
// Cannot express "end_date after start_date" in a single #[Rule]
#[Rule('after:start_date')] // This does not work — validates against literal 'start_date'
public ?string  = null;
`

---

## Good Example

`php
public function save(): void
{
    ->validate();

    if (->endDate && ->startDate && ->endDate <= ->startDate) {
        ->addError('endDate', 'End date must be after start date.');
        return;
    }

    // Proceed with save
}
`

---

## Exceptions

If cross-field logic is reusable across components, extract it into a custom validation rule object and use #[Rule(new MyCustomRule(...))].

---

## Consequences Of Violation

Reliability risks: cross-field validation gaps. Maintenance risks: validation logic scattered or duplicated.

---

## Rule: Customize Error Messages

Provide user-friendly error messages via #[Rule(..., message: '...')] for important fields.

---

## Category

UX

---

## Rule

Add custom message parameter to #[Rule] attributes when the default Laravel validation message is unclear, too technical, or does not match the application's tone. Use the $messages property for rule-level overrides that apply to multiple fields.

---

## Reason

Default Laravel validation messages are generic and technical (alidation.required, alidation.min.string). Users see messages like "The title field is required" or "The body must be at least 20 characters." Custom messages provide clearer, more helpful guidance: "Please enter a title for your post."

---

## Bad Example

`php
#[Rule('required|min:5')]
public string  = '';
// User sees: "The title field is required"
`

---

## Good Example

`php
#[Rule('required', message: 'Please enter a post title.')]
#[Rule('min:5', message: 'The title must be at least 5 characters.')]
public string  = '';
`

---

## Exceptions

For standard CRUD forms where the default messages are clear enough, custom messages may be omitted. Customize when the default message would confuse users.

---

## Consequences Of Violation

UX: users see technical, framework-generic error messages. Support burden: users need help understanding validation feedback.
