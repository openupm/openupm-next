/* eslint-disable jest/no-standalone-expect */
import { it } from '@fast-check/jest';

import { reverseDomainName } from '../src/arbitraries.js';

describe('arbitraries', function () {
  it.prop([reverseDomainName])('should return the https protocol', (name) => {
    expect(name).toContain('.');
  });
});
