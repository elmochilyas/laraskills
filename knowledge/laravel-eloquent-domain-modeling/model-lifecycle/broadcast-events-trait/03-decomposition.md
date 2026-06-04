# Broadcast Events Trait — Decomposition

## Implementation Tasks

### 1. Apply `BroadcastsEvents` to models needing real-time updates
- Add the trait to models that drive real-time UI features:
  ```php
  use Illuminate\Database\Eloquent\BroadcastsEvents;
  
  class Post extends Model
  {
      use BroadcastsEvents;
  }
  ```

### 2. Customize broadcast channel for each model
- Override `broadcastChannel()` to define meaningful channel names:
  ```php
  public function broadcastChannel(): string
  {
      return 'team.'.$this->team_id.'.posts';
  }
  ```

### 3. Filter broadcast payload
- Override `broadcastWith()` to exclude sensitive data:
  ```php
  public function broadcastWith(): array
  {
      return [
          'id' => $this->id,
          'title' => $this->title,
          'excerpt' => Str::limit($this->body, 100),
          'updated_at' => $this->updated_at,
      ];
  }
  ```

### 4. Choose between `BroadcastsEvents` and `BroadcastsEventsAfterCommit`
- Use `BroadcastsEventsAfterCommit` for transactional consistency
- Use `BroadcastsEvents` (immediate) only for idempotent, non-critical updates
- Document the choice per model

### 5. Set up channel authorization
- Define authorization rules in `routes/channels.php`:
  ```php
  Broadcast::channel('team.{teamId}.posts', function ($user, $teamId) {
      return $user->teams()->where('id', $teamId)->exists();
  });
  ```

### 6. Write tests for broadcast behavior
- Test that broadcast events fire on `created`, `updated`, `deleted`
- Test that broadcast events fire on `restored` and `trashed` (if applicable)
- Test that broadcast payload matches `broadcastWith()` customization
- Test that `BroadcastsEventsAfterCommit` defers broadcasts until after transaction commit

### 7. Implement broadcast rate limiting for high-frequency updates
- Add client-side debouncing for high-frequency model updates
- Consider server-side throttling for rapid sequential broadcasts

## Validation Criteria
- [ ] Models with `BroadcastsEvents` trait are documented
- [ ] Broadcast channels are authorized in `routes/channels.php`
- [ ] Payload filtering is configured (no sensitive data exposed)
- [ ] Tests verify broadcast dispatch for all lifecycle events
- [ ] After-commit variant is used for transactional workflows
- [ ] Rate limiting/debouncing is implemented where needed
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization