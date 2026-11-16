jest.mock('llama.rn', () => ({
  initLlama: jest.fn(),
  releaseAllLlama: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: {
    DocumentDirectoryPath: '/documents',
    exists: jest.fn().mockResolvedValue(true),
    stat: jest.fn().mockResolvedValue({size: '1024'}),
  },
}));

jest.mock('react-native-device-info', () => ({
  __esModule: true,
  default: {
    getTotalMemory: jest.fn().mockResolvedValue(8 * 1024 * 1024 * 1024),
    getUsedMemory: jest.fn().mockResolvedValue(1024 * 1024 * 1024),
  },
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {get: jest.fn()},
}));

const createLoadedModel = () => {
  jest.resetModules();

  const llama = require('llama.rn');
  const calls = [];
  llama.initLlama.mockImplementation(async () => ({
    completion: async ({messages}) => {
      calls.push(messages);
      return {text: `reply-${calls.length}`};
    },
  }));

  return {
    ...require('../src/model/model'),
    calls,
  };
};

describe('generateResponse cache', () => {
  test('does not reuse a reply when earlier conversation context changes', async () => {
    const {loadModel, generateResponse, calls} = createLoadedModel();
    await loadModel('model.gguf');

    const first = await generateResponse([
      {role: 'user', content: 'I am in week 12.'},
      {role: 'user', content: 'What should I focus on?'},
    ]);
    const second = await generateResponse([
      {role: 'user', content: 'I am in week 32.'},
      {role: 'user', content: 'What should I focus on?'},
    ]);

    expect(first).toBe('reply-1');
    expect(second).toBe('reply-2');
    expect(calls).toHaveLength(2);
  });

  test('does not reuse a reply when the system prompt changes', async () => {
    const {loadModel, generateResponse, calls} = createLoadedModel();
    await loadModel('model.gguf');

    const first = await generateResponse([
      {role: 'system', content: 'Answer as a concise pregnancy assistant.'},
      {role: 'user', content: 'What should I focus on?'},
    ]);
    const second = await generateResponse([
      {role: 'system', content: 'Answer only with a checklist.'},
      {role: 'user', content: 'What should I focus on?'},
    ]);

    expect(first).toBe('reply-1');
    expect(second).toBe('reply-2');
    expect(calls).toHaveLength(2);
  });

  test('reuses a reply for the same effective prompt and loaded model', async () => {
    const {loadModel, generateResponse, calls} = createLoadedModel();
    await loadModel('model.gguf');
    const conversation = [
      {role: 'system', content: 'Be concise.'},
      {role: 'user', content: 'What should I focus on?'},
    ];

    const first = await generateResponse(conversation);
    const second = await generateResponse(conversation);

    expect(first).toBe('reply-1');
    expect(second).toBe('reply-1');
    expect(calls).toHaveLength(1);
  });

  test('does not reuse a reply after switching the loaded model', async () => {
    const {loadModel, generateResponse, calls} = createLoadedModel();
    const conversation = [
      {role: 'system', content: 'Be concise.'},
      {role: 'user', content: 'What should I focus on?'},
    ];

    await loadModel('model-a.gguf');
    const first = await generateResponse(conversation);
    await loadModel('model-b.gguf');
    const second = await generateResponse(conversation);

    expect(first).toBe('reply-1');
    expect(second).toBe('reply-2');
    expect(calls).toHaveLength(2);
  });

  test('does not reuse a reply after unloading and reloading the same model', async () => {
    const {loadModel, unloadModel, generateResponse, calls} =
      createLoadedModel();
    const conversation = [
      {role: 'system', content: 'Be concise.'},
      {role: 'user', content: 'What should I focus on?'},
    ];

    await loadModel('model.gguf');
    const first = await generateResponse(conversation);
    await unloadModel();
    await loadModel('model.gguf');
    const second = await generateResponse(conversation);

    expect(first).toBe('reply-1');
    expect(second).toBe('reply-2');
    expect(calls).toHaveLength(2);
  });

  test('does not cache a completion that finishes after the model is unloaded', async () => {
    const {loadModel, unloadModel, generateResponse, calls} =
      createLoadedModel();
    const llama = require('llama.rn');
    let resolveFirstCompletion;
    const firstCompletion = new Promise(resolve => {
      resolveFirstCompletion = resolve;
    });
    let completionCount = 0;

    llama.initLlama.mockImplementation(async () => ({
      completion: async ({messages}) => {
        calls.push(messages);
        completionCount += 1;
        if (completionCount === 1) {
          return firstCompletion;
        }
        return {text: `reply-${completionCount}`};
      },
    }));

    const conversation = [{role: 'user', content: 'What should I focus on?'}];
    await loadModel('model.gguf');
    const pendingFirst = generateResponse(conversation);
    await Promise.resolve();

    await unloadModel();
    await loadModel('model.gguf');
    const second = await generateResponse(conversation);
    resolveFirstCompletion({text: 'reply-1'});
    const first = await pendingFirst;
    const cachedAfterOldCompletion = await generateResponse(conversation);

    expect(first).toBe('reply-1');
    expect(second).toBe('reply-2');
    expect(cachedAfterOldCompletion).toBe('reply-2');
    expect(calls).toHaveLength(2);
  });

  test('does not retain oversized conversation keys in the response cache', async () => {
    const {loadModel, generateResponse, calls} = createLoadedModel();
    await loadModel('model.gguf');
    const conversation = [{role: 'user', content: 'x'.repeat(17_000)}];

    const first = await generateResponse(conversation);
    const second = await generateResponse(conversation);

    expect(first).toBe('reply-1');
    expect(second).toBe('reply-2');
    expect(calls).toHaveLength(2);
  });
});
