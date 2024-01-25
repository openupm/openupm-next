import { getKeywords } from '../../src/utils/keyword.js';

describe('getKeywords', function () {
  it('should get getKeywords 1', async function () {
    const result = await getKeywords(
      'UniTask Provides an efficient async/await integration to Unity.',
      5,
    );
    expect(result).toEqual({
      keywords: ['unitask', 'async'],
      keyphrases: [],
    });
  });
  it('should get getKeywords 2', async function () {
    const result = await getKeywords('Compilation Visualizer', 5);
    expect(result).toEqual({
      keywords: ['compilation', 'visualizer'],
      keyphrases: ['compilation visualizer'],
    });
  });
});
