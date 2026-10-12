import {Alert} from 'react-native';
import {initLlama, releaseAllLlama} from 'llama.rn';
import RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';

jest.mock('llama.rn', () => ({
  initLlama: jest.fn(),
  releaseAllLlama: jest.fn(),
}));
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/models',
  exists: jest.fn(),
  stat: jest.fn(),
}));
jest.mock('react-native-device-info', () => ({
  getFreeDiskStorage: jest.fn(),
}));
jest.mock('axios', () => ({}));

const question = 'What should I focus on?';
const conversation = (week = 12) => [
  {role: 'user', content: `I am in week ${week}.`},
  {role: 'user', content: question},
];

describe('model response cache', () => {
  let model;
  let completion;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(0);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    completion = jest.fn().mockImplementation(async () => ({
      text: `reply-${completion.mock.calls.length}`,
    }));
    initLlama.mockResolvedValue({completion});
    releaseAllLlama.mockResolvedValue(undefined);
    RNFS.exists.mockResolvedValue(true);
    RNFS.stat.mockResolvedValue({size: 200 * 1024 * 1024});
    DeviceInfo.getFreeDiskStorage.mockResolvedValue(1024 * 1024 * 1024);
    // A fresh module gives each test its own context and response cache.
    jest.isolateModules(() => {
      model = require('../src/model/model');
    });
    await model.loadModel('first.gguf');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('does not reuse a reply when earlier user history changes', async () => {
    expect(await model.generateResponse(conversation(12))).toBe('reply-1');
    expect(await model.generateResponse(conversation(32))).toBe('reply-2');
    expect(completion).toHaveBeenCalledTimes(2);
    expect(completion.mock.calls[1][0].messages).toEqual(
      expect.arrayContaining([{role: 'user', content: 'I am in week 32.'}]),
    );
  });

  it.each(['assistant', 'system'])(
    'does not reuse a reply when an earlier %s message changes',
    async role => {
      const history = content => [
        {role, content},
        {role: 'user', content: question},
      ];
      await model.generateResponse(history('First context'));
      expect(await model.generateResponse(history('Changed context'))).toBe(
        'reply-2',
      );
      expect(completion).toHaveBeenCalledTimes(2);
    },
  );

  it('includes message order and roles in the cache key', async () => {
    const first = [
      {role: 'user', content: 'First'},
      {role: 'assistant', content: 'Second'},
      {role: 'user', content: question},
    ];
    await model.generateResponse(first);
    await model.generateResponse([first[1], first[0], first[2]]);
    await model.generateResponse([
      {...first[0], role: 'assistant'},
      first[1],
      first[2],
    ]);
    expect(completion).toHaveBeenCalledTimes(3);
  });

  it('does not trim message content when comparing prompts', async () => {
    await model.generateResponse([{role: 'user', content: question}]);
    await model.generateResponse([{role: 'user', content: ` ${question} `}]);
    expect(completion).toHaveBeenCalledTimes(2);
  });

  it('reuses an identical effective prompt and includes the default system prompt', async () => {
    const history = conversation();
    const original = JSON.parse(JSON.stringify(history));
    expect(await model.generateResponse(history)).toBe('reply-1');
    expect(await model.generateResponse(conversation())).toBe('reply-1');
    const effectivePrompt = completion.mock.calls[0][0].messages;
    expect(effectivePrompt[0].role).toBe('system');
    expect(await model.generateResponse(effectivePrompt)).toBe('reply-1');
    expect(completion).toHaveBeenCalledTimes(1);
    expect(history).toEqual(original);
  });

  it('expires a cached reply after 30 minutes', async () => {
    await model.generateResponse(conversation());
    jest.advanceTimersByTime(30 * 60 * 1000 + 1);
    expect(await model.generateResponse(conversation())).toBe('reply-2');
    expect(completion).toHaveBeenCalledTimes(2);
  });

  it('evicts the oldest entry after 100 distinct prompts', async () => {
    for (let i = 0; i < 101; i++) {
      await model.generateResponse([{role: 'user', content: `Question ${i}`}]);
    }
    await model.generateResponse([{role: 'user', content: 'Question 100'}]);
    expect(completion).toHaveBeenCalledTimes(101);
    await model.generateResponse([{role: 'user', content: 'Question 0'}]);
    expect(completion).toHaveBeenCalledTimes(102);
  });

  it.each(['first.gguf', 'second.gguf'])(
    'invalidates cached replies when loading %s',
    async filename => {
      await model.generateResponse(conversation());
      const nextCompletion = jest.fn().mockResolvedValue({text: 'new model'});
      initLlama.mockResolvedValue({completion: nextCompletion});
      await model.loadModel(filename);
      expect(await model.generateResponse(conversation())).toBe('new model');
      expect(nextCompletion).toHaveBeenCalledTimes(1);
    },
  );

  it('cannot return cached replies after the model is unloaded', async () => {
    await model.generateResponse(conversation());
    await model.unloadModel();
    expect(await model.generateResponse(conversation())).toBeNull();
    expect(completion).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('does not reuse a cached reply after a failed replacement load', async () => {
    await model.generateResponse(conversation());
    initLlama.mockRejectedValueOnce(new Error('load failed'));
    expect(await model.loadModel('second.gguf')).toBe(false);
    expect(await model.generateResponse(conversation())).toBeNull();
  });

  it('does not let an in-flight reply repopulate a new model cache', async () => {
    let finish;
    completion.mockImplementationOnce(
      () => new Promise(resolve => { finish = resolve; }),
    );
    const pending = model.generateResponse(conversation());
    const nextCompletion = jest.fn().mockResolvedValue({text: 'new model'});
    initLlama.mockResolvedValue({completion: nextCompletion});
    await model.loadModel('second.gguf');
    finish({text: 'old model'});
    await pending;
    expect(await model.generateResponse(conversation())).toBe('new model');
    expect(nextCompletion).toHaveBeenCalledTimes(1);
  });

  it.each(['load', 'unload'])(
    'cannot infer using the old model while %s is releasing it',
    async operation => {
      await model.generateResponse(conversation());
      let release;
      releaseAllLlama.mockImplementationOnce(
        () => new Promise(resolve => { release = resolve; }),
      );
      const nextCompletion = jest.fn().mockResolvedValue({text: 'new model'});
      initLlama.mockResolvedValue({completion: nextCompletion});
      const transition = operation === 'load'
        ? model.loadModel('second.gguf')
        : model.unloadModel();
      // loadModel first awaits its file-existence check.
      await Promise.resolve();
      expect(await model.generateResponse(conversation())).toBeNull();
      expect(completion).toHaveBeenCalledTimes(1);
      release();
      await transition;
      if (operation === 'unload') {
        await model.loadModel('second.gguf');
      }
      expect(await model.generateResponse(conversation())).toBe('new model');
      expect(nextCompletion).toHaveBeenCalledTimes(1);
    },
  );

  it('isolates replies when overlapping loads finish at different times', async () => {
    const deferred = () => {
      let resolve;
      const promise = new Promise(done => { resolve = done; });
      return {promise, resolve};
    };
    const readyA = deferred();
    const readyB = deferred();
    const resultA = deferred();
    const resultB = deferred();
    initLlama
      .mockImplementationOnce(() => {
        readyA.resolve();
        return resultA.promise;
      })
      .mockImplementationOnce(() => {
        readyB.resolve();
        return resultB.promise;
      });
    const loadingA = model.loadModel('a.gguf');
    await readyA.promise;
    const loadingB = model.loadModel('b.gguf');
    await readyB.promise;
    const completionA = jest.fn().mockResolvedValue({text: 'model A'});
    const completionB = jest.fn().mockResolvedValue({text: 'model B'});
    resultA.resolve({completion: completionA});
    await loadingA;
    expect(await model.generateResponse(conversation())).toBe('model A');
    resultB.resolve({completion: completionB});
    await loadingB;
    expect(await model.generateResponse(conversation())).toBe('model B');
    expect(completionB).toHaveBeenCalledTimes(1);
  });

  it('does not cache an empty result', async () => {
    completion.mockResolvedValueOnce({text: '   '});
    expect(await model.generateResponse(conversation())).toBe('');
    expect(await model.generateResponse(conversation())).toBe('reply-2');
    expect(completion).toHaveBeenCalledTimes(2);
  });

  it('does not cache an inference error', async () => {
    completion.mockRejectedValueOnce(new Error('inference failed'));
    expect(await model.generateResponse(conversation())).toBeNull();
    expect(await model.generateResponse(conversation())).toBe('reply-2');
    expect(completion).toHaveBeenCalledTimes(2);
  });
});
