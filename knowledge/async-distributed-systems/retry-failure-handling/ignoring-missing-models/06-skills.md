# Skill: Use `ShouldDeleteMissing` for Jobs Referencing Deleted Models

## Purpose
Apply `ShouldDeleteMissing` or `deleteWhenMissingModels` to auto-delete jobs whose serialized models no longer exist, preventing futile retries on a permanent condition.

## When To Use
Jobs processing user-generated content (posts, comments, orders) where model deletion is expected before processing; high-volume jobs where missing-model failures would flood `failed_jobs`.

## When NOT To Use
Missing model is always a bug that should alert immediately — let the job fail; jobs with multiple serialized models (one missing deletes entire job, partial work lost).

## Prerequisites
- Job uses `SerializesModels` trait
- Constructor accepts Eloquent models as parameters

## Inputs
- Job class with model constructor parameters
- Awareness of which models may be deleted before job executes

## Workflow
1. Import `ShouldDeleteMissing` trait on the job class: `use ShouldDeleteMissing;`
2. Or set `public $deleteWhenMissingModels = true;`
3. Log in `failed()` when the trait activates so missing-model trends are visible
4. Add null guards in `handle()` even with the trait — it only covers deserialization
5. For jobs re-fetching models in `handle()`, use `Model::find()` not `findOrFail()`
6. Check if the missing model is expected (user deletes post) or a bug (data race)
7. Consider alerting on high missing-model rates

## Validation Checklist
- [ ] `ShouldDeleteMissing` trait applied where model deletion is expected
- [ ] Logging in `failed()` when model is missing
- [ ] Null guards in `handle()` for re-fetched data
- [ ] `findOrFail()` not used for models that may be deleted
- [ ] High missing-model rate triggers alert
- [ ] Multiple-model jobs reviewed individually for trait applicability

## Common Failures
- Not using `ShouldDeleteMissing` for expected deletions — retries wasted
- No logging when trait activates — missing-model pattern hidden
- Assuming trait covers re-fetched data — `handle()` still crashes
- Trait on multi-model jobs — one missing model deletes entire job

## Decision Points
- Expected deletion path: use `ShouldDeleteMissing`
- Missing model = bug: let job fail, alert immediately
- High-volume + expected deletions: always apply the trait

## Related Rules
- Rule 1: use-shoulddeletemissing-for-expected-deletions
- Rule 2: log-when-shoulddeletemissing-activates
- Rule 3: add-null-guards-with-shoulddeletemissing

## Related Skills
- Implement `failed()` Method for Job-Specific Cleanup
- Configure `failed_jobs` Storage for Production
- Schedule Pruning of Failed Jobs

## Success Criteria
Jobs with expected-model-deletion paths use `ShouldDeleteMissing`, logging tracks missing-model rates, null guards cover `handle()` re-fetches, and genuine bugs still produce alerts.
