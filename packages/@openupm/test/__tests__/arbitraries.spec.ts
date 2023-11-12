/* eslint-disable jest/no-standalone-expect */
import { it } from '@fast-check/jest';

import { reverseDomainName } from '../src/arbitraries.js';

describe('arbitraries', function () {
  // Just a dummy test to make sure the arbitraries can be imported.
  it.prop([reverseDomainName])('should return contains dot', (name) => {
    expect(name).toContain('.');
  });
});
