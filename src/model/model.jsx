import { Alert } from "react-native";
import { initLlama, releaseAllLlama } from "llama.rn";
import RNFS from "react-native-fs";
import axios from "axios";
import DeviceInfo from "react-native-device-info";
import { MODEL_NAME, HF_TO_GGUF } from "../data/modelConfig";

let context = null;

const MAX_CACHE_SIZE = 100;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const responseCache = new Map();

const setCache = (key, value) => {
  // Enforce size limit
  if (responseCache.size >= MAX_CACHE_SIZE) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
  responseCache.set(key, {value, timestamp: Date.now()});
};

const getCache = key => {
  const entry = responseCache.get(key);
  if (!entry) return null;

  // Check expiration
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return entry.value;
};

export const fetchAvailableGGUFs = async () => {
  try {
    const repoPath = HF_TO_GGUF;
    if (!repoPath)
      throw new Error(`No repository mapping found for ${MODEL_NAME}`);

    const response = await axios.get(
      `https://huggingface.co/api/models/${repoPath}`,
    );
    if (!response.data?.siblings)
      throw new Error('Invalid API response format');

    return response.data.siblings
      .filter(file => file.rfilename.endsWith('.gguf'))
      .map(file => file.rfilename);
  } catch (error) {
    Alert.alert('Error', error.message || 'Failed to fetch .gguf files');
    return [];
  }
};

export const checkMemoryBeforeLoading = async modelPath => {
  try {
    const stats = await RNFS.stat(modelPath);
    const fileSizeMB = Number(stats.size) / (1024 * 1024);

    if (!Number.isFinite(fileSizeMB) || fileSizeMB <= 0) {
      Alert.alert('Invalid model file', 'The model file is empty or invalid. Please download it again.');
      return false;
    }

    // Check RAM, not free disk storage. Loading a GGUF model requires RAM
    // in addition to the on-disk model size, so use a conservative estimate.
    const totalMemoryBytes = await DeviceInfo.getTotalMemory();
    const usedMemoryBytes = await DeviceInfo.getUsedMemory();
    const totalMemoryMB = Number(totalMemoryBytes) / (1024 * 1024);
    const usedMemoryMB = Number(usedMemoryBytes) / (1024 * 1024);
    const estimatedAvailableRAMMB = totalMemoryMB - usedMemoryMB;

    if (
      Number.isFinite(estimatedAvailableRAMMB) &&
      estimatedAvailableRAMMB > 0 &&
      fileSizeMB * 1.5 > estimatedAvailableRAMMB
    ) {
      Alert.alert(
        'Not enough memory',
        `This model is about ${Math.round(fileSizeMB)} MB, but the device may not have enough available RAM to load it safely. Close other apps or use a smaller GGUF model.`,
      );
      return false;
    }

    return true;
  } catch (error) {
    // If the device memory API is unavailable, don't fail solely because of
    // the estimate. The native model loader can still fail, so callers must
    // catch and report that failure.
    console.warn('Could not estimate memory before loading model:', error?.message);
    return true;
  }
};

export const downloadModel = async (fileName, onProgress) => {
  if (!HF_TO_GGUF || !fileName) {
    Alert.alert('Model configuration error', 'The model repository or filename is missing.');
    return null;
  }

  const downloadUrl = `https://huggingface.co/${HF_TO_GGUF}/resolve/main/${encodeURIComponent(fileName)}`;
  const destPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
  const tempPath = `${destPath}.download`;

  try {
    // Reuse only a non-empty file. loadModel performs the actual initialization.
    if (await RNFS.exists(destPath)) {
      const existing = await RNFS.stat(destPath);
      if (Number(existing.size) > 0) {
        const loaded = await loadModel(fileName);
        return loaded ? destPath : null;
      }
      await RNFS.unlink(destPath);
    }

    // Remove a previous interrupted download.
    if (await RNFS.exists(tempPath)) {
      await RNFS.unlink(tempPath);
    }

    const download = await RNFS.downloadFile({
      fromUrl: downloadUrl,
      toFile: tempPath,
      progress: res => {
        if (
          typeof onProgress === 'function' &&
          res.contentLength > 0
        ) {
          onProgress(res.bytesWritten / res.contentLength);
        }
      },
      background: false,
      discretionary: false,
    }).promise;

    if (download.statusCode < 200 || download.statusCode >= 300) {
      throw new Error(`Model download failed (HTTP ${download.statusCode}). Check your internet connection and model URL.`);
    }

    if (!(await RNFS.exists(tempPath))) {
      throw new Error('Download failed: the downloaded file was not created.');
    }

    const downloadedStats = await RNFS.stat(tempPath);
    if (!Number(downloadedStats.size)) {
      throw new Error('The downloaded model is empty. Please try again.');
    }

    // Only move into the final location after the download completes.
    await RNFS.moveFile(tempPath, destPath);

    const loaded = await loadModel(fileName);
    if (!loaded) {
      // Keep the downloaded file so the user can retry loading later.
      return null;
    }

    return destPath;
  } catch (error) {
    try {
      if (await RNFS.exists(tempPath)) await RNFS.unlink(tempPath);
    } catch (cleanupError) {
      console.warn('Could not clean up partial model download:', cleanupError?.message);
    }
    console.error('Model download/load failed:', error);
    Alert.alert(
      'Unable to prepare AI model',
      error?.message || 'The model could not be downloaded or loaded. Please try again.',
    );
    return null;
  }
};

export const loadModel = async modelName => {
  try {
    const destPath = `${RNFS.DocumentDirectoryPath}/${modelName}`;
    if (!(await RNFS.exists(destPath))) {
      Alert.alert('Error', `Model file not found at ${destPath}`);
      return false;
    }

    if (context) {
      await releaseAllLlama();
      context = null;
    }

    if (!(await checkMemoryBeforeLoading(destPath))) return false;

    context = await initLlama({
      model: destPath,
      n_ctx: 4096,
      n_gpu_layers: 0, // Disabled GPU layers to fix emulator lag/hang
      n_threads: 2, // Reduced threads for emulator stability
    });
    if (__DEV__) console.log('Model context initialized.');
    return true;
  } catch (error) {
    Alert.alert(
      'Error Loading Model',
      error.message || 'An unknown error occurred.',
    );
    return false;
  }
};

export const unloadModel = async () => {
  try {
    if (context) {
      if (__DEV__) console.log('Releasing model context...');
      await releaseAllLlama();
      context = null;
      if (__DEV__) console.log('Model context released.');
    }
  } catch (error) {
    console.error('Failed to release model context:', error);
  }
};

export const generateResponse = async conversation => {
  if (!Array.isArray(conversation)) {
    console.warn(
      'generateResponse: conversation is not an array',
      conversation,
    );
    return null;
  }

  const lastMessage = conversation.filter(msg => msg?.role === 'user').pop();
  const cacheKey = lastMessage?.content?.trim();

  if (cacheKey) {
    const cachedResponse = getCache(cacheKey);
    if (cachedResponse) {
      console.log('Returning cached response for:', cacheKey);
      return cachedResponse;
    }
  }

  const stopWords = [
    '</s>',
    '<|end|>',
    'user:',
    'assistant:',
    '<|im_end|>',
    '<|eot_id|>',
    '<|end▁of▁sentence|>',
  ];

  try {
    // Check if conversation already has a system message
    const hasSystemMessage = conversation.some(msg => msg.role === 'system');

    let messagesToSend = conversation;

    // If no system message exists, add a default pregnancy assistant prompt
    if (!hasSystemMessage) {
      const defaultSystemMessage = {
        role: 'system',
        content:
          'You are a highly specialized AI assistant focused on pregnancy-related topics. ' +
          'Your expertise includes maternal health, fetal development, prenatal care, and pregnancy well-being. ' +
          '- Provide responses that are concise, clear, and easy to understand. ' +
          '- Maintain a warm, empathetic, and supportive tone to reassure users. ' +
          '- Prioritize factual, evidence-based information while keeping answers short. ' +
          '- If a question is outside pregnancy-related topics, gently redirect the user to relevant discussions. ' +
          '- Avoid unnecessary details, deliver crisp, to-the-point answers with care and compassion.',
      };
      messagesToSend = [defaultSystemMessage, ...conversation];
    }

    if (__DEV__) console.log('Starting inference...');
    const startTime = Date.now();
    const result = await context.completion({
      messages: messagesToSend,
      n_predict: 256, // Reduced from 500 for faster felt response
      stop: stopWords,
    });
    if (__DEV__) {
      const endTime = Date.now();
      console.log(`⚡ Inference Time: ${endTime - startTime}ms`);
    }

    const response = result?.text?.trim();

    // Cache the successful response
    if (response && cacheKey) {
      setCache(cacheKey, response);
    }

    return response;
  } catch (error) {
    Alert.alert(
      'Error During Inference',
      error.message || 'An unknown error occurred.',
    );
    return null;
  }
};

export const generateRAGResponse = async (userQuery, systemPrompt) => {
  if (typeof userQuery !== 'string' || !userQuery.trim()) {
    console.warn('generateRAGResponse: user query must be a non-empty string');
    return null;
  }

  try {
    if (!context) {
      if (!MODEL_NAME || !HF_TO_GGUF) {
        throw new Error('AI model configuration is missing. Please check MODEL_NAME and HF_TO_GGUF in your environment configuration.');
      }

      const modelPath = `${RNFS.DocumentDirectoryPath}/${MODEL_NAME}`;
      const modelExists = await RNFS.exists(modelPath);

      if (modelExists) {
        const loaded = await loadModel(MODEL_NAME);
        if (!loaded) {
          throw new Error('The downloaded AI model could not be loaded. Your device may not have enough memory, or the model file may be invalid.');
        }
      } else {
        const availableModels = await fetchAvailableGGUFs();

        if (!availableModels.includes(MODEL_NAME)) {
          throw new Error(
            `Model file "${MODEL_NAME}" was not found in the Hugging Face repository "${HF_TO_GGUF}".`,
          );
        }

        // No progress callback is required; downloadModel now handles it safely.
        const downloadedPath = await downloadModel(MODEL_NAME);
        if (!downloadedPath || !context) {
          throw new Error('The AI model could not be downloaded or initialized. Check your connection and try again.');
        }
      }
    }

    if (!context) {
      throw new Error('The AI model is not ready yet. Please retry in a moment.');
    }

    const query = userQuery.trim();
    const messagesToSend = [
      {role: 'system', content: systemPrompt || 'Extract the requested information and return valid JSON only.'},
      {role: 'user', content: query},
    ];

    const result = await context.completion({
      messages: messagesToSend,
      n_predict: 256,
      temperature: 0,
      stop: [
        '</s>',
        '<|end|>',
        '<|im_end|>',
        '<|eot_id|>',
        '<|end▁of▁sentence|>',
      ],
    });

    const rawResponse = result?.text?.trim();
    if (!rawResponse) {
      throw new Error('The AI model returned an empty response. Please try again.');
    }

    const cleanedResponse = rawResponse
      .replace(/^```(?:json)?\\s*/i, '')
      .replace(/\\s*```$/, '')
      .trim();

    let extracted;
    try {
      extracted = JSON.parse(cleanedResponse);
    } catch (parseError) {
      const start = cleanedResponse.indexOf('{');
      const end = cleanedResponse.lastIndexOf('}');
      if (start === -1 || end <= start) {
        throw new Error('The AI model did not return valid JSON. Please try again.');
      }
      extracted = JSON.parse(cleanedResponse.slice(start, end + 1));
    }

    if (!extracted || typeof extracted !== 'object' || Array.isArray(extracted)) {
      throw new Error('The AI model returned data in an unexpected format.');
    }

    if (__DEV__) {
      console.log('Extracted intent:', extracted.intent);
      console.log('Extracted data:', extracted.data);
    }

    return extracted;
  } catch (error) {
    console.error('generateRAGResponse failed:', error);
    Alert.alert(
      'BabyNest AI unavailable',
      error?.message || 'The AI assistant could not start. Please try again.',
    );
    return null;
  }
};
