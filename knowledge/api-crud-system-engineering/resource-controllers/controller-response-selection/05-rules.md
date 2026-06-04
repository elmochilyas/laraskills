## Always Use Standardized Status Codes Per Action
---
## Category
Design
---
## Rule
Always follow the standardized status code table for resource controller actions: index=200, store=201, show=200, update=200, destroy=204; never deviate from these codes without documented justification.
---
## Reason
Standardized status codes make API behavior predictable. Clients can programmatically determine action outcome from the status code alone.
---
## Bad Example
`php
public function destroy(Photo ) { ->delete(); return response()->json(['message' => 'deleted']); } // 200 with body
`
---
## Good Example
`php
public function destroy(Photo ) { ->delete(); return response()->noContent(); } // 204, no body
`
---
## Exceptions
Asynchronous operations may return 202 Accepted; creation may return 201 with Location header.
---
## Consequences Of Violation
Inconsistent API behavior; clients cannot rely on status codes; integration contracts are underspecified.

## Always Use response()->noContent() For Delete
---
## Category
Design
---
## Rule
Always return esponse()->noContent() from destroy actions; never return esponse()->json(null, 204) or esponse()->json(['message' => 'deleted']).
---
## Reason

oContent() explicitly communicates 204 No Content. A 200 with body is semantically incorrect for deletion. A 200 with null body is ambiguous.
---
## Bad Example
`php
public function destroy(Photo ) { ->delete(); return response()->json(null, 204); }
`
---
## Good Example
`php
public function destroy(Photo ) { ->delete(); return response()->noContent(); }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Ambiguous response semantics; inconsistent REST implementation; clients cannot distinguish "deleted" from "not found."

## Return Fresh Data After Update
---
## Category
Reliability
---
## Rule
Always return $model->fresh() after update operations to ensure the response contains the latest data; never return the model instance before database write confirmation.
---
## Reason
Without resh(), the response may contain stale data if model events, observers, or database defaults modified fields after the initial model was loaded.
---
## Bad Example
`php
public function update(UpdatePhotoRequest , Photo ) { ->update(->validated()); return new PhotoResource(); }
`
---
## Good Example
`php
public function update(UpdatePhotoRequest , Photo ) { ->update(->validated()); return new PhotoResource(->fresh()); }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Stale data returned to client; client caches outdated values; inconsistent state between client and server.

## Never Return Raw Models
---
## Category
Security
---
## Rule
Always wrap Eloquent models in API resource classes or esponse()->json() with explicit data arrays; never return raw models from controller actions.
---
## Reason
Returning raw models exposes all attributes including sensitive ones (passwords, internal flags, pivot data). API resources provide an explicit allowlist.
---
## Bad Example
`php
public function show(Photo ) { return ; }
`
---
## Good Example
`php
public function show(Photo ) { return new PhotoResource(); }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Sensitive data leakage; inconsistent JSON structure; breaking changes when model attributes are renamed; security audit failures.

## Never Return 200 With Error Body
---
## Category
Design
---
## Rule
Never return HTTP 200 with an error message in the response body; always use the appropriate 4xx or 5xx status code.
---
## Reason
The status code is the primary success/failure signal. Returning 200 with an error body forces clients to parse body content for errors, defeating the purpose of HTTP status codes.
---
## Bad Example
`php
try {  = Photo::findOrFail(); } catch (ModelNotFoundException ) { return response()->json(['error' => 'Not found'], 200); }
`
---
## Good Example
`php
public function show(Photo ) { return new PhotoResource(); } // Laravel returns 404 automatically
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Clients cannot distinguish success from error without parsing body; API violates HTTP semantics; integration testing requires assertion on body content.

## Standardize Response Envelope With Macros
---
## Category
Maintainability
---
## Rule
Always define response macros in AppServiceProvider or a dedicated ResponseServiceProvider for team-standardized envelope structures; never format response envelopes manually in each controller.
---
## Reason
Response macros ensure consistent envelope format across all controllers. Manual formatting inevitably drifts across developers and endpoints.
---
## Bad Example
`php
// Three different controllers, three different envelope formats
return response()->json(['data' => , 'success' => true], 200);
return response()->json(['result' => , 'status' => 'ok'], 200);
`
---
## Good Example
`php
// AppServiceProvider
Response::macro('success', fn(,  = 200) => response()->json(['data' => , 'success' => true], ));
// Controller
return response()->success(new PhotoResource());
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Inconsistent API responses; client parsing logic must handle multiple formats; breaking changes when envelope structure changes.
