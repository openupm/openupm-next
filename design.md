# OpenUPM Client Design Notes

The OpenUPM client is a fusion of a tweaked Spectre.css foundation and the
VuePress theme. Prefer Spectre's native class names and markup shapes for
components, and use VuePress theme variables, layout primitives, and navigation
patterns where the site chrome or documentation flow is involved.

## Structure

- Use Spectre component markup exactly where practical, for example breadcrumbs
  use `.breadcrumb` with direct `.breadcrumb-item` children.
- Keep OpenUPM pages utilitarian and dense. Avoid decorative cards for page
  sections; reserve cards for repeated items, modals, and framed tools.
- For long package collections, prefer tables or virtualized lists over package
  cards. Package cards are appropriate for browsing grids, not long inventories.
- Use the default VuePress docs/sidebar structure for documentation pages.
  Application-style pages may opt out when the sidebar competes with the primary
  workflow.

## Links

- Use the local `AutoLink` component for new internal and external navigation
  links. It wraps the VuePress theme `AutoLink`, so it preserves router
  navigation, active-link behavior, external-link icons, `_blank` targets, and
  safe `rel` defaults.
- Pass link data as an item object with `text` and `link` rather than hand
  writing anchors, unless the markup is static content or requires behavior
  that `AutoLink` does not support.
- External reference links should be normal nav links unless the action is a
  primary task. Do not style them as buttons by default.

## Tables

- Avoid striped table rows in dark mode unless the colors have been explicitly
  tuned for both themes.
- Keep table spacing consistent with nearby section headings; avoid large gaps,
  but preserve enough top margin for the heading and table to read as separate
  elements.
- Show both friendly display names and full package names when package identity
  needs to be scan-friendly and exact.

## Color And Theme

- Reuse existing CSS variables such as `--c-border`, `--c-text`, and
  `--c-text-light` from the VuePress theme so light and dark modes stay aligned.
- Do not introduce one-off row backgrounds, gradients, or decorative color
  bands without checking dark mode.

## Contributor Badge Icons

- Use `ContributorBadgeIcon` for contributor achievement marks. It is a local
  70x70 SVG widget, not a Font Awesome icon or remote badge image.
- Keep badge icons self-descriptive at icon size. Use the established icon
  vocabulary first: `search`, `box`, `trophy`, `spark`, `coin`,
  `year-search`, and `year-box`.
- Drive badge color through `currentColor` and the shared tones used by
  `ContributorBadgeWall`: hunter, owner, history, support, and muted.
- Keep related states on the same glyph when the concept is the same. For
  example, current and former backers both use the coin icon, with former backer
  rendered in the muted tone.
- For count tiers, use compact icon labels such as `25+`. For trophy rank
  badges, put only the number in the icon, such as `10`, and keep the full
  `Top 10` wording in tooltip or surrounding accessible text.
- For year badges, make the four-digit year the main visual and keep the role
  glyph smaller. Use subtly different accent colors per year while preserving
  the hunter or owner color family.
- Document new reusable badge glyphs in
  `apps/docs/docs/docs/dev/style-cheatsheet.md` when adding them.
