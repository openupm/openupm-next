import { Page } from "vuepress";

export const getSearchExtraFields = (page: Page): string[] => {
  const frontmatter = page.frontmatter;
  if (frontmatter.packageKind !== "unitynuget") return [];

  return uniqueStrings([
    frontmatter.name,
    frontmatter.nugetId,
    frontmatter.description,
  ]);
};

const uniqueStrings = (values: unknown[]): string[] => {
  const fields: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== "string") continue;

    const field = value.trim();
    if (!field || seen.has(field)) continue;

    fields.push(field);
    seen.add(field);
  }

  return fields;
};
