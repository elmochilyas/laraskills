---
## Rule Name
Collect Implicit Feedback Always

## Category
Testing

## Rule
Always collect implicit feedback (click tracking with position) as the minimum feedback mechanism.

## Reason
Implicit feedback is abundant — every click is data. Explicit feedback (ratings) is sparse. Click data alone provides actionable quality metrics.

## Bad Example
```php
// No click tracking — only hoping users give explicit feedback
// Most users won't rate results
```

## Good Example
```php
// Implicit feedback is automatic on every click
SearchClick::create([
    'query' => $query,
    'document_id' => $document->id,
    'position' => $position,
    'user_id' => auth()->id(),
]);
```

## Exceptions
Privacy-restricted environments where click tracking is prohibited.

## Consequences Of Violation
Missing the most abundant source of search quality data.

---
## Rule Name
Act on Low-Rated Queries

## Category
Maintainability

## Rule
Always create a process to investigate and act on queries that receive negative explicit feedback.

## Example
Collecting feedback without acting on it frustrates users and wastes the feedback opportunity. Each negative rating should trigger a review.

## Bad Example
```php
// Feedback collected but never reviewed
Session::flash('feedback_thanks', 'Thank you for your feedback!');
```

## Good Example
```php
if ($rating === 'thumbs_down') {
    SearchQualityReview::create([
        'query' => $query,
        'user_id' => auth()->id(),
        'status' => 'pending_review',
    ]);
    // Scheduled job reviews pending entries weekly
}
```

## Exceptions
Very low-traffic search where feedback volume doesn't justify review process.

## Consequences Of Violation
Users feel ignored and stop providing feedback.

---
## Rule Name
Close the Feedback Loop

## Category
UX

## Rule
Always notify users when their search feedback leads to an improvement.

## Reason
Closing the loop encourages continued feedback and demonstrates that user input drives real improvements.

## Bad Example
```php
// Feedback disappears into a black hole — never acted on or acknowledged
```

## Good Example
```php
// When issue resolved, notify user
if ($review->resolved) {
    Notification::send($user, new SearchImprovementNotification(
        "Thanks to your feedback, we've improved results for '{$review->query}'."
    ));
}
```

## Exceptions
Anonymous feedback where the user cannot be identified.

## Consequences Of Violation
Users stop providing feedback, assuming it has no impact.
