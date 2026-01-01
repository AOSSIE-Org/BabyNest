import { Alert } from "react-native";
import { initLlama, releaseAllLlama } from "llama.rn";
import RNFS from "react-native-fs";
import axios from "axios";
import DeviceInfo from "react-native-device-info";
import {MODEL_NAME, HF_TO_GGUF, GGUF_FILE} from "@env";

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
  responseCache.set(key, { value, timestamp: Date.now() });
};


const getCache = (key) => {
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

    const response = await axios.get(`https://huggingface.co/api/models/${repoPath}`);
    if (!response.data?.siblings) 
        throw new Error("Invalid API response format");

    return response.data.siblings.filter(file => file.rfilename.endsWith(".gguf")).map(file => file.rfilename);
  } catch (error) {
    Alert.alert("Error", error.message || "Failed to fetch .gguf files");
    return [];
  }
};

export const checkMemoryBeforeLoading = async (modelPath) => {
  const stats = await RNFS.stat(modelPath);
  const fileSizeMB = stats.size / (1024 * 1024);
  const availableMemoryMB = (await DeviceInfo.getFreeDiskStorage()) / (1024 * 1024);

  if (fileSizeMB > availableMemoryMB * 0.8) {
    Alert.alert("Low Memory", "The model may be too large to load!");
    return false;
  }

  if(fileSizeMB < 100){
    Alert.alert("Corrupted Model", "The model may be corrupted. Please download again.");
    return false;
  }
  return true;
};

export const downloadModel = async (fileName, onProgress) => {
  const downloadUrl = `https://huggingface.co/${HF_TO_GGUF}/resolve/main/${fileName}`;
  const destPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

  if (await RNFS.exists(destPath)) {
    const loaded = await loadModel(fileName);
    if (!loaded) return null;
    return destPath;
  }

  try {
    await RNFS.downloadFile({
      fromUrl: downloadUrl,
      toFile: destPath,
      progress: (res) => {
        if (res.contentLength > 0) onProgress(res.bytesWritten / res.contentLength);
      },
      background: true,
      discretionary: true,
    }).promise;

    if (!(await RNFS.exists(destPath))) throw new Error("Download failed. File does not exist.");
    const loaded = await loadModel(fileName);
    if (!loaded) return null;
    return destPath;
  } 
  catch (error) {
    Alert.alert("Error", error.message || "Failed to download model.");
    return null;
  }
};

export const loadModel = async (modelName) => {
  try {
    const destPath = `${RNFS.DocumentDirectoryPath}/${modelName}`;
    if (!(await RNFS.exists(destPath))) {
      Alert.alert("Error", `Model file not found at ${destPath}`);
      return false;
    }

    if (context) {
      await releaseAllLlama();
      context = null;
    }

    if (!(await checkMemoryBeforeLoading(destPath))) return false;

    context = await initLlama({
        model: destPath, 
        n_ctx: 2048,
        n_gpu_layers: 0 
    });
    console.log("Model context initialized.");
    return true;
  } catch (error) {
    Alert.alert("Error Loading Model", error.message || "An unknown error occurred.");
    return false;
  }
};

export const unloadModel = async () => {
  try {
    if (context) {
      console.log("Releasing model context...");
      await releaseAllLlama();
      context = null;
      console.log("Model context released.");
    }
  } catch (error) {
    console.error("Failed to release model context:", error);
  }
};

export const generateResponse = async (conversation) => {
    if (!context) {
      Alert.alert("Model Not Loaded", "Please load the model first.");
      return null;
    }

    const lastMessage = conversation.filter(msg => msg.role === "user").pop();
    const cacheKey = lastMessage?.content?.trim();

    if (cacheKey) {
      const cachedResponse = getCache(cacheKey);
      if (cachedResponse) {
        console.log("Returning cached response for:", cacheKey);
        return cachedResponse;
      }
    }
  
    const stopWords = [
      "</s>", 
      "<|end|>", 
      "user:", 
      "assistant:", 
      "<|im_end|>", 
      "<|eot_id|>", 
      "<|end▁of▁sentence|>"
    ];
  
    try {
      // Check if conversation already has a system message
      const hasSystemMessage = conversation.some(msg => msg.role === "system");
      
      let messagesToSend = conversation;
      
      // If no system message exists, add a default pregnancy assistant prompt
      if (!hasSystemMessage) {
        const defaultSystemMessage = {
          role: "system",
          content: "You are a highly specialized AI assistant focused on pregnancy-related topics. " +
            "Your expertise includes maternal health, fetal development, prenatal care, and pregnancy well-being. " +
            "- Provide responses that are concise, clear, and easy to understand. " +
            "- Maintain a warm, empathetic, and supportive tone to reassure users. " +
            "- Prioritize factual, evidence-based information while keeping answers short. " +
            "- If a question is outside pregnancy-related topics, gently redirect the user to relevant discussions. " +
            "- Avoid unnecessary details, deliver crisp, to-the-point answers with care and compassion."
        };
        messagesToSend = [defaultSystemMessage, ...conversation];
      }
  
      console.log("Starting inference...");
      const startTime = Date.now();
      const result = await context.completion({
        messages: messagesToSend,
        n_predict: 500,
        stop: stopWords
      });
      const endTime = Date.now();
      console.log(`⚡ Inference Time: ${endTime - startTime}ms`);
  
      const response = result?.text?.trim();
      return response;

    } catch (error) {
      Alert.alert("Error During Inference", error.message || "An unknown error occurred.");
      return null;
    }
  };
  

