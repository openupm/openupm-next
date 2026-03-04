import fc from 'fast-check';

import { reverseDomainName } from '../src/arbitraries.js';

describe('arbitraries', function () {
  // Just a dummy test to make sure the arbitraries can be imported.
  it('should return contains dot', () => {
    fc.assert(
      fc.property(reverseDomainName, (name) => {
        expect(name).toContain('.');
      }),
    );
  });
});
