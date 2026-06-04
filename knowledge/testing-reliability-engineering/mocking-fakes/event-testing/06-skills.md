# Skill: Test Events in Isolation

## Purpose
Verify that events are dispatched with the correct payload and properly handled by their listeners without triggering real side effects like email sending, queue processing, or external API calls.

## When To Use
- When testing that a controller or service dispatches the correct event
- When testing that event listeners handle the payload correctly
- When testing event-driven workflows that trigger multiple side effects
- When you need to prevent real side effects from firing during tests

## When NOT To Use
- For testing real event broadcasting (use Dusk or an E2E test)
- When the event's only purpose is to delegate to a listener that could be tested directly
- When you need to verify the entire event-listener chain integrates with the framework

## Prerequisites
- Event class definition and its constructor parameters
- Listener classes that handle the event
- Understanding of `Event::fake()` and `assertDispatched()` methods

## Inputs
- Event class name and expected constructor arguments
- Number of times the event should be dispatched
- Specific payload data that should be passed to the event

## Workflow
1. Call `Event::fake()` before the action to prevent real listeners from executing
2. Optionally fake only specific events: `Event::fake([InvoicePaid::class])`
3. Execute the action that should dispatch the event
4. Assert the event was dispatched: `Event::assertDispatched(InvoicePaid::class)`
5. Assert the event payload: `Event::assertDispatched(InvoicePaid::class, fn ($event) => $event->invoice->id === $invoice->id)`
6. Assert dispatch count: `Event::assertDispatchedTimes(InvoicePaid::class, 1)`
7. For events that should not fire: `Event::assertNotDispatched(CancelSubscription::class)`
8. Chain assertions for multiple events dispatched by the same action

## Validation Checklist
- [ ] `Event::fake()` is called before the action
- [ ] Event dispatch is asserted with the correct class
- [ ] Event payload is verified with callback assertions
- [ ] Dispatch count is asserted when relevant
- [ ] Events that should not fire are verified with `assertNotDispatched`
- [ ] Real listeners are not executing during the test

## Common Failures
- Forgetting to call `Event::fake()` — real listeners execute, causing side effects
- Asserting event was dispatched without verifying payload — wrong data may be passed
- Using `Event::assertDispatched()` without checking the count — event may fire multiple times
- Testing implementation details (specific queue, channel, or connection) instead of dispatch behavior
- Not testing the listener in isolation — the fake prevents listener execution

## Decision Points
- Fake all events vs specific events — fake all for broad safety, specific for targeted testing
- `assertDispatched` vs `assertDispatchedTimes` — basic for existence, Times for count verification
- Payload callback vs raw assertion — callback for complex payloads, raw for simple existence

## Performance Considerations
- `Event::fake()` has negligible overhead (<1ms)
- Faked events bypass listener execution, making tests significantly faster
- Event dispatch assertions are O(1) lookups in the faked event storage

## Security Considerations
- Security-critical events (account locked, password changed) must be tested for correct dispatch
- Ensure events containing sensitive user data are dispatched with proper payload assertions
- Event listeners that perform security actions (logout, revoke tokens) should have separate tests

## Related Rules
- [Rule: Fake Events Before the Action](./05-rules.md)
- [Rule: Verify Payload with Callbacks](./05-rules.md)
- [Rule: Test Critical Events Individually](./05-rules.md)

## Related Skills
- Laravel Fakes
- Queue Job Testing
- Mail Notification Testing

## Success Criteria
- [ ] Every event dispatch from a service/controller has a corresponding test
- [ ] Event payloads are verified with callback assertions (not just existence)
- [ ] Listeners are tested independently for their handling logic
- [ ] Events that should not fire in certain scenarios are verified with `assertNotDispatched`
