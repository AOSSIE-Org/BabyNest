/**
 * @format
 * Tests for useChatEngine hook
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChatEngine } from '../src/hooks/useChatEngine';
import { generateResponse } from '../src/model/model';
import { conversationContext } from '../src/services/ConversationContext';
import { ragService } from '../src/services/RAGService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/model/model', () => ({
  generateResponse: jest.fn(() => Promise.resolve('Mock AI response')),
}));

jest.mock('../src/services/RAGService', () => ({
  ragService: {
    processQuery: jest.fn(() => Promise.resolve({ message: 'RAG response' })),
  },
}));

jest.mock('../src/services/ConversationContext', () => ({
  conversationContext: {
    addMessage: jest.fn(),
    setUserContext: jest.fn(),
    hasPendingFollowUp: jest.fn(() => false),
    clearConversationHistory: jest.fn(),
    clearPendingFollowUp: jest.fn(),
  },
}));

describe('useChatEngine', () => {
  let engineInstance;

  function TestHook({ onInstance }) {
    const engine = useChatEngine(true, { user: 'test' }, jest.fn());
    onInstance(engine);
    return null;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with empty conversation when storage is empty', async () => {
    await act(async () => {
      ReactTestRenderer.create(
        <TestHook onInstance={inst => (engineInstance = inst)} />
      );
    });

    expect(engineInstance.conversation).toEqual([]);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('chat_history');
  });

  it('loads existing chat history from AsyncStorage', async () => {
    const savedChats = [
      { id: '1', role: 'user', content: 'Hello' },
      { id: '2', role: 'assistant', content: 'Hi there' },
    ];
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(savedChats));

    await act(async () => {
      ReactTestRenderer.create(
        <TestHook onInstance={inst => (engineInstance = inst)} />
      );
    });

    expect(engineInstance.conversation).toEqual(savedChats);
    expect(conversationContext.addMessage).toHaveBeenCalledWith('user', 'Hello');
    expect(conversationContext.addMessage).toHaveBeenCalledWith('assistant', 'Hi there');
  });

  it('sends a message and invokes the model with updated conversation', async () => {
    await act(async () => {
      ReactTestRenderer.create(
        <TestHook onInstance={inst => (engineInstance = inst)} />
      );
    });

    await act(async () => {
      await engineInstance.sendMessage('Hello model', false);
    });

    expect(generateResponse).toHaveBeenCalledTimes(1);
    const passedHistory = generateResponse.mock.calls[0][0];
    expect(passedHistory.length).toBe(1);
    expect(passedHistory[0].content).toBe('Hello model');
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('avoids stale closure by passing accumulated history on rapid sequential messages', async () => {
    await act(async () => {
      ReactTestRenderer.create(
        <TestHook onInstance={inst => (engineInstance = inst)} />
      );
    });

    await act(async () => {
      await engineInstance.sendMessage('First message', false);
    });

    await act(async () => {
      await engineInstance.sendMessage('Second message', false);
    });

    expect(generateResponse).toHaveBeenCalledTimes(2);
    const secondCallHistory = generateResponse.mock.calls[1][0];
    expect(secondCallHistory.some(m => m.content === 'First message')).toBe(true);
    expect(secondCallHistory.some(m => m.content === 'Second message')).toBe(true);
  });

  it('clears conversation and storage on clearConversation', async () => {
    await act(async () => {
      ReactTestRenderer.create(
        <TestHook onInstance={inst => (engineInstance = inst)} />
      );
    });

    await act(async () => {
      await engineInstance.sendMessage('Test message', false);
    });

    await act(async () => {
      await engineInstance.clearConversation();
    });

    expect(engineInstance.conversation).toEqual([]);
    expect(conversationContext.clearConversationHistory).toHaveBeenCalled();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('chat_history', '[]');
  });
});
