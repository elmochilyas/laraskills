## Delegate Business Logic Out Of Controllers
---
## Category
Architecture
---
## Rule
Always delegate business logic from controller methods to dedicated action or service classes; never write inline business logic beyond a single delegation call.
---
## Reason
Controllers are HTTP adapters, not business logic containers. Delegation preserves single responsibility, enables reuse across HTTP, CLI, and queue entry points, and makes business logic testable without HTTP concerns.
---
## Bad Example
`php
public function store(Request ) {  = new Photo(); ->title = ->title; ->processImage(->file('image')); ->assignTags(->tags); ->save(); return new PhotoResource(); }
`
---
## Good Example
`php
public function store(StorePhotoRequest ) { return new PhotoResource(->createPhoto->execute(->validated())); }
`
---
## Exceptions
Pure CRUD controllers with no business logic beyond a single Eloquent call (e.g., Photo::all() in index) may remain inline.
---
## Consequences Of Violation
Fat controllers that are hard to test; business logic cannot be reused from CLI/queue; single-responsibility violation; test duplication.

## Inject Action Classes Via Constructor
---
## Category
Design
---
## Rule
Always inject action classes via the controller constructor; never instantiate action classes inline with 
ew.
---
## Reason
Constructor injection makes dependencies visible in the class signature, enables mocking in tests, and lets the container resolve nested dependencies automatically.
---
## Bad Example
`php
public function store(StorePhotoRequest ) {  = new CreatePhotoAction(); return new PhotoResource(->execute(->validated())); }
`
---
## Good Example
`php
public function __construct(private readonly CreatePhotoAction ) {} public function store(StorePhotoRequest ) { return new PhotoResource(->createPhoto->execute(->validated())); }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Dependencies hidden in method bodies; tests cannot mock action classes; container bypassed — nested dependencies must be resolved manually.

## Actions Must Return Domain Objects, Never HTTP Responses
---
## Category
Architecture
---
## Rule
Action classes must return domain objects (models, DTOs, bool) and throw domain exceptions; they must never return HTTP responses or use Laravel response helpers.
---
## Reason
Actions must be reusable outside HTTP context. If an action returns a JSON response, it cannot be called from a CLI command, queue job, or another service without coupling to HTTP concerns.
---
## Bad Example
`php
class CreatePhotoAction { public function execute(array ) {  = Photo::create(); return response()->json(); } }
`
---
## Good Example
`php
class CreatePhotoAction { public function execute(array ): Photo { return Photo::create(); } }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Actions tied to HTTP context; cannot reuse from CLI/queue; testing requires HTTP stack; controller cannot customize response format.

## Name Action Classes With Verb-First Naming
---
## Category
Maintainability
---
## Rule
Always name action classes with a verb followed by the resource name: CreatePhotoAction, DeletePhotoAction, ArchivePhotoAction; never use noun-first names like PhotoCreator.
---
## Reason
Verb-first naming makes the action's purpose immediately readable at the call site. $this->createPhoto->execute() reads as natural language.
---
## Bad Example
`php
class PhotoCreator { public function execute(array ): Photo { ... } }
`
---
## Good Example
`php
class CreatePhotoAction { public function execute(array ): Photo { ... } }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Reduced readability; call sites require mental parsing of noun-first names; inconsistent naming across codebase.

## Keep Action Classes Stateless
---
## Category
Design
---
## Rule
Always keep action classes stateless; pass all method-specific data via method parameters; never store request-specific state in action class properties.
---
## Reason
Stateless actions are predictable, testable, and safe to reuse across requests. Stateful actions risk leaking data between requests in long-running processes or queued jobs.
---
## Bad Example
`php
class CreatePhotoAction { private array ; public function setData(array ) { ->data = ; } public function execute(): Photo { return Photo::create(->data); } }
`
---
## Good Example
`php
class CreatePhotoAction { public function execute(array ): Photo { return Photo::create(); } }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Data leakage between requests; race conditions in queue jobs; unpredictable test behavior; debugging difficulty from hidden state.

## Limit Action Class Constructor Dependencies To Four
---
## Category
Maintainability
---
## Rule
Never inject more than four dependencies into an action class constructor; split the action if more are needed.
---
## Reason
More than four dependencies indicates the action does too much. Each dependency represents a separate responsibility the action coordinates.
---
## Bad Example
`php
class CreatePhotoAction { public function __construct(private PhotoRepo , private ImageProcessor , private TagService , private Mailer , private Logger , private Cache ) {} }
`
---
## Good Example
`php
class CreatePhotoAction { public function __construct(private PhotoRepo , private ImageProcessor , private TagService ) {} }
`
---
## Exceptions
No common exceptions. Consider merging related dependencies into a single interface.
---
## Consequences Of Violation
Action violates single-responsibility principle; tests require complex setup; constructor hard to read; action likely orchestrates too many concerns.
