import React, { createContext, useContext, useState, useEffect } from 'react';
import { BASE_URL } from '@env';

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

  const fetchContext = async (user_id = "default") => {
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
    } catch (err) {
      setError(err.message);
      console.error('Error fetching agent context:', err);
    } finally {
      setLoading(false);
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

      // Fetch the updated context
      await fetchContext(user_id);
    } catch (err) {
      setError(err.message);
      console.error('Error refreshing context:', err);
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

  // Auto-fetch context on mount
  useEffect(() => {
    fetchContext();
  }, []);

  const value = {
    context,
    loading,
    error,
    lastUpdated,
    fetchContext,
    refreshContext,
    getTaskRecommendations,
    getCacheStatus,
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}; 