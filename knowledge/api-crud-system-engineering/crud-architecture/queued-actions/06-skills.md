# Skill: Implement Queued Actions

## Purpose
Queue action execution for long-running operations by dispatching action classes to Laravel queue with `Bus::dispatch()`, ensuring transactional consistency and failure handling.

## When To Use
- Long-running write operations (file processing, email sending)
- Operations that don't need immediate response
- Background job processing

## When NOT To Use
- Operations requiring synchronous response
- Simple CRUD operations
- Operations that need immediate feedback

## Prerequisites
- Laravel queue system
- Action class pattern

## Inputs
- Long-running operation specifications
- Queue configuration

## Workflow
1. Create action implementing `ShouldQueue`
2. Dispatch action with `Bus::dispatch(new ProcessFileAction($dto))`
3. Set queue connection and name: `public $queue = 'high';`
4. Handle failures with `failed()` method for cleanup
5. Use `afterCommit()` to dispatch only after transaction commits
6. Set retry limits: `public $tries = 3;`
7. Implement rate limiting for queue jobs: `middleware()` method
8. Return 202 Accepted from controller for queued operations
9. Include job ID or status URL in response
10. Monitor queue health for failed/retried jobs

## Validation Checklist
- [ ] Action implements ShouldQueue
- [ ] Dispatched via Bus::dispatch()
- [ ] Queue connection and name configured
- [ ] failed() method for failure cleanup
- [ ] afterCommit() for transactional dispatch
- [ ] Retry limits set
- [ ] 202 Accepted returned from controller
- [ ] Queue monitoring in place

## Related Skills
- Action Class Design
- Transactional Actions
- Request Lifecycle Complete Flow
