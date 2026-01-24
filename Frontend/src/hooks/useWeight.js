import { useState, useCallback } from 'react';
import apiClient from '../services/apiClient';

export const useWeight = (babyId) => {
  const [weights, setWeights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all weights
  const fetchWeights = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/babies/${babyId}/weights`);
      setWeights(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  // Add new weight
  const addWeight = useCallback(async (weightData) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/babies/${babyId}/weights`, weightData);
      setWeights((prev) => [...prev, response.data]);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  // Update weight
  const updateWeight = useCallback(async (weightId, weightData) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/babies/${babyId}/weights/${weightId}`, weightData);
      setWeights((prev) => prev.map(w => w.id === weightId ? response.data : w));
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  // Delete weight
  const deleteWeight = useCallback(async (weightId) => {
    setLoading(true);
    try {
      await apiClient.delete(`/babies/${babyId}/weights/${weightId}`);
      setWeights((prev) => prev.filter(w => w.id !== weightId));
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  return {
    weights,
    loading,
    error,
    fetchWeights,
    addWeight,
    updateWeight,
    deleteWeight,
  };
};
