---
editLink: false
sidebar: auto
---
# Style Cheatsheet

## Elements

### Typography

This is a paragraph.

### Labels

<span class="label label-default mr-2">default label</span>
<span class="label label-primary mr-2">default label</span>
<span class="label label-secondary mr-2">default label</span>
<span class="label label-success mr-2">default label</span>
<span class="label label-warning mr-2">default label</span>
<span class="label label-error mr-2">default label</span>
<span class="label label-default label-rounded mr-2">default label</span>

### KBD

<kbd>Enter</kbd>

## Components

### Chip

<span class="chip"><i class="fa fa-user"></i>UserX</span>

### Badge Icons

Contributor badge icons use the local `ContributorBadgeIcon` widget instead of
Font Awesome. Use it when a compact, self-contained achievement mark is needed
on contributor-facing UI.

```vue
<ContributorBadgeIcon icon="search" />
<ContributorBadgeIcon icon="box" label="25+" />
<ContributorBadgeIcon icon="trophy" label="10" />
<ContributorBadgeIcon icon="year-search" label="2026" />
```

<div class="badge-icon-style-row">
  <span class="badge-icon-style-sample badge-icon-style-hunter">
    <ContributorBadgeIcon icon="search" />
  </span>
  <span class="badge-icon-style-sample badge-icon-style-owner">
    <ContributorBadgeIcon icon="box" label="25+" />
  </span>
  <span class="badge-icon-style-sample badge-icon-style-hunter">
    <ContributorBadgeIcon icon="trophy" label="10" />
  </span>
  <span class="badge-icon-style-sample badge-icon-style-support">
    <ContributorBadgeIcon icon="coin" />
  </span>
  <span class="badge-icon-style-sample badge-icon-style-muted">
    <ContributorBadgeIcon icon="coin" />
  </span>
  <span class="badge-icon-style-sample badge-icon-style-year">
    <ContributorBadgeIcon icon="year-search" label="2026" />
  </span>
</div>

Badge icon rules:

- Render at `70x70` with the component's fixed SVG viewbox.
- Keep each icon self-descriptive without relying on nearby text.
- Use the same icon for related states and separate them by tone when possible.
- Put tier text in the `label` prop, for example `25+`.
- For trophy rank badges, use only the rank number in the icon label, for
  example `10`; keep the full `Top 10` wording in the tooltip or nearby text.
- For year badges, feature the four-digit year as the label and keep the role
  icon small. Use `year-search` for Package Hunter years and `year-box` for
  Package Owner years.
- Use `search`, `box`, `trophy`, `spark`, `coin`, `year-search`, and `year-box`
  before adding a new icon.
- Add new icons inside `ContributorBadgeIcon.vue` so they remain reusable.
- Set tone through `currentColor`; do not use remote images or generated assets.

Current badge tones:

- `hunter`: `#2f7d78`
- `owner`: `#816a2d`
- `history`: `#8a5b3d`
- `support`: `#b24b68`
- `muted`: `#7a7f87`

### Quotes

::: tip Tip
This is a tip quote
:::

::: warning Warning
This is a warning quote
:::

::: danger Danger
This is a danger quote
:::

::: details Details
This is a details quote
:::

<style>
.badge-icon-style-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
}

.badge-icon-style-sample {
  display: inline-block;
  width: 70px;
  height: 70px;
}

.badge-icon-style-hunter {
  color: #2f7d78;
}

.badge-icon-style-owner {
  color: #816a2d;
}

.badge-icon-style-support {
  color: #b24b68;
}

.badge-icon-style-muted {
  color: #7a7f87;
}

.badge-icon-style-year {
  color: #5b6889;
}
</style>
