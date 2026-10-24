/**
 * The chat tab stays mounted while the user changes data on other screens.
 * These tests check that the next chat message uses the changed data.
 */

import React from 'react';
import {act, create} from 'react-test-renderer';
import {AgentProvider, useAgentContext} from '../src/context/AgentContext';
import {useChatEngine} from '../src/hooks/useChatEngine';
import {ragService} from '../src/services/RAGService';
import {clearAllAgentContexts} from '../src/storage/agent';
import {addBPLog} from '../src/storage/bloodPressure';

const USER_ID = 1;

let mockBPLogs;
let mockProfileReadFails;

const rows = items => ({rows: {_array: items}});

const mockDb = {
  execute: jest.fn(async (sql, params = []) => {
    if (sql.includes('INSERT INTO blood_pressure_logs')) {
      const [week_number, systolic, diastolic, time, note] = params;
      mockBPLogs.push({
        id: mockBPLogs.length + 1,
        week_number,
        systolic,
        diastolic,
        time,
        note,
        created_at: '2026-10-20',
      });
      return {rowsAffected: 1, insertId: mockBPLogs.length};
    }
    if (sql.includes('FROM blood_pressure_logs')) {
      return rows([...mockBPLogs]);
    }
    if (sql.includes('FROM profile')) {
      if (mockProfileReadFails) {
        throw new Error('fixture read failure');
      }
      return rows([
        {
          id: USER_ID,
          user_name: 'Asha',
          lmp: '2026-03-01',
          cycleLength: 28,
          periodLength: 5,
          age: 28,
          weight: 60,
          user_location: 'Pune',
          dueDate: '2026-12-06',
        },
      ]);
    }
    return rows([]);
  }),
};

jest.mock('../src/database', () => ({
  openDB: jest.fn(async () => mockDb),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async key => (key === 'user_id' ? '1' : null)),
  setItem: jest.fn(async () => {}),
}));

jest.mock('../src/model/model', () => ({
  generateResponse: jest.fn(),
}));

jest.mock('../src/services/RAGService', () => ({
  ragService: {
    processQuery: jest.fn(async () => ({
      message: 'ok',
      intent: 'general_chat',
    })),
  },
}));

jest.mock('../src/services/ConversationContext', () => ({
  conversationContext: {
    addMessage: jest.fn(),
    setUserContext: jest.fn(),
    hasPendingFollowUp: jest.fn(() => false),
    setPendingFollowUp: jest.fn(),
    clearPendingFollowUp: jest.fn(),
    clearConversationHistory: jest.fn(),
  },
}));

let chat;

function ChatHarness() {
  const {context, refreshContext, initializeContext, isInitialized} =
    useAgentContext();
  const engine = useChatEngine(isInitialized, context, refreshContext);
  chat = {...engine, initializeContext};
  return null;
}

beforeEach(() => {
  clearAllAgentContexts();
  ragService.processQuery.mockClear();
  mockProfileReadFails = false;
  mockBPLogs = [
    {
      id: 1,
      week_number: 30,
      systolic: 118,
      diastolic: 76,
      time: '09:00',
      note: null,
      created_at: '2026-10-01',
    },
  ];
});

const bloodPressureSentWithQuery = call =>
  ragService.processQuery.mock.calls[call][1].recent_data.blood_pressure;

async function openChat() {
  await act(async () => {
    create(
      <AgentProvider>
        <ChatHarness />
      </AgentProvider>,
    );
  });
  // The chat screen loads the context when it mounts.
  await act(async () => {
    await chat.initializeContext();
  });
}

it('uses a blood pressure log added while the chat stayed open', async () => {
  await openChat();
  await act(async () => {
    await chat.sendMessage(
      'how is my blood pressure?',
      true,
      chat.initializeContext,
    );
  });
  expect(bloodPressureSentWithQuery(0)).toHaveLength(1);

  // A new reading is saved on the blood pressure screen.
  await addBPLog(USER_ID, {
    week_number: 31,
    systolic: 142,
    diastolic: 95,
    time: '10:30',
  });

  await act(async () => {
    await chat.sendMessage('and now?', true, chat.initializeContext);
  });
  expect(bloodPressureSentWithQuery(1)).toHaveLength(2);
  expect(bloodPressureSentWithQuery(1)).toContainEqual(
    expect.objectContaining({systolic: 142, diastolic: 95}),
  );
});

it('does not send the older context when the latest one fails to load', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await openChat();
  await addBPLog(USER_ID, {
    week_number: 31,
    systolic: 142,
    diastolic: 95,
    time: '10:30',
  });
  mockProfileReadFails = true;

  await act(async () => {
    await chat.sendMessage(
      'how is my blood pressure?',
      true,
      chat.initializeContext,
    );
  });

  expect(ragService.processQuery).toHaveBeenCalledTimes(1);
  expect(ragService.processQuery.mock.calls[0][1]).toBeNull();
  console.error.mockRestore();
});

it('drops a message when the chat is cleared while its context loads', async () => {
  await openChat();
  let finishLoading;
  const slowInitializeContext = () =>
    new Promise(resolve => (finishLoading = resolve));

  let sending;
  await act(async () => {
    sending = chat.sendMessage('hello', true, slowInitializeContext);
  });
  await act(async () => {
    await chat.clearConversation();
  });
  await act(async () => {
    finishLoading(null);
    await sending;
  });

  expect(ragService.processQuery).not.toHaveBeenCalled();
  expect(chat.conversation).toEqual([]);
});
