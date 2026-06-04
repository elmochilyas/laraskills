## Rule: TypeScript Interface for Every Page

Define a TypeScript interface for every page component's props, matching the server-side prop shape.

---

## Category

Code Organization

---

## Rule

Create an explicit TypeScript interface for each page component that lists all props the component receives. Pass it as the component's prop type. Never use `any`, `Record<string, unknown>`, or a generic catch-all type for page props.

---

## Reason

Without typed props, accessing `props.user.name` gives no compile-time error if `user` is undefined or misspelled. The first indication of a mismatch is a runtime error in production. Typed props catch missing required fields, renamed keys, and incorrect types during development.

---

## Bad Example

```tsx
// No type — any prop accessible, no errors for misspellings
export default function Index(props: any) {
    return <div>{props.userr.name}</div>; // No compile error
}
```

---

## Good Example

```tsx
interface Props {
    user: { id: number; name: string; email: string };
    posts: Post[];
}

export default function Index({ user, posts }: Props) {
    return <div>{user.name}</div>; // Compiler-enforced
}
```

---

## Exceptions

For projects using plain JavaScript (no TypeScript), this rule does not apply. Consider migrating to TypeScript for Inertia projects.

---

## Consequences Of Violation

Reliability risks: prop shape mismatches detected only at runtime. Developer experience: no autocompletion, no inline documentation.

---

## Rule: Use Persistent Layouts

Assign layouts via the `.layout` property to maintain layout state across navigations.

---

## Category

Performance

---

## Rule

Assign a persistent layout to each page component using the `Component.layout` property or the layout callback in `createInertiaApp`. Never create a new layout instance inside the page component's render function.

---

## Reason

Without persistent layouts, a new layout is created on every navigation — the layout remounts, losing scroll position, open accordions, and any layout-level state (e.g., sidebar collapse state). Persistent layouts remain mounted across page transitions, preserving state and reducing re-renders.

---

## Bad Example

```jsx
// New layout created on every navigation — state lost
export default function Dashboard({ users }) {
    return (
        <AuthenticatedLayout>
            <UsersTable users={users} />
        </AuthenticatedLayout>
    );
}
```

---

## Good Example

```jsx
export default function Dashboard({ users }) {
    return <UsersTable users={users} />;
}

Dashboard.layout = page => <AuthenticatedLayout children={page} />;
```

---

## Exceptions

Pages with significantly different layout requirements (e.g., a full-screen landing page vs. an authenticated dashboard) should use different layout components. Each layout can be persistent for its page group.

---

## Consequences Of Violation

Performance risks: unnecessary re-renders of layout on every navigation. UX: layout state (scroll, sidebar, modals) lost on page change.

---

## Rule: Treat Props as Read-Only

Never copy Inertia props into local component state. Use props directly for server data.

---

## Category

Design

---

## Rule

Use server props directly in the render output. Do not copy `props.user` into `useState(props.user)`. If you need to mutate data, submit it to the server and refresh via partial reload.

---

## Reason

Copying server props to local state creates two sources of truth. When the component re-renders with new props (from a partial reload or same-page navigation), the local state still holds the old value. The UI becomes stale. Inertia's data flow is unidirectional — server sends, client renders. Breaking this pattern causes synchronization bugs.

---

## Bad Example

```jsx
const [user, setUser] = useState(props.user);
// Server sends updated user via partial reload, but user state is stale
```

---

## Good Example

```jsx
// Use props directly — always receives latest server data
function Dashboard({ user }) {
    return <div>{user.name}</div>;
}
```

---

## Exceptions

If the page component needs client-only UI state (open modals, accordion toggles, selected tab), use `useState` for that UI state — not for server data. Keep server data (props) and UI state separate.

---

## Consequences Of Violation

Reliability risks: stale data displayed after navigation or partial reload. Maintenance complexity: two sources of truth for the same data.

---

## Rule: One Component File Per Inertia Render

Create a page component file for every `Inertia::render()` call in the application. The file must exist at the path implied by the render name.

---

## Category

Code Organization

---

## Rule

Ensure that for every `Inertia::render('Users/Index', ...)` in a controller, a corresponding file exists at `resources/js/Pages/Users/Index.{jsx,tsx,vue,svelte}`. Add the file as part of the same pull request that adds the render call.

---

## Reason

A missing page component file causes a runtime error when Inertia tries to resolve the page. The error surface varies by environment — in development it may load lazily and fail silently, in production it may show a blank page or 500 error. The missing file is easy to overlook because the server-side code (controller) compiles without error.

---

## Bad Example

```php
// Controller added, but no resources/js/Pages/Reports/Show.jsx exists
return Inertia::render('Reports/Show', ['report' => $report]);
```

---

## Good Example

```php
// Both controller and component added together
return Inertia::render('Reports/Show', ['report' => $report]);
```

```
resources/js/Pages/Reports/Show.jsx  // Created
```

---

## Exceptions

If a page component is intentionally lazy-loaded with a different resolution strategy, document the custom resolution logic in the `createInertiaApp` setup and ensure a fallback error page exists.

---

## Consequences Of Violation

Runtime errors: blank page or 500 on navigation to the new route. Debugging difficulty: error is on the client side, not obvious from server logs.

---

## Rule: Use Head Component for Meta

Set page title and meta tags using Inertia's `Head` component in each page component.

---

## Category

UX

---

## Rule

Import and use the `Head` component from `@inertiajs/react` (or Vue/Svelte equivalent) in every page component to set the document title. Include relevant meta tags for SEO-critical pages.

---

## Reason

Without `Head`, every page has the same document title — typically the app name. This degrades UX (tabs are indistinguishable), SEO (search engines rely on title and meta tags), and social sharing (no Open Graph data). The `Head` component is the idiomatic Inertia way to manage document-level metadata.

---

## Bad Example

```jsx
export default function Dashboard() {
    return <div>Dashboard content</div>; // No title set
}
```

---

## Good Example

```jsx
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />
            <div>Dashboard content</div>
        </>
    );
}
```

---

## Exceptions

Error pages (404, 403, 500) rendered through Inertia should always set `Head` title to the error type so the tab title reflects the error state.

---

## Consequences Of Violation

UX: browser tabs all show same title, poor tab navigation. SEO: search engines cannot differentiate pages. Social: no Open Graph tags for shared links.

---

## Rule: Show Navigation Loading Indication

Use `usePage().processing` to show a loading indicator during Inertia page transitions.

---

## Category

UX

---

## Rule

In the persistent layout component, subscribe to `usePage().processing` and render a loading bar, spinner, or dimming overlay while navigations are in progress.

---

## Reason

Inertia navigations can take 200-1000ms depending on server response time. Without a loading indicator, users perceive the application as unresponsive or broken when a page transition takes more than 300ms. A subtle loading bar (similar to YouTube's red bar) provides immediate feedback that the navigation is in progress.

---

## Bad Example

```jsx
// No loading indicator — navigation appears as an unresponsive pause
function Layout({ children }) {
    return <div>{children}</div>;
}
```

---

## Good Example

```jsx
import { usePage } from '@inertiajs/react';

function Layout({ children }) {
    const { processing } = usePage();
    return (
        <>
            {processing && <div className="loading-bar" />}
            <div>{children}</div>
        </>
    );
}
```

---

## Exceptions

Pages with sub-50ms response times (e.g., cached data) may not need a loading indicator. The layout should still handle the `processing` state but may choose not to display a visual indicator for very fast transitions.

---

## Consequences Of Violation

UX: navigation feels sluggish or broken. User perception: application appears slow even if server response is reasonable.

---

## Rule: Create Inertia Error Pages

Render 403, 404, and 500 pages through Inertia so error states have the same SPA experience.

---

## Category

UX

---

## Rule

In the exception handler, intercept Inertia requests and render error pages (`Errors/403`, `Errors/404`, `Errors/500`) using `Inertia::render()`. Create the corresponding page component files with appropriate messaging.

---

## Reason

Without Inertia error pages, a 404 during an Inertia navigation returns either a Blade error page (breaking the SPA look) or a JSON error (showing raw error text). Custom Inertia error pages maintain the application's visual identity during error states and provide helpful navigation back to working pages.

---

## Bad Example

```php
// Falls through to default error handling — Blade page or JSON
public function render($request, Throwable $e): Response
{
    return parent::render($request, $e);
}
```

---

## Good Example

```php
public function render($request, Throwable $e): Response
{
    if ($request->inertia() && ($e instanceof NotFoundHttpException || $e instanceof ModelNotFoundException)) {
        return Inertia::render('Errors/404')->toResponse($request);
    }
    return parent::render($request, $e);
}
```

---

## Exceptions

401/403 pages that must not reveal the existence of a page to unauthorized users may redirect to login instead of rendering a 404 page.

---

## Consequences Of Violation

UX: error pages break the SPA design language, confusing users. Developer experience: raw error output visible in non-debug mode.
