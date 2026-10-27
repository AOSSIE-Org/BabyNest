import {Alert} from 'react-native';
import RNFS from 'react-native-fs';
import {initLlama} from 'llama.rn';
import DeviceInfo from 'react-native-device-info';
import axios from 'axios';
import {downloadModel, unloadModel} from '../src/model/model';

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/documents',
  exists: jest.fn(),
  stat: jest.fn(),
  read: jest.fn(),
  hash: jest.fn(),
  unlink: jest.fn(),
  moveFile: jest.fn(),
  downloadFile: jest.fn(),
}));
jest.mock('llama.rn', () => ({
  initLlama: jest.fn(),
  releaseAllLlama: jest.fn(),
}));
jest.mock('react-native-device-info', () => ({
  getTotalMemory: jest.fn(),
  getUsedMemory: jest.fn(),
}));
jest.mock('axios', () => ({get: jest.fn()}));
jest.mock('../src/data/modelConfig', () => ({
  MODEL_NAME: 'model.gguf',
  HF_TO_GGUF: 'test/models',
}));

const fileName = 'model.gguf';
const destPath = `/documents/${fileName}`;
const tempPath = `${destPath}.download`;
const modelSize = 200 * 1024 * 1024;
const sha256 = 'a'.repeat(64);
const revision = 'b'.repeat(40);
const validFile = {size: modelSize, magic: 'GGUF', hash: sha256};
let files;
let transfer;

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  files = new Map();
  transfer = {
    file: {...validFile},
    statusCode: 200,
    bytesWritten: modelSize,
    contentLength: modelSize,
  };
  RNFS.exists.mockImplementation(async path => files.has(path));
  RNFS.stat.mockImplementation(async path => {
    if (!files.has(path)) {
      throw new Error('File not found');
    }
    return {size: files.get(path).size};
  });
  RNFS.read.mockImplementation(async path => files.get(path).magic);
  RNFS.hash.mockImplementation(async path => files.get(path).hash);
  RNFS.unlink.mockImplementation(async path => {
    files.delete(path);
  });
  RNFS.moveFile.mockImplementation(async (from, to) => {
    if (files.has(to)) {
      throw new Error('Destination already exists');
    }
    files.set(to, files.get(from));
    files.delete(from);
  });
  RNFS.downloadFile.mockImplementation(options => ({
    promise: (async () => {
      options.begin?.({contentLength: transfer.contentLength});
      options.progress?.({
        contentLength: transfer.contentLength,
        bytesWritten: transfer.bytesWritten,
      });
      if (transfer.file) {
        files.set(options.toFile, transfer.file);
      }
      if (transfer.error) {
        throw transfer.error;
      }
      return {
        statusCode: transfer.statusCode,
        bytesWritten: transfer.bytesWritten,
      };
    })(),
  }));
  axios.get.mockResolvedValue({
    data: {
      sha: revision,
      siblings: [{rfilename: fileName, size: modelSize, lfs: {sha256}}],
    },
  });
  initLlama.mockResolvedValue({completion: jest.fn()});
  DeviceInfo.getTotalMemory.mockResolvedValue(8 * 1024 ** 3);
  DeviceInfo.getUsedMemory.mockResolvedValue(1024 ** 3);
});

afterEach(async () => {
  await unloadModel();
  jest.restoreAllMocks();
});

it.each([0, 10])(
  'replaces a %i-byte cached model before loading it',
  async size => {
    files.set(destPath, {...validFile, size});

    await expect(downloadModel(fileName)).resolves.toBe(destPath);

    expect(RNFS.downloadFile).toHaveBeenCalledTimes(1);
    expect(initLlama).toHaveBeenCalledTimes(1);
    expect(initLlama).toHaveBeenCalledWith(
      expect.objectContaining({model: destPath}),
    );
    expect(files.get(destPath)).toEqual(validFile);
    expect(files.has(tempPath)).toBe(false);
    expect(RNFS.hash.mock.invocationCallOrder[0]).toBeLessThan(
      RNFS.unlink.mock.invocationCallOrder[0],
    );
  },
);

it('replaces a cached non-GGUF response without trying to initialize it', async () => {
  files.set(destPath, {...validFile, magic: '<htm'});

  await expect(downloadModel(fileName)).resolves.toBe(destPath);

  expect(RNFS.downloadFile).toHaveBeenCalledTimes(1);
  expect(initLlama).toHaveBeenCalledTimes(1);
});

it('recovers a truncated cached file with an intact GGUF header', async () => {
  files.set(destPath, {...validFile, size: modelSize / 2});
  initLlama.mockRejectedValueOnce(new Error('Failed to load model'));

  await expect(downloadModel(fileName)).resolves.toBe(destPath);

  expect(RNFS.downloadFile).toHaveBeenCalledTimes(1);
  expect(files.get(destPath)).toEqual(validFile);
});

it('recovers a same-size corrupt cached file after a load failure', async () => {
  files.set(destPath, {...validFile, hash: 'c'.repeat(64)});
  initLlama.mockRejectedValueOnce(new Error('Failed to load model'));

  await expect(downloadModel(fileName)).resolves.toBe(destPath);

  expect(RNFS.hash).toHaveBeenCalledWith(destPath, 'sha256');
  expect(RNFS.downloadFile).toHaveBeenCalledTimes(1);
});

it('reuses a valid cached model offline without metadata or a download', async () => {
  files.set(destPath, validFile);
  axios.get.mockRejectedValue(new Error('Offline'));

  await expect(downloadModel(fileName)).resolves.toBe(destPath);

  expect(axios.get).not.toHaveBeenCalled();
  expect(RNFS.downloadFile).not.toHaveBeenCalled();
  expect(RNFS.unlink).not.toHaveBeenCalled();
});

it('keeps a verified model after a transient loading failure and retries loading', async () => {
  files.set(destPath, validFile);
  initLlama.mockRejectedValueOnce(new Error('Temporary native failure'));

  await expect(downloadModel(fileName)).resolves.toBeNull();
  await expect(downloadModel(fileName)).resolves.toBe(destPath);

  expect(files.get(destPath)).toBe(validFile);
  expect(RNFS.downloadFile).not.toHaveBeenCalled();
  expect(RNFS.unlink).not.toHaveBeenCalled();
});

it('keeps a valid model when the memory guard prevents initialization', async () => {
  files.set(destPath, validFile);
  DeviceInfo.getTotalMemory.mockResolvedValue(100 * 1024 * 1024);
  DeviceInfo.getUsedMemory.mockResolvedValue(0);

  await expect(downloadModel(fileName)).resolves.toBeNull();

  expect(files.get(destPath)).toBe(validFile);
  expect(initLlama).not.toHaveBeenCalled();
  expect(RNFS.downloadFile).not.toHaveBeenCalled();
  expect(RNFS.unlink).not.toHaveBeenCalled();
});

it('keeps a cached file if metadata cannot confirm why loading failed', async () => {
  files.set(destPath, validFile);
  initLlama.mockRejectedValue(new Error('Failed to load model'));
  axios.get.mockRejectedValue(new Error('Offline'));

  await expect(downloadModel(fileName)).resolves.toBeNull();

  expect(files.get(destPath)).toBe(validFile);
  expect(RNFS.unlink).not.toHaveBeenCalled();
  expect(RNFS.downloadFile).not.toHaveBeenCalled();
});

it.each(['stat', 'read', 'hash'])(
  'does not delete a model on a %s I/O failure',
  async operation => {
    files.set(destPath, validFile);
    initLlama.mockRejectedValue(new Error('Failed to load model'));
    RNFS[operation].mockRejectedValue(new Error('I/O failure'));

    await expect(downloadModel(fileName)).resolves.toBeNull();

    expect(files.get(destPath)).toBe(validFile);
    expect(RNFS.unlink).not.toHaveBeenCalled();
    expect(RNFS.downloadFile).not.toHaveBeenCalled();
  },
);

it('downloads the metadata revision, validates it, then promotes and loads it', async () => {
  const onProgress = jest.fn();

  await expect(downloadModel(fileName, onProgress)).resolves.toBe(destPath);

  expect(axios.get).toHaveBeenCalledWith(
    'https://huggingface.co/api/models/test/models',
    {params: {blobs: true}, timeout: 10000},
  );
  expect(RNFS.downloadFile).toHaveBeenCalledWith(
    expect.objectContaining({
      fromUrl: `https://huggingface.co/test/models/resolve/${revision}/${fileName}`,
      toFile: tempPath,
    }),
  );
  expect(onProgress).toHaveBeenCalledWith(1);
  expect(RNFS.hash).toHaveBeenCalledWith(tempPath, 'sha256');
  expect(RNFS.hash.mock.invocationCallOrder[0]).toBeLessThan(
    RNFS.moveFile.mock.invocationCallOrder[0],
  );
  expect(RNFS.moveFile.mock.invocationCallOrder[0]).toBeLessThan(
    initLlama.mock.invocationCallOrder[0],
  );
});

it.each([
  ['HTTP error', {statusCode: 404}],
  ['partial HTTP response', {statusCode: 206}],
  ['missing status', {statusCode: undefined}],
  ['missing file', {file: null}],
  ['empty file', {file: {...validFile, size: 0}, bytesWritten: 0}],
  [
    'truncated file',
    {file: {...validFile, size: modelSize / 2}, bytesWritten: modelSize / 2},
  ],
  ['wrong written byte count', {bytesWritten: modelSize - 1}],
  ['wrong content length', {contentLength: modelSize + 1}],
  ['invalid header', {file: {...validFile, magic: '<htm'}}],
  ['checksum mismatch', {file: {...validFile, hash: 'c'.repeat(64)}}],
])('cleans up a %s and permits a fresh retry', async (_reason, changes) => {
  const successfulTransfer = {...transfer};
  Object.assign(transfer, changes);

  await expect(downloadModel(fileName)).resolves.toBeNull();

  expect(files.has(destPath)).toBe(false);
  expect(files.has(tempPath)).toBe(false);
  expect(RNFS.moveFile).not.toHaveBeenCalled();
  expect(initLlama).not.toHaveBeenCalled();

  transfer = successfulTransfer;
  await expect(downloadModel(fileName)).resolves.toBe(destPath);
  expect(RNFS.downloadFile).toHaveBeenCalledTimes(2);
});

it('validates a complete transfer when HTTP content length is unavailable', async () => {
  transfer.contentLength = -1;

  await expect(downloadModel(fileName)).resolves.toBe(destPath);

  expect(RNFS.hash).toHaveBeenCalledWith(tempPath, 'sha256');
});

it('recovers from repeated interrupted downloads and a stale temporary file', async () => {
  files.set(destPath, {...validFile, size: 10});
  files.set(tempPath, {...validFile, size: 20});
  transfer.file = {...validFile, size: modelSize / 2};
  transfer.error = new Error('Connection lost');

  await expect(downloadModel(fileName)).resolves.toBeNull();
  await expect(downloadModel(fileName)).resolves.toBeNull();
  expect(files.get(destPath).size).toBe(10);
  expect(files.has(tempPath)).toBe(false);
  expect(initLlama).not.toHaveBeenCalled();

  transfer.file = validFile;
  delete transfer.error;
  await expect(downloadModel(fileName)).resolves.toBe(destPath);
  expect(RNFS.downloadFile).toHaveBeenCalledTimes(3);
});

it('retains a newly validated download after initialization fails', async () => {
  initLlama.mockRejectedValueOnce(new Error('Temporary native failure'));

  await expect(downloadModel(fileName)).resolves.toBeNull();
  expect(files.get(destPath)).toEqual(validFile);
  await expect(downloadModel(fileName)).resolves.toBe(destPath);

  expect(RNFS.downloadFile).toHaveBeenCalledTimes(1);
});

it('reports cleanup failure without rejecting and removes the stale file on retry', async () => {
  transfer.error = new Error('Connection lost');
  RNFS.unlink.mockRejectedValueOnce(new Error('File is busy'));

  await expect(downloadModel(fileName)).resolves.toBeNull();
  expect(files.has(tempPath)).toBe(true);

  delete transfer.error;
  await expect(downloadModel(fileName)).resolves.toBe(destPath);
  expect(files.has(tempPath)).toBe(false);
});

it('cleans up a failed promotion and allows retry', async () => {
  RNFS.moveFile.mockRejectedValueOnce(new Error('Move failed'));

  await expect(downloadModel(fileName)).resolves.toBeNull();
  expect(files.has(tempPath)).toBe(false);
  expect(initLlama).not.toHaveBeenCalled();
  await expect(downloadModel(fileName)).resolves.toBe(destPath);
});

it.each([
  ['missing file', {sha: revision, siblings: []}],
  ['missing size', {sha: revision, siblings: [{rfilename: fileName}]}],
  ['missing revision', {siblings: [{rfilename: fileName, size: modelSize}]}],
  [
    'invalid checksum',
    {
      sha: revision,
      siblings: [
        {rfilename: fileName, size: modelSize, lfs: {sha256: 'invalid'}},
      ],
    },
  ],
])('does not download with invalid metadata: %s', async (_reason, data) => {
  axios.get.mockResolvedValue({data});

  await expect(downloadModel(fileName)).resolves.toBeNull();

  expect(RNFS.downloadFile).not.toHaveBeenCalled();
  expect(initLlama).not.toHaveBeenCalled();
});

it('accepts a small GGUF without LFS metadata when its exact size matches', async () => {
  const size = 1024;
  axios.get.mockResolvedValue({
    data: {sha: revision, siblings: [{rfilename: fileName, size}]},
  });
  transfer.file = {...validFile, size};
  transfer.bytesWritten = size;
  transfer.contentLength = size;

  await expect(downloadModel(fileName)).resolves.toBe(destPath);

  expect(RNFS.hash).not.toHaveBeenCalled();
  expect(initLlama).toHaveBeenCalledTimes(1);
});
