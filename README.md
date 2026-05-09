# sanity-studio-search-with-filters

> Reusable search input + filter UI for Sanity Studio plugins. Search box, document-type popover, custom filter chips, pinned filters (date / references), and per-operator filter inputs — all driven by props.

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> **At a glance** — Sanity's built-in studio search bar isn't reusable from plugin code. This package extracts the same UX patterns (search box with loading indicator, document-type filter popover with grouping, custom filter chips with operators) as a fully-prop-driven component you can drop into any Sanity Studio plugin tool. Originally backed three custom plugins in a private monorepo where editors needed studio-grade search inside custom tools.
>
> What you get:
>
> - **`<SearchBoxWithFilters>`** — the all-in-one combined component (search input + filter toggle + active-filter chips + document-type popover + add-filter dropdown)
> - **`<FilterButton>`** — standalone filter chip (badge with remove button)
> - **`<DocumentTypesButton>`** — standalone document-type selector with grouping support (e.g. group "Content" → page, post; "Settings" → siteSettings, navigation)
> - **`<AddFilterButton>`** — standalone "+ Add filter" dropdown with searchable filter options
> - **`<FilterForm>`** — popover form for editing a filter's operator and value
> - **`<FilterInput>`** — type-specific input (string / number / date / multi-string / etc.) per operator
> - **`<OperatorsMenuButton>`** — dropdown for switching between operators within a filter
> - **`<FilterLabel>`** — labeled rendering of an active filter (e.g. "Updated: in the last 7 days")
> - **Pinned filters out of the box** — `defaultPinnedFilters` ships with `_updatedAt`, `_createdAt`, and `_references` matching Sanity Studio's standard search affordances
> - **`useClickOutsideEvent`** — small utility hook the components use, exported for reuse

## Install

```bash
npm install sanity-studio-search-with-filters
```

`react`, `@sanity/icons`, `@sanity/ui`, and `styled-components` are peer deps. `react-focus-lock` is a real dep and installs automatically.

## Quickstart

```tsx
import {
  SearchBoxWithFilters,
  type Filter,
} from "sanity-studio-search-with-filters";
import { useState } from "react";

export function MyToolBody() {
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(true);

  return (
    <SearchBoxWithFilters
      query={query}
      onQueryChange={setQuery}
      loading={false}
      filtersVisible={filtersVisible}
      onFiltersToggle={() => setFiltersVisible(!filtersVisible)}
      filters={filters}
      onFilterRemove={(filterId) =>
        setFilters((cur) => cur.filter((f) => f.id !== filterId))
      }
      onClearFilters={() => {
        setFilters([]);
        setTypes([]);
      }}
      types={types}
      onTypesChange={setTypes}
      availableTypes={[
        { name: "page", title: "Page" },
        { name: "post", title: "Blog Post" },
        { name: "siteSettings", title: "Site Settings" },
      ]}
      schemaTypeGroups={{
        Content: ["page", "post"],
        Settings: ["siteSettings"],
      }}
      placeholder="Search documents…"
    />
  );
}
```

That's the full surface. Wire `query` / `types` / `filters` to whatever GROQ query you're driving in your tool, debounce the inputs as needed, and you have studio-grade search.

## API

### `<SearchBoxWithFilters>`

| Prop | Type | Required | Description |
|---|---|---|---|
| `query` | `string` | Yes | Current search query value. |
| `onQueryChange` | `(query: string) => void` | Yes | Called when the user types. |
| `loading` | `boolean` | No | When true, swaps the search icon for a spinner. |
| `filtersVisible` | `boolean` | No | Controlled visibility of the filters row. |
| `onFiltersToggle` | `() => void` | No | Called when the toggle button is clicked. Pair with `filtersVisible`. |
| `filters` | `Filter[]` | Yes | Active filters rendered as chips. |
| `onFilterRemove` | `(filterId: string) => void` | Yes | Called when a chip's × is clicked. |
| `onClearFilters` | `() => void` | No | Called when the "Clear all" button is clicked. Hidden if not provided. |
| `types` | `string[]` | Yes | Currently-selected document type names. |
| `availableTypes` | `Array<{ name; title }>` | Yes | Document types to choose from. |
| `onTypesChange` | `(types: string[]) => void` | Yes | Called when type selection changes. |
| `showTypeFilter` | `boolean` | No | Default true. Set false to hide the document-type popover. |
| `fullscreen` | `boolean` | No | Default false. Switches to a wider layout for full-tool search. |
| `placeholder` | `string` | No | Search input placeholder. |
| `schemaTypeGroups` | `Record<string, string[]>` | No | Group document types in the popover, e.g. `{ "Content": ["page", "post"] }`. |

### `Filter`

```ts
interface Filter {
  id: string;             // unique identifier
  field: string;          // field path (e.g. "_updatedAt", "category.slug.current")
  operator: string;       // operator name (e.g. "includes", "dateTimeLast")
  value: string | string[]; // single or multi value
  label: string;          // display label for the chip
  isValid?: boolean;      // false dims the chip to indicate the filter won't apply
}
```

### Pinned filter helpers

```ts
import {
  defaultPinnedFilters,        // [{ id: 'updatedAt', ... }, { id: 'createdAt', ... }, { id: 'references', ... }]
  missingFieldsFilter,         // { id: 'missingFields', ... }
  getDefaultFilterOptions,     // returns FilterOption[] for AddFilterButton
  getFilterOperators,          // (filterId) => available operators for that filter
} from "sanity-studio-search-with-filters";
```

The default pinned filters mirror what Sanity Studio's built-in search shows: edited-at, created-at, and document-references. Pass `getDefaultFilterOptions()` to `<AddFilterButton>` to get the same options on a custom tool.

### Standalone components

You can use any of the building blocks on their own — they don't require `<SearchBoxWithFilters>` as a parent.

```tsx
import {
  FilterButton,
  DocumentTypesButton,
  AddFilterButton,
  FilterForm,
  FilterInput,
  FilterLabel,
  OperatorsMenuButton,
  useClickOutsideEvent,
} from "sanity-studio-search-with-filters";
```

Useful when you want, say, a single document-type selector in a sidebar without the full search-bar layout.

## Design notes

- **Sanity Studio design tokens** — uses `@sanity/ui` for colors, spacing, radius, typography. Does not impose a theme of its own.
- **Loading spinner** — animated via `styled-components` `keyframes`, 500ms linear infinite, reusing the `SyncIcon` from `@sanity/icons`.
- **Document-type popover** — virtualization-free; if you have hundreds of document types, the popover scrolls but doesn't lazy-render.
- **Filter inputs** — `<FilterInput>` switches between string / number / date / multi-string inputs based on the operator, so the form adapts as the user changes the operator.

## Origin

Extracted from a Sanity Studio implementation in a private monorepo where this component backed three custom plugin tools (a bulk-edit grid, a manual-review queue, and an AI-generation queue). The standalone version is a near-verbatim copy — the original was already props-driven and carried no project-specific schema imports, so the extraction was almost entirely about packaging (build config, peer deps, README) rather than decoupling.

Pairs well with [`sanity-studio-table`](https://github.com/spindle79/sanity-studio-table) — that's the table primitive these same plugins used to render filtered results.

## License

[MIT](LICENSE) © Adam Harris
