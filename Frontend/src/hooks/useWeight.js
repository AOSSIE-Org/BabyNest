// src/hooks/useWeight.js
import { useState, useCallback } from "react";
import apiClient from "../services/apiClient";

export const useWeight = (babyId) => {
  const [weights, setWeights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ensureBabyId = () => {
    if (!babyId) {
      throw new Error("babyId is required for useWeight");
    }
  };

  // Fetch all weights
  const fetchWeights = useCallback(async () => {
    try {
      ensureBabyId();
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/babies/${babyId}/weights`);
      setWeights(response.data || []);
    } catch (err) {
      console.error("Failed to fetch weights:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  // Add new weight
  const addWeight = useCallback(
    async (weightData) => {
      try {
        ensureBabyId();
        setLoading(true);
        setError(null);

        const response = await apiClient.post(
          `/babies/${babyId}/weights`,
          weightData
        );

        setWeights((prev) => [...prev, response.data]);
        return response.data;
      } catch (err) {
        console.error("Failed to add weight:", err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [babyId]
  );

  // Update weight
  const updateWeight = useCallback(
    async (weightId, weightData) => {
      try {
        ensureBabyId();
        setLoading(true);
        setError(null);

        const response = await apiClient.put(
          `/babies/${babyId}/weights/${weightId}`,
          weightData
        );

        setWeights((prev) =>
          prev.map((w) => (w.id === weightId ? response.data : w))
        );
        return response.data;
      } catch (err) {
        console.error("Failed to update weight:", err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [babyId]
  );

  // Delete weight
  const deleteWeight = useCallback(
    async (weightId) => {
      try {
        ensureBabyId();
        setLoading(true);
        setError(null);

        await apiClient.delete(`/babies/${babyId}/weights/${weightId}`);
        setWeights((prev) => prev.filter((w) => w.id !== weightId));
      } catch (err) {
        console.error("Failed to delete weight:", err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [babyId]
  );

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
