import { z } from 'zod';

export const PackageMetadataLocalBaseSchema = z.object({
  name: z.string(),
  repoUrl: z.string().url(),
  displayName: z.string(),
  description: z.string(),
  licenseSpdxId: z.string().nullable(),
  licenseName: z.string(),
  topics: z.array(z.string()),
  hunter: z.string(),
  createdAt: z.number(),
  image: z.string().nullable().optional(),
  imageFit: z.string().optional(),
  parentRepoUrl: z.string().nullable().optional(),
  readme: z.string().optional(),
  gitTagPrefix: z.string().optional(),
  gitTagIgnore: z.string().optional(),
  minVersion: z.string().optional(),
  displayName_zhCN: z.string().optional(),
  description_zhCN: z.string().optional(),
  readme_zhCN: z.string().optional(),
  excludedFromList: z.boolean().optional(),
});
