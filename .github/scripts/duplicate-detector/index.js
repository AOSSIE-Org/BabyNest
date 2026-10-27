const config = require('../../duplicate-detection.json');
const { rankCandidates } = require('./similarity');

const MARKER = '<!-- duplicate-detector:possible-duplicate -->';
const BOT_LOGIN = 'github-actions[bot]';

function itemLabels(item) {
  return (item.labels || []).map(label =>
    typeof label === 'string' ? label : label.name
  );
}

async function resolveTarget({ github, context }) {
  const number = Number(
    context.payload.issue?.number ||
      context.payload.pull_request?.number ||
      context.payload.inputs?.number
  );

  if (!Number.isInteger(number) || number <= 0) {
    throw new Error('No valid issue or pull request number found in the event');
  }

  const { owner, repo } = context.repo;
  const { data: item } = await github.rest.issues.get({
    owner,
    repo,
    issue_number: number,
  });

  return {
    owner,
    repo,
    number,
    item,
    isPullRequest: Boolean(item.pull_request),
  };
}

function shouldSkip(item) {
  const labels = itemLabels(item);

  if (config.skipBots && item.user?.type === 'Bot') {
    return true;
  }

  if (!item.title && !item.body) {
    return true;
  }

  return labels.some(label => config.skipLabels.includes(label));
}

async function fetchCandidates({ github, owner, repo, currentNumber }) {
  const pageSize = 100;
  const cutoff = Date.now() - config.candidateDays * 24 * 60 * 60 * 1000;
  const candidates = [];
  let reachedCutoff = false;

  for (
    let page = 1;
    !reachedCutoff && candidates.length < config.maxCandidates;
    page += 1
  ) {
    const { data } = await github.rest.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      sort: 'created',
      direction: 'desc',
      per_page: pageSize,
      page,
    });

    if (!data.length) {
      break;
    }

    for (const item of data) {
      const createdAt = new Date(item.created_at).getTime();

      if (Number.isFinite(createdAt) && createdAt < cutoff) {
        reachedCutoff = true;
        break;
      }

      if (item.number >= currentNumber) {
        continue;
      }

      if (!config.includePullRequests && item.pull_request) {
        continue;
      }

      if (config.skipBots && item.user?.type === 'Bot') {
        continue;
      }

      if (!item.title) {
        continue;
      }

      const labels = itemLabels(item);
      if (labels.some(label => config.skipLabels.includes(label))) {
        continue;
      }

      candidates.push(item);
      if (candidates.length >= config.maxCandidates) {
        break;
      }
    }

    if (data.length < pageSize) {
      break;
    }
  }

  return candidates;
}

async function ensureLabel({ github, owner, repo }) {
  try {
    await github.rest.issues.getLabel({
      owner,
      repo,
      name: config.label,
    });
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }

    await github.rest.issues.createLabel({
      owner,
      repo,
      name: config.label,
      color: config.labelColor,
      description: config.labelDescription,
    });
  }
}

async function findBotComment({ github, owner, repo, number }) {
  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number: number,
    per_page: 100,
  });

  return (
    comments.find(
      comment =>
        comment.user?.login === BOT_LOGIN &&
        typeof comment.body === 'string' &&
        comment.body.includes(MARKER)
    ) || null
  );
}

async function upsertComment({ github, owner, repo, number, body, existing }) {
  const comment =
    existing === undefined
      ? await findBotComment({ github, owner, repo, number })
      : existing;

  if (comment) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: comment.id,
      body,
    });
    return comment;
  }

  const { data } = await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: number,
    body,
  });

  return data;
}

async function removeLabel({ github, owner, repo, number }) {
  try {
    await github.rest.issues.removeLabel({
      owner,
      repo,
      issue_number: number,
      name: config.label,
    });
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }
  }
}

function sanitizeTitle(title) {
  const value = String(title || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[`<>[\]]/g, '')
    .replace(/@([A-Za-z0-9-]+)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (!value) {
    return '(untitled)';
  }

  if (value.length <= config.maxTitleLength) {
    return value;
  }

  return `${value.slice(0, config.maxTitleLength - 3)}...`;
}

function formatMatch(match) {
  const kind = match.candidate.pull_request ? 'PR' : 'issue';
  const state = match.candidate.state || 'unknown';
  const similarity = Math.round(match.score * 100);

  return `- #${match.candidate.number} - ${sanitizeTitle(
    match.candidate.title
  )} (${kind}, ${state}, ${similarity}% similar)`;
}

function buildComment({ matches, isPullRequest }) {
  const subject = isPullRequest ? 'pull request' : 'issue';
  const itemWord = matches.length === 1 ? 'item' : 'items';

  return [
    MARKER,
    '### Possible duplicate detected',
    '',
    `This ${subject} looks similar to existing ${itemWord}:`,
    '',
    ...matches.map(formatMatch),
    '',
    `If this is not a duplicate, a maintainer can remove the \`${config.label}\` label. This check is automated and may be incorrect.`,
  ].join('\n');
}

function buildNoMatchComment() {
  return [
    MARKER,
    '### Duplicate check updated',
    '',
    'No likely duplicates were found in the current issue tracker.',
  ].join('\n');
}

async function run({ github, context, core }) {
  try {
    const target = await resolveTarget({ github, context });

    if (shouldSkip(target.item)) {
      core.info(`Skipping #${target.number}: excluded item or label`);
      return;
    }

    const candidates = await fetchCandidates({
      github,
      owner: target.owner,
      repo: target.repo,
      currentNumber: target.number,
    });

    if (!candidates.length) {
      core.info(`No candidates found for #${target.number}`);
      return;
    }

    const matches = rankCandidates(
      { title: target.item.title, body: target.item.body },
      candidates,
      {
        threshold: config.threshold,
        maxMatches: config.maxMatches,
        minSharedTokens: config.minSharedTokens,
      }
    );
    const existingComment = await findBotComment({
      github,
      owner: target.owner,
      repo: target.repo,
      number: target.number,
    });

    if (!matches.length) {
      if (existingComment) {
        await upsertComment({
          github,
          owner: target.owner,
          repo: target.repo,
          number: target.number,
          body: buildNoMatchComment(),
          existing: existingComment,
        });
        await removeLabel({
          github,
          owner: target.owner,
          repo: target.repo,
          number: target.number,
        });
      }

      core.info(`No duplicate matches for #${target.number}`);
      return;
    }

    await ensureLabel({
      github,
      owner: target.owner,
      repo: target.repo,
    });

    await upsertComment({
      github,
      owner: target.owner,
      repo: target.repo,
      number: target.number,
      body: buildComment({
        matches,
        isPullRequest: target.isPullRequest,
      }),
      existing: existingComment,
    });

    await github.rest.issues.addLabels({
      owner: target.owner,
      repo: target.repo,
      issue_number: target.number,
      labels: [config.label],
    });

    if (config.autoClose && matches[0].score >= config.autoCloseThreshold) {
      if (target.isPullRequest) {
        await github.rest.pulls.update({
          owner: target.owner,
          repo: target.repo,
          pull_number: target.number,
          state: 'closed',
        });
      } else {
        await github.rest.issues.update({
          owner: target.owner,
          repo: target.repo,
          issue_number: target.number,
          state: 'closed',
          state_reason: 'duplicate',
        });
      }
    }

    const summary = matches
      .map(
        match =>
          `#${match.candidate.number} (${Math.round(match.score * 100)}%)`
      )
      .join(', ');

    core.info(`#${target.number}: matched ${summary}`);
  } catch (error) {
    core.warning(`Duplicate detection failed: ${error.message}`);
  }
}

module.exports = run;
module.exports.MARKER = MARKER;
module.exports.buildComment = buildComment;
module.exports.buildNoMatchComment = buildNoMatchComment;
module.exports.fetchCandidates = fetchCandidates;
module.exports.findBotComment = findBotComment;
module.exports.removeLabel = removeLabel;
module.exports.resolveTarget = resolveTarget;
module.exports.sanitizeTitle = sanitizeTitle;
module.exports.shouldSkip = shouldSkip;
module.exports.upsertComment = upsertComment;
