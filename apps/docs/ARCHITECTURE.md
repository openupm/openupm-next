# Docs Site Architecture

This file records implementation-level decisions for the VuePress docs app.
It is intended for contributors changing `apps/docs`, not for public site
content.

## Runtime Data Loading

The docs site is a static VuePress app with a small client-side data layer.
Generated page frontmatter should carry page-specific data that is needed for
SSR and SEO. Larger cross-page datasets should be fetched in the browser only
when a route or layout actually needs them.

The default Pinia store in `docs/.vuepress/store.ts` owns these shared runtime
datasets:

- `siteInfo`: global site stats, such as GitHub stars.
- `packageMetadataRemoteDict`: registry/API package metadata keyed by package
  name.
- `packageMetadataLocalList`: generated local package metadata used for list,
  dependency, and package-existence checks.
- `recentPackages`: recent package data.

Cached fetch actions use a five-minute freshness window. In-flight promise
dedupe is scoped per store instance through a `WeakMap`, not module-level
globals, so concurrent Pinia instances do not accidentally share a fetch result
without mutating their own state.

## Route-Level Fetch Rules

The global client setup in `docs/.vuepress/client.ts` should stay route-aware:

- Fetch `siteInfo` on mount and route changes.
- Fetch full package-list metadata only for package list routes matched by
  `isPackageListPath(path)`.
- Do not globally fetch package metadata for every page.

Layouts are responsible for the datasets their rendered UI needs:

- `PackageListLayout.vue` fetches full package-list data because sorting,
  filtering, topic pages, and NuGet search suggestions need both local and
  remote metadata.
- `PackageDetailLayout.vue` fetches remote metadata and local metadata because
  package details use remote fields and dependency status uses package
  existence checks.
- `NuGetPackageDetailLayout.vue` fetches local metadata because dependency
  rendering needs package existence checks, even though NuGet package identity
  comes from its own packument/frontmatter path.
- `HomeLayout.vue` fetches remote metadata for the package count, but should
  not fetch the local metadata list.

When adding a layout or changing route behavior, fetch the smallest shared
dataset that the visible UI needs. Avoid moving layout-specific fetches into
the global client hook unless the data is genuinely needed by most routes.

## Validation

Runtime payload behavior is covered by
`__tests__/vue/runtimePayload.spec.ts`. Update that test when changing route
fetch rules, shared store cache behavior, or layout-level metadata ownership.

For focused validation from `apps/docs`, run:

```bash
npm run test -- runtimePayload.spec.ts
npm run lint
```

For higher confidence after broader docs changes, also run the relevant focused
Vue tests and `npm run docs:build:limit`.
