const {
  normalizeBody,
  normalizeTitle,
  rankCandidates,
  tokenize,
} = require('../.github/scripts/duplicate-detector/similarity');
const detect = require('../.github/scripts/duplicate-detector/index');

const baseOptions = {
  threshold: 0.7,
  maxMatches: 3,
  minSharedTokens: 4,
};

describe('duplicate detector text preparation', () => {
  test('normalizes issue and pull request title prefixes', () => {
    expect(normalizeTitle('BUG: App crashes on launch')).toBe(
      'app crashes on launch'
    );
    expect(normalizeTitle('FEATURE REQUEST: Add dark mode')).toBe(
      'add dark mode'
    );
    expect(
      normalizeTitle('\\BUG: AI appointment rescheduling fails')
    ).toBe('ai appointment rescheduling fails');
    expect(
      normalizeTitle('[HIGH] SettingsScreen notification button non-functional')
    ).toBe('settingsscreen notification button non functional');
  });

  test('removes template boilerplate, comments, and URLs', () => {
    const body = [
      '<!-- What issue does this PR close? -->',
      'Closes #123',
      '',
      '## Feature Description',
      'Add dark mode to the settings screen.',
      '',
      '## Additional Context',
      'See https://example.com for details.',
      '- [x] I agree to follow this project\'s Code of Conduct',
    ].join('\n');

    const normalized = normalizeBody(body);

    expect(normalized).toContain('dark mode');
    expect(normalized).not.toContain('feature description');
    expect(normalized).not.toContain('additional context');
    expect(normalized).not.toContain('agreement');
    expect(normalized).not.toContain('agree');
    expect(normalized).not.toContain('http');
    expect(normalized).not.toContain('123');
  });

  test('keeps inline code identifiers but removes fenced code blocks', () => {
    expect(
      normalizeBody(
        'Use `update_profile` in `Backend/routes/profile.py`.\n\n```js\nconst ignored = true;\n```'
      )
    ).toBe('use update profile in backend routes profile py');
  });

  test('tokenizes, removes stop words, and normalizes suffixes', () => {
    expect(tokenize('crashes opening notifications')).toEqual([
      'crash',
      'open',
      'notification',
    ]);
    expect(tokenize('the and a')).toEqual([]);
  });
});

describe('duplicate detector ranking', () => {
  test('matches identical titles after prefix normalization', () => {
    const matches = rankCandidates(
      { title: 'BUG: Add dark mode', body: 'Dark theme support.' },
      [
        {
          number: 1,
          title: 'FEATURE REQUEST: Add dark mode',
          body: 'Please add a dark theme.',
        },
      ],
      { ...baseOptions, threshold: 0.5 }
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].score).toBe(1);
  });

  test('does not shortcut single-token exact titles', () => {
    const current = {
      title: 'Error',
      body: 'Completely unrelated content.',
    };
    const candidate = {
      number: 4,
      title: 'Error',
      body: 'Separate material entirely.',
    };

    expect(rankCandidates(current, [candidate], baseOptions)).toEqual([]);

    const [match] = rankCandidates(current, [candidate], {
      ...baseOptions,
      threshold: 0,
      minSharedTokens: 0,
    });

    expect(match.score).toBeLessThan(1);
  });

  test('detects a near-duplicate title and body', () => {
    const current = {
      title: 'BUG: App crashes when opening the AI chat',
      body:
        'The app closes unexpectedly whenever I open the AI chat screen.',
    };
    const candidate = {
      number: 7,
      title: 'App crash when opening AI chat screen',
      body:
        'Opening the AI chat causes the app to crash unexpectedly.',
    };

    const matches = rankCandidates(current, [candidate], baseOptions);

    expect(matches).toHaveLength(1);
    expect(matches[0].candidate.number).toBe(7);
    expect(matches[0].score).toBeGreaterThanOrEqual(0.7);
  });

  test('does not match unrelated issues', () => {
    const current = {
      title: 'Add dark mode',
      body: 'Support a dark theme in settings.',
    };
    const candidate = {
      number: 9,
      title: 'Fix notification scheduling',
      body: 'Reminders are not delivered on Android.',
    };

    expect(rankCandidates(current, [candidate], baseOptions)).toEqual([]);
  });

  test('ranks the closest match first and honors maxMatches', () => {
    const current = {
      title: 'BUG: Add dark mode',
      body: 'Support a dark theme in settings.',
    };
    const candidates = [
      {
        number: 2,
        title: 'Add dark theme',
        body: 'Dark mode support in settings.',
      },
      {
        number: 3,
        title: 'FEATURE REQUEST: Add dark mode',
        body: 'Add a dark theme.',
      },
    ];

    const matches = rankCandidates(current, candidates, baseOptions);

    expect(matches[0].candidate.number).toBe(3);
    expect(matches[0].score).toBe(1);
    expect(
      rankCandidates(current, candidates, {
        ...baseOptions,
        maxMatches: 1,
      })
    ).toHaveLength(1);
  });
});

describe('duplicate detector GitHub helpers', () => {
  test('skips bots, skipped labels, and empty items', () => {
    expect(
      detect.shouldSkip({
        user: { type: 'Bot' },
        title: 'Test',
        body: 'Test',
        labels: [],
      })
    ).toBe(true);
    expect(
      detect.shouldSkip({
        user: { type: 'User' },
        title: 'Test',
        body: 'Test',
        labels: [{ name: 'spam' }],
      })
    ).toBe(true);
    expect(
      detect.shouldSkip({
        user: { type: 'User' },
        title: null,
        body: null,
        labels: [],
      })
    ).toBe(true);
    expect(
      detect.shouldSkip({
        user: { type: 'User' },
        title: 'Test',
        body: null,
        labels: [],
      })
    ).toBe(false);
  });

  test('filters candidate issues and pull requests', async () => {
    const now = new Date().toISOString();
    const github = {
      rest: {
        issues: {
          listForRepo: jest.fn().mockResolvedValue({
            data: [
              {
                number: 13,
                title: 'Newer issue',
                body: 'Newer body',
                labels: [],
                user: { type: 'User' },
                created_at: now,
              },
              {
                number: 10,
                title: 'Current issue',
                body: 'Current body',
                labels: [],
                user: { type: 'User' },
                created_at: now,
              },
              {
                number: 9,
                title: 'Valid issue',
                body: 'Valid body',
                labels: [],
                user: { type: 'User' },
                created_at: now,
              },
              {
                number: 8,
                title: 'Spam issue',
                body: 'Spam body',
                labels: [{ name: 'spam' }],
                user: { type: 'User' },
                created_at: now,
              },
              {
                number: 7,
                title: 'Bot issue',
                body: 'Bot body',
                labels: [],
                user: { type: 'Bot' },
                created_at: now,
              },
              {
                number: 2,
                title: 'Old issue',
                body: 'Old body',
                labels: [],
                user: { type: 'User' },
                created_at: '2020-01-01T00:00:00Z',
              },
            ],
          }),
        },
      },
    };

    const candidates = await detect.fetchCandidates({
      github,
      owner: 'owner',
      repo: 'repo',
      currentNumber: 10,
    });

    expect(candidates.map(candidate => candidate.number)).toEqual([9]);
  });

  test('finds an existing bot comment by marker', async () => {
    const github = {
      rest: {
        issues: {
          listComments: jest.fn(),
        },
      },
      paginate: jest.fn().mockResolvedValue([
        {
          id: 1,
          body: 'Regular comment',
          user: { login: 'github-actions[bot]' },
        },
        {
          id: 2,
          body: `${detect.MARKER}\nDuplicate details`,
          user: { login: 'github-actions[bot]' },
        },
      ]),
    };

    const comment = await detect.findBotComment({
      github,
      owner: 'owner',
      repo: 'repo',
      number: 1,
    });

    expect(comment.id).toBe(2);
  });

  test('sanitizes and truncates matched titles', () => {
    expect(detect.sanitizeTitle('@user <script>\nNext line')).toBe(
      'user script Next line'
    );
    expect(detect.sanitizeTitle('[HIGH] Add `dark mode`')).toBe(
      'HIGH Add dark mode'
    );
    expect(detect.sanitizeTitle('')).toBe('(untitled)');

    const longTitle = 'a'.repeat(200);
    const sanitized = detect.sanitizeTitle(longTitle);
    expect(sanitized).toHaveLength(120);
    expect(sanitized.endsWith('...')).toBe(true);
  });

  test('builds a comment with links and similarity information', () => {
    const body = detect.buildComment({
      isPullRequest: false,
      matches: [
        {
          candidate: {
            number: 42,
            title: 'BUG: Add dark mode',
            state: 'open',
          },
          score: 0.91,
        },
      ],
    });

    expect(body).toContain(detect.MARKER);
    expect(body).toContain('#42');
    expect(body).toContain('91% similar');
    expect(body).toContain('possible-duplicate');
    expect(body).toContain('issue');
  });
});

describe('duplicate detector workflow behavior', () => {
  test('does not write when no duplicate is found', async () => {
    const github = {
      rest: {
        issues: {
          get: jest.fn().mockResolvedValue({
            data: {
              number: 2,
              title: 'Add dark mode',
              body: 'Support a dark theme in settings.',
              labels: [],
              user: { type: 'User' },
            },
          }),
          listForRepo: jest.fn().mockResolvedValue({
            data: [
              {
                number: 1,
                title: 'Fix notification scheduling',
                body: 'Reminders are not delivered on Android.',
                labels: [],
                user: { type: 'User' },
                created_at: new Date().toISOString(),
                state: 'open',
              },
            ],
          }),
          createComment: jest.fn(),
          addLabels: jest.fn(),
        },
      },
      paginate: jest.fn().mockResolvedValue([]),
    };
    const core = { info: jest.fn(), warning: jest.fn() };

    await detect({
      github,
      context: {
        repo: { owner: 'owner', repo: 'repo' },
        payload: { issue: { number: 2 } },
      },
      core,
    });

    expect(github.rest.issues.createComment).not.toHaveBeenCalled();
    expect(github.rest.issues.addLabels).not.toHaveBeenCalled();
    expect(core.warning).not.toHaveBeenCalled();
  });

  test('cleans up stale results when no candidates remain', async () => {
    const github = {
      rest: {
        issues: {
          get: jest.fn().mockResolvedValue({
            data: {
              number: 2,
              title: 'Add dark mode',
              body: 'Support a dark theme in settings.',
              labels: [{ name: 'possible-duplicate' }],
              user: { type: 'User' },
            },
          }),
          listForRepo: jest.fn().mockResolvedValue({ data: [] }),
          updateComment: jest.fn().mockResolvedValue({}),
          removeLabel: jest.fn().mockResolvedValue({}),
          createComment: jest.fn(),
          addLabels: jest.fn(),
        },
      },
      paginate: jest.fn().mockResolvedValue([
        {
          id: 99,
          body: `${detect.MARKER}\nOld duplicate results`,
          user: { login: 'github-actions[bot]' },
        },
      ]),
    };
    const core = { info: jest.fn(), warning: jest.fn() };

    await detect({
      github,
      context: {
        repo: { owner: 'owner', repo: 'repo' },
        payload: { issue: { number: 2 } },
      },
      core,
    });

    expect(github.rest.issues.updateComment).toHaveBeenCalledWith(
      expect.objectContaining({
        comment_id: 99,
        body: expect.stringContaining('No likely duplicates were found'),
      })
    );
    expect(github.rest.issues.removeLabel).toHaveBeenCalledWith(
      expect.objectContaining({
        issue_number: 2,
        name: 'possible-duplicate',
      })
    );
    expect(github.rest.issues.createComment).not.toHaveBeenCalled();
    expect(github.rest.issues.addLabels).not.toHaveBeenCalled();
    expect(core.warning).not.toHaveBeenCalled();
  });

  test('adds the label and comments when a duplicate is found', async () => {
    const github = {
      rest: {
        issues: {
          get: jest.fn().mockResolvedValue({
            data: {
              number: 2,
              title: 'BUG: Add dark mode',
              body: 'Support a dark theme in settings.',
              labels: [],
              user: { type: 'User' },
            },
          }),
          listForRepo: jest.fn().mockResolvedValue({
            data: [
              {
                number: 1,
                title: 'FEATURE REQUEST: Add dark mode',
                body: 'Add a dark theme.',
                labels: [],
                user: { type: 'User' },
                created_at: new Date().toISOString(),
                state: 'open',
              },
            ],
          }),
          getLabel: jest.fn().mockResolvedValue({
            data: { name: 'possible-duplicate' },
          }),
          createComment: jest.fn().mockResolvedValue({ data: { id: 99 } }),
          updateComment: jest.fn(),
          addLabels: jest.fn().mockResolvedValue({}),
        },
      },
      paginate: jest.fn().mockResolvedValue([]),
    };
    const core = { info: jest.fn(), warning: jest.fn() };

    await detect({
      github,
      context: {
        repo: { owner: 'owner', repo: 'repo' },
        payload: { issue: { number: 2 } },
      },
      core,
    });

    expect(github.rest.issues.addLabels).toHaveBeenCalledWith(
      expect.objectContaining({
        issue_number: 2,
        labels: ['possible-duplicate'],
      })
    );
    expect(github.rest.issues.createComment).toHaveBeenCalled();
    expect(
      github.rest.issues.createComment.mock.calls[0][0].body
    ).toContain('#1');
    expect(core.warning).not.toHaveBeenCalled();
  });
});
