# Decision Trees — Resource vs DTO Decision

---

## Decision: Resource vs DTO for API Output

---

## Decision Context

Should a given API endpoint use a Laravel API Resource or a Plain Old PHP Object / Data Transfer Object for shaping its response?

---

## Decision Criteria

* **Serialization framework:** Is the endpoint part of a RESTful API using Eloquent models?
* **Transformation complexity:** Does the output require simple field mapping or complex computed values?
* **Caching needs:** Will the output be cached independently of the model?
* **Reusability:** Will the same output shape be used across multiple endpoints?
* **Relationship handling:** Does the output include related models with nested data?

---

## Decision Tree

Need to decide between an API Resource and a dedicated DTO?

↓

Is the output bound to an Eloquent model (single model or collection)?

YES → Is the transformation simple field mapping (field = model attribute)?

    YES → Use API Resource — the simplest, most Laravel-native approach

    NO → Does the transformation include heavy computation, external data, or caching?

        YES → Use a DTO — keeps complex logic out of the resource layer

        NO → Does the output need to be reused across multiple contexts (API, CLI, web)?

            YES → Use a DTO — avoids repeating transformation logic

            NO → Use API Resource — adequate for endpoint-specific shaping

NO → Use a DTO — resources require an Eloquent model; DTOs work with any data source

---

## Rationale

API Resources are the right choice when the output is tightly coupled to a model, relationships need nested resource handling, and the transformation is straightforward. DTOs are superior when the output shape is independent of Eloquent, requires caching, or involves complex computation. The key distinction is the data source: Eloquent model → Resource; other data → DTO.

---

## Recommended Default

**Default:** Start with an API Resource for any model-backed response; extract to DTO when transformation logic grows beyond simple mapping
**Reason:** Resources integrate natively with Eloquent, pagination, relationships, and conditionals; DTOs are an extraction, not a starting point

---

## Risks Of Wrong Choice

Using a resource for complex transformations violates separation of concerns and makes testing cumbersome. Using a DTO for a simple model response adds unnecessary boilerplate and sacrifices nested relationship handling, conditionals, and pagination integration.

---

## Related Rules

* Rule: Use Resources for Model-Backed Responses; DTOs for Complex Transformations (resource-vs-dto-decision/05-rules.md)
* Rule: Never Put Business Logic in Resources (resource-vs-dto-decision/05-rules.md)

---

## Related Skills

* Create an API Resource (resource-fundamentals/06-skills.md)
* Create a DTO (dtos/06-skills.md)

---

---

## Decision: Resource Collection vs DTO Collection

---

## Decision Context

How should you handle a collection of items in an API response — using a Resource Collection class or a DTO wrapping an array?

---

## Decision Criteria

* **Pagination:** Does the endpoint need pagination metadata?
* **Top-level structure:** Does the response need a `data` wrapper automatically?
* **Consistency:** Should all collection responses share the same JSON structure?
* **Custom meta:** Does the response need per-endpoint metadata alongside the collection?

---

## Decision Tree

Need to return a collection from an endpoint?

↓

Does the endpoint need pagination (`->paginate()`)?

YES → Does the response need custom top-level meta beyond pagination?

    YES → Use a DTO collection — need explicit control over the wrapper

    NO → Use Resource Collection — pagination integration is automatic

NO → Is the collection a simple array of transformed items (no wrapper)?

    YES → Use `ResourceClass::collection()` inline — no collection class needed

    NO → Does the collection need a consistent wrapping structure across endpoints?

        YES → Use Resource Collection — provides `->meta()`, `->additional()`

        NO → Use a simple array response or DTO— less abstraction

---

## Rationale

Resource Collections provide automatic pagination wrapping, a consistent `data` key, and the `->additional()` method for meta. They are the best choice for paginated endpoints with standard wrapping. For non-paginated collections, `ResourceClass::collection()` inline is simpler. DTO collections give full control when the response structure does not match the resource collection conventions (e.g., custom top-level keys, alternative pagination formats).

---

## Recommended Default

**Default:** Use Resource Collection for any paginated endpoint; inline `::collection()` for non-paginated list endpoints
**Reason:** Minimizes boilerplate for the most common patterns; pagination integration handles metadata, total count, per-page, etc. automatically

---

## Risks Of Wrong Choice

Using a DTO collection for a standard paginated endpoint means manually implementing pagination metadata, links, and counts — exactly what Resource Collections provide for free. Using Resource Collection for a non-standard response format forces workarounds via `additional()` or `withoutWrapping()`.

---

## Related Rules

* Rule: Use Resource Collections for Paginated Endpoints (resource-vs-dto-decision/05-rules.md)

---

## Related Skills

* Resource Collections (resource-collections/06-skills.md)
* Pagination Metadata (pagination-metadata/06-skills.md)

---

---

## Decision: Inline Resource vs Dedicated Resource Class

---

## Decision Context

Should you define a response inline in the controller (via `response()->json()` with an array) or create a dedicated Resource class?

---

## Decision Criteria

* **Reusability:** Is this response shape used by more than one endpoint?
* **Testability:** Do you need to test the response shape independently?
* **Maintenance:** How likely is the response shape to change independently of the controller?
* **Consistency:** Does the response need to follow application-wide conventions?

---

## Decision Tree

Need to return shaped JSON from a controller?

↓

Is this response used (or likely to be used) by more than one controller/endpoint?

YES → Create a dedicated Resource class

NO → Is the transformation more than 3-4 fields of simple mapping?

    YES → Does the application have a policy of always using Resources?

        YES → Create a dedicated Resource class — follow the convention

        NO → Is the response shape likely to change in a future sprint?

            YES → Create a dedicated Resource class — change is decoupled from the controller

            NO → Use inline `response()->json()` — no abstraction for a simple one-off

---

## Rationale

Inline JSON responses are acceptable for trivial, one-off responses that will never be reused. Any response with more than a few fields, any reuse, or any anticipated change benefits from a dedicated Resource class because it decouples the response shape from the controller, making both easier to test and maintain independently.

---

## Recommended Default

**Default:** Always create a dedicated Resource class, even for single-use responses
**Reason:** Consistent approach avoids the decision overhead; extracting from inline to a Resource class later is rarely done due to time pressure, leading to inconsistent response shaping across controllers

---

## Risks Of Wrong Choice

Inline response in controllers leads to inconsistent field naming, missing conditionals, and untested response shapes. As the application grows, some endpoints use Resources and others use inline arrays, making the API contract unpredictable and hard to document.

---

## Related Rules

* Rule: Prioritize Resource Classes Over Inline Response Arrays (resource-vs-dto-decision/05-rules.md)

---

## Related Skills

* Create an API Resource (resource-fundamentals/06-skills.md)
