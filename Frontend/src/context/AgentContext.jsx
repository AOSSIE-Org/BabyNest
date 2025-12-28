import React, { createContext, useContext, useState, useEffect } from 'react';
import { BASE_URL } from '@env';

/**
 * AgentContext - Manages AI agent context and user data
 * 
 * IMPORTANT: This context no longer automatically fetches data on mount.
 * Context initialization is now lazy and only happens when needed.
 * 
 * Usage:
 * 1. Call initializeContext() when user is ready (after login/profile setup)
 * 2. Use isContextReady() to check if context is available
 * 3. Context will be automatically initialized on first chat interaction
 */

const AgentContext = createContext();

export const useAgentContext = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgentContext must be used within an AgentProvider');
  }
  return context;
};

export const AgentProvider = ({ children }) => {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [agentAvailable, setAgentAvailable] = useState(true); // Assume available by default
  const [healthChecked, setHealthChecked] = useState(false);

  const fetchContext = async (user_id = "default", force = false) => {
    // Don't fetch if already initialized and not forced
    if (isInitialized && !force) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/agent/context?user_id=${user_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch context: ${response.status}`);
      }

      const data = await response.json();
      setContext(data);
      setLastUpdated(new Date());
      setIsInitialized(true);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching agent context:', err);
      // Don't mark as initialized if there was an error
      setIsInitialized(false);
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const response = await fetch(`${BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAgentAvailable(data.agent_initialized);
      } else {
        // If health endpoint fails, assume agent is unavailable
        setAgentAvailable(false);
      }
    } catch (err) {
      console.warn('Health check failed, assuming agent unavailable:', err.message);
      setAgentAvailable(false);
    } finally {
      setHealthChecked(true);
    }
  };

  const refreshContext = async (user_id = "default") => {
    try {
      const response = await fetch(`${BASE_URL}/agent/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id }),
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh context: ${response.status}`);
      }

      // Fetch the updated context with force=true to bypass initialization check
      await fetchContext(user_id, true);
    } catch (err) {
      console.warn('Context refresh failed, falling back to direct fetch:', err.message);
      // Fallback: just fetch the context directly without refresh
      try {
        await fetchContext(user_id, true);
      } catch (fallbackErr) {
        setError(fallbackErr.message);
        console.error('Error refreshing context:', fallbackErr);
      }
    }
  };

  const getTaskRecommendations = async (week = null, user_id = "default") => {
    try {
      let url = `${BASE_URL}/agent/tasks/recommendations?user_id=${user_id}`;
      if (week) {
        url += `&week=${week}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get recommendations: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error getting task recommendations:', err);
      throw err;
    }
  };

  const getCacheStatus = async () => {
    try {
      const response = await fetch(`${BASE_URL}/agent/cache/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get cache status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error getting cache status:', err);
      throw err;
    }
  };

  // Initialize context when user is ready (e.g., after login/profile setup)
  const initializeContext = async (user_id = "default") => {
    await fetchContext(user_id, true);
  };

  // Check if context is ready for use
  const isContextReady = () => {
    return isInitialized && context !== null;
  };

  // Remove automatic fetch on mount - context will be initialized when needed

  const value = {
    context,
    loading,
    error,
    lastUpdated,
    isInitialized,
    agentAvailable,
    healthChecked,
    fetchContext,
    refreshContext,
    initializeContext,
    isContextReady,
    checkHealth,
    getTaskRecommendations,
    getCacheStatus,
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}; 