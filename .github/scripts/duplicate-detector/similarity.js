const STOP_WORDS = new Set([
  'a', 'about', 'above', 'actual', 'after', 'again', 'against', 'all', 'am',
  'an',
  'and', 'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before',
  'behavior', 'behaviour', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'checklist',
  'could', 'did', 'do', 'does', 'doing', 'done', 'down', 'during', 'each',
  'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he',
  'her', 'here', 'hers', 'him', 'his', 'how', 'i', 'if', 'in', 'into',
  'is', 'it', 'its', 'just', 'me', 'more', 'most', 'my', 'no', 'nor',
  'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'out',
  'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'we', 'were', 'what', 'when', 'which', 'while', 'who',
  'whom', 'why', 'will', 'with', 'would', 'you', 'your',
  'add', 'added', 'adding', 'change', 'changed', 'changes', 'close',
  'closed', 'closes', 'code', 'collaborated', 'collaboration', 'conduct',
  'context', 'contributing', 'current', 'currently', 'dependent',
  'describe', 'description', 'detail', 'details', 'docs', 'documentation',
  'downstream', 'existing', 'expected', 'feature', 'features', 'fix',
  'fixed', 'fixes', 'fixing', 'follow', 'guidelines', 'implement',
  'implementation', 'implemented', 'implementing', 'improvement',
  'improvements', 'issue', 'issues',
  'merged', 'modules', 'necessary', 'need', 'needed', 'needs', 'new',
  'please', 'problem', 'problems', 'project', 'projects', 'pull',
  'pr', 'published', 'record', 'related', 'reproduce', 'request',
  'requests', 'resolve',
  'resolved', 'resolves', 'screenshot', 'screenshots', 'steps', 'support',
  'supported', 'supports', 'suggested', 'test', 'tests', 'thank', 'thanks',
  'time',
  'update', 'updated', 'updates', 'use', 'used', 'using', 'visual', 'want',
  'wants', 'work', 'working', 'works', 'yes',
]);

const BOILERPLATE_PATTERNS = [
  /is your feature request related to a problem\??/gi,
  /yes,?\s*it is related to a problem/gi,
  /describe the feature you'?d like/gi,
  /provide a clear and concise description[^.]*\.?/gi,
  /feature description/gi,
  /problem statement/gi,
  /expected outcome/gi,
  /screenshots? and design ideas/gi,
  /additional context/gi,
  /is there an existing issue for this\??/gi,
  /i have searched the existing issues/gi,
  /what happened\??/gi,
  /steps to reproduce/gi,
  /expected behavior/gi,
  /actual behavior/gi,
  /suggested improvements/gi,
  /i agree to follow this project'?s code of conduct/gi,
  /i want to work on (?:implementing )?this (?:feature|issue)/gi,
  /thanks for taking the time to fill out this bug report!?/gi,
  /thanks for suggesting a new feature!?/gi,
  /what issue does this pr close\??/gi,
  /changes made/gi,
  /screenshots or visual changes(?: \(if applicable\))?/gi,
  /collaborated with:.*$/gim,
  /i have read the contributing guidelines\.?/gi,
  /i have added tests that prove my fix is effective or that my feature works\.?/gi,
  /i have added necessary documentation(?: \(if applicable\))?\.?/gi,
  /any dependent changes have been merged and published in downstream modules\.?/gi,
  /close[sd]?\s*#?\d+/gi,
  /fix(?:e[sd])?\s*#?\d+/gi,
  /resolve[sd]?\s*#?\d+/gi,
];

function normalizeText(input) {
  let text = String(input || '');

  text = text.replace(/<!--[\s\S]*?-->/g, ' ');
  text = text.replace(/\x60\x60\x60[\s\S]*?\x60\x60\x60/g, ' ');
  text = text.replace(/\x60/g, ' ');
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, ' $1 ');
  text = text.replace(/https?:\/\/\S+/gi, ' ');
  text = text.replace(/<[^>]+>/g, ' ');

  for (const pattern of BOILERPLATE_PATTERNS) {
    text = text.replace(pattern, ' ');
  }

  text = text.replace(/^\s*[-*+]\s+\[[ xX]\]\s*/gm, ' ');
  text = text.replace(/^\s*[-*+]\s+/gm, ' ');
  text = text.replace(/[#>*_~|`]+/g, ' ');
  text = text.toLowerCase();
  text = text.replace(/[^a-z0-9]+/g, ' ');

  return text.replace(/\s+/g, ' ').trim();
}

function normalizeTitle(title) {
  let text = String(title || '').replace(/^[^a-z0-9[]+/i, '');

  let previous;
  do {
    previous = text;
    text = text.replace(/^\s*\[[^\]]+\]\s*/, '');
  } while (text !== previous);

  text = text.replace(
    /^\s*(?:bug|feature request|feature|enhancement|improvement|fix|docs?|chore|refactor)\s*[:-]\s*/i,
    ''
  );
  text = text.replace(/^\s*[:-]\s*/, '');

  return normalizeText(text);
}

function normalizeBody(body) {
  return normalizeText(body);
}

function undoubleConsonant(word) {
  return /([b-df-hj-np-tv-z])\1$/.test(word) ? word.slice(0, -1) : word;
}

function stem(word) {
  if (word.length <= 3) {
    return word;
  }

  if (word.endsWith('ies') && word.length > 4) {
    return `${word.slice(0, -3)}y`;
  }

  if (word.endsWith('sses') && word.length > 5) {
    return word.slice(0, -2);
  }

  if (word.endsWith('ing') && word.length > 6) {
    return undoubleConsonant(word.slice(0, -3));
  }

  if (word.endsWith('ed') && word.length > 5) {
    return undoubleConsonant(word.slice(0, -2));
  }

  if (word.endsWith('es') && word.length > 4) {
    const base = word.slice(0, -2);
    if (/(?:s|x|z|ch|sh)$/.test(base)) {
      return base;
    }

    return word.slice(0, -1);
  }

  if (word.endsWith('s') && word.length > 3 && !/(?:ss|us|is)$/.test(word)) {
    return word.slice(0, -1);
  }

  return word;
}

function tokenize(text) {
  const tokens = [];

  for (const rawToken of String(text || '').split(/\s+/)) {
    const token = rawToken.trim();
    if (token.length < 2 || /^\d+$/.test(token)) {
      continue;
    }

    const stemmed = stem(token);
    if (STOP_WORDS.has(token) || STOP_WORDS.has(stemmed)) {
      continue;
    }

    if (stemmed.length < 2) {
      continue;
    }

    tokens.push(stemmed);
  }

  return tokens;
}

function jaccardSimilarity(a, b) {
  if (!a.size || !b.size) {
    return 0;
  }

  let intersection = 0;
  for (const value of a) {
    if (b.has(value)) {
      intersection += 1;
    }
  }

  return intersection / (a.size + b.size - intersection);
}

function trigramSet(text) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  const grams = new Set();

  for (let index = 0; index <= value.length - 3; index += 1) {
    grams.add(value.slice(index, index + 3));
  }

  return grams;
}

function trigramSimilarity(a, b) {
  const aGrams = trigramSet(a);
  const bGrams = trigramSet(b);

  if (!aGrams.size || !bGrams.size) {
    return 0;
  }

  let intersection = 0;
  for (const gram of aGrams) {
    if (bGrams.has(gram)) {
      intersection += 1;
    }
  }

  return (2 * intersection) / (aGrams.size + bGrams.size);
}

function buildTfIdfVectors(documents) {
  const documentFrequency = new Map();
  const termFrequencies = documents.map(document => {
    const frequencies = new Map();

    for (const term of document) {
      frequencies.set(term, (frequencies.get(term) || 0) + 1);
    }

    for (const term of frequencies.keys()) {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    }

    return frequencies;
  });

  const documentCount = documents.length;

  return termFrequencies.map(frequencies => {
    const vector = new Map();
    let totalTerms = 0;

    for (const count of frequencies.values()) {
      totalTerms += count;
    }

    if (totalTerms === 0) {
      return vector;
    }

    for (const [term, count] of frequencies) {
      const idf =
        Math.log((documentCount + 1) / ((documentFrequency.get(term) || 0) + 1)) +
        1;
      vector.set(term, (count / totalTerms) * idf);
    }

    return vector;
  });
}

function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;

  for (const [term, value] of a) {
    aMagnitude += value * value;
    const bValue = b.get(term);
    if (bValue) {
      dotProduct += value * bValue;
    }
  }

  for (const value of b.values()) {
    bMagnitude += value * value;
  }

  if (!aMagnitude || !bMagnitude) {
    return 0;
  }

  return dotProduct / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude));
}

function prepareDocument(item) {
  const title = normalizeTitle(item.title);
  const body = normalizeBody(item.body);
  const titleTokens = tokenize(title);
  const bodyTokens = tokenize(body);

  return {
    title,
    titleTokens,
    bodyTokens,
    combinedTokens: [
      ...titleTokens,
      ...titleTokens,
      ...titleTokens,
      ...bodyTokens,
    ],
  };
}

function rankCandidates(current, candidates, options = {}) {
  const settings = {
    threshold: 0.7,
    maxMatches: 3,
    minSharedTokens: 4,
    ...options,
  };

  if (!candidates.length) {
    return [];
  }

  const currentDocument = prepareDocument(current);
  const currentTokenSet = new Set([
    ...currentDocument.titleTokens,
    ...currentDocument.bodyTokens,
  ]);
  const candidateDocuments = candidates.map(prepareDocument);
  const vectors = buildTfIdfVectors([
    currentDocument.combinedTokens,
    ...candidateDocuments.map(document => document.combinedTokens),
  ]);
  const currentVector = vectors[0];

  const matches = [];

  candidateDocuments.forEach((candidateDocument, index) => {
    const candidate = candidates[index];
    const tfidfScore = cosineSimilarity(currentVector, vectors[index + 1]);
    const titleSimilarity = Math.max(
      jaccardSimilarity(
        new Set(currentDocument.titleTokens),
        new Set(candidateDocument.titleTokens)
      ),
      trigramSimilarity(currentDocument.title, candidateDocument.title)
    );
    const candidateTokenSet = new Set([
      ...candidateDocument.titleTokens,
      ...candidateDocument.bodyTokens,
    ]);

    let sharedTokens = 0;
    for (const token of currentTokenSet) {
      if (candidateTokenSet.has(token)) {sharedTokens += 1;}
    }

    const smallerTokenCount = Math.min(
      currentTokenSet.size,
      candidateTokenSet.size
    );
    const requiredSharedTokens = Math.min(
      settings.minSharedTokens,
      Math.max(2, Math.floor(smallerTokenCount / 2))
    );
    const exactTitle =
      Boolean(currentDocument.title) &&
      currentDocument.title === candidateDocument.title;

    let score;
    if (exactTitle) {
      score = 1;
    } else if (sharedTokens < requiredSharedTokens) {
      score = 0;
    } else {
      score = 0.7 * tfidfScore + 0.3 * titleSimilarity;

      const shorterTitle =
        currentDocument.title.length <= candidateDocument.title.length
          ? currentDocument.title
          : candidateDocument.title;
      const longerTitle =
        currentDocument.title.length <= candidateDocument.title.length
          ? candidateDocument.title
          : currentDocument.title;

      if (shorterTitle.length >= 12 && longerTitle.includes(shorterTitle)) {
        score = Math.max(score, 0.85);
      }

      score = Math.min(1, score);
    }

    if (score >= settings.threshold) {
      matches.push({
        candidate,
        score,
        tfidfScore,
        titleSimilarity,
        sharedTokens,
      });
    }
  });

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, settings.maxMatches);
}

module.exports = {
  buildTfIdfVectors,
  cosineSimilarity,
  jaccardSimilarity,
  normalizeBody,
  normalizeText,
  normalizeTitle,
  rankCandidates,
  stem,
  tokenize,
  trigramSimilarity,
};
