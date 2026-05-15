import { PackageMetadataLocalBaseSchema } from '../src/schema.js';

const validMetadata = {
  name: 'com.example.package',
  aliases: [],
  repoUrl: 'https://github.com/example/package',
  displayName: 'Example Package',
  description: 'Example package description',
  licenseSpdxId: 'MIT',
  licenseName: 'MIT License',
  topics: ['utilities'],
  hunter: 'hunter',
  createdAt: 1_700_000_000_000,
  trackingMode: 'git',
};

describe('PackageMetadataLocalBaseSchema', () => {
  it('requires aliases as an array', () => {
    expect(PackageMetadataLocalBaseSchema.parse(validMetadata).aliases).toEqual(
      [],
    );

    expect(() =>
      PackageMetadataLocalBaseSchema.parse({
        ...validMetadata,
        aliases: undefined,
      }),
    ).toThrow();
    expect(() =>
      PackageMetadataLocalBaseSchema.parse({
        ...validMetadata,
        aliases: null,
      }),
    ).toThrow();
    expect(() =>
      PackageMetadataLocalBaseSchema.parse({
        ...validMetadata,
        aliases: 'com.example.old',
      }),
    ).toThrow();
  });
});
