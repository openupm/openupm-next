import config from 'config';
import { toString } from 'nlcst-to-string';
import { retext } from 'retext';
import retextKeywords from 'retext-keywords';
import retextPos from 'retext-pos';

import { ignoreKeywords } from './ignoreKeywords.js';

export type KeywordResult = {
  keywords: string[];
  keyphrases: string[];
};

export async function getKeywords(
  text: string,
  maximum?: number,
): Promise<KeywordResult> {
  if (maximum === undefined) maximum = config.adKeywordMaxLimit;
  const file = await retext()
    .use(retextPos)
    .use(retextKeywords, { maximum })
    .process(text);
  // Build keywords.
  const keywords: string[] = [];
  if (file.data.keywords) {
    for (const keyword of file.data.keywords) {
      const text = toString(keyword.matches[0].node).toLowerCase();
      // Ignore text that match ignoreKeywords.
      if (ignoreKeywords.includes(text)) continue;
      keywords.push(text);
      if (keywords.length >= config.adKeywordMaxLimit) break;
    }
  }
  // Build keyphrases.
  const keyphrases: string[] = [];
  if (file.data.keyphrases) {
    for (const phrase of file.data.keyphrases) {
      const text = toString(phrase.matches[0].nodes).toLowerCase();
      // Ignore text that match ignoreKeywords.
      if (ignoreKeywords.includes(text)) continue;
      // Ignore text that are also keywords.
      if (keywords.includes(text)) continue;
      // Ignore text that has more than n tokens or less than 2 tokens.
      // For example, "Unity Editor" has 2 tokens.
      const tokens = text.split(' ');
      if (
        tokens.length > config.adKeywordMaxKeyphrasesTokenLimit ||
        tokens.length < 2
      )
        continue;
      keyphrases.push(text);
      if (keyphrases.length >= config.adKeywordMaxLimit) break;
    }
  }
  return { keywords, keyphrases };
}
