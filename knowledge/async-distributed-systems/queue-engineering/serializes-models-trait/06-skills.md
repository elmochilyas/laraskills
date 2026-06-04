# Skill: Use SerializesModels to Prevent Stale Data and Payload Bloat

## Purpose
Apply the `SerializesModels` trait correctly, guarding against null models, avoiding loaded relations bloat, and handling pivot data explicitly.

## When To Use
When passing Eloquent models to jobs, queued listeners, or mailables. Applied automatically via `Dispatchable` trait.

## When NOT To Use
When you need exact dispatch-time model state (pass IDs and serialize manually); when jobs have many model properties (each triggers `find()` on wakeup); when pivot attributes must survive serialization.

## Prerequisites
- Job class using `Dispatchable` trait or explicit `SerializesModels`
- Understanding of `__sleep`/`__wakeup` serialization mechanism

## Inputs
- Model(s) passed to job constructor
- Loaded relations on models
- Expected model existence at processing time

## Workflow
1. If using Dispatchable, SerializesModels is already applied — verify it's present
2. Guard against null models in `handle()`: `if (!$this->model) { return; }`
3. Pass model IDs instead of full models for large collections (>100)
4. Avoid passing models with loaded relations — each triggers a `find()` on deserialization
5. Pass pivot data explicitly as separate constructor parameters
6. Don't modify restored models expecting changes to persist on retry

## Validation Checklist
- [ ] `SerializesModels` trait present on the job/listener/mailable
- [ ] Null model guards in `handle()` method
- [ ] No loaded relations on serialized models
- [ ] Collections >100 items passed as IDs, not models
- [ ] Pivot data passed as explicit separate property
- [ ] Model modifications use fresh `find()` in handle(), not restored properties

## Common Failures
- No null check — "call to member function on null" if model deleted
- Loaded relations serialized — N+1 `find()` queries on deserialization
- Pivot data lost — `BelongsToMany->pivot` attributes disappear
- Expecting model changes to persist on retry — payload is immutable

## Decision Points
- Small model with no loaded relations: passing model is OK
- Large collection: always pass array of IDs and re-fetch in handle()
- Pivot data: always pass as explicit separate parameter

## Performance Considerations
- Each model property = one `find()` query on deserialization
- Each collection item = one `find()` — large collections = significant deserialization overhead
- `find()` calls use the model's configured connection

## Security Considerations
- Soft-deleted models cannot be re-fetched — guard against null
- Payload contains model identifier (class + ID), not sensitive model data

## Related Rules
- Rule 1: guard-against-null-models
- Rule 2: avoid-models-with-loaded-relations
- Rule 3: pass-ids-for-large-collections
- Rule 4: dont-modify-restored-models-for-retries
- Rule 5: dont-rely-on-pivot-attributes

## Related Skills
- Pass IDs Not Models to Minimize Payload Size
- Handle Deleted Models in Queued Jobs

## Success Criteria
Job payloads contain lightweight ModelIdentifiers instead of full model graphs, null models are handled gracefully, loaded relations don't cause N+1 queries on deserialization, and pivot data is explicitly managed.
