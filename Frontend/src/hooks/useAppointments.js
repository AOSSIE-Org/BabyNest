// src/hooks/useAppointments.js
import { useState, useCallback } from "react";
import apiClient from "../services/apiClient";

export const useAppointments = (babyId) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ensureBabyId = () => {
    if (!babyId) {
      throw new Error("babyId is required for useAppointments");
    }
  };

  // Fetch all appointments
  const fetchAppointments = useCallback(async () => {
    try {
      ensureBabyId();
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/babies/${babyId}/appointments`);
      setAppointments(response.data || []);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  // Add appointment
  const addAppointment = useCallback(
    async (appointmentData) => {
      try {
        ensureBabyId();
        setLoading(true);
        setError(null);

        const response = await apiClient.post(
          `/babies/${babyId}/appointments`,
          appointmentData
        );

        setAppointments((prev) => [...prev, response.data]);
        return response.data;
      } catch (err) {
        console.error("Failed to add appointment:", err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [babyId]
  );

  // Update appointment
  const updateAppointment = useCallback(
    async (appointmentId, appointmentData) => {
      try {
        ensureBabyId();
        setLoading(true);
        setError(null);

        const response = await apiClient.put(
          `/babies/${babyId}/appointments/${appointmentId}`,
          appointmentData
        );

        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? response.data : a))
        );
        return response.data;
      } catch (err) {
        console.error("Failed to update appointment:", err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [babyId]
  );

  // Delete appointment
  const deleteAppointment = useCallback(
    async (appointmentId) => {
      try {
        ensureBabyId();
        setLoading(true);
        setError(null);

        await apiClient.delete(
          `/babies/${babyId}/appointments/${appointmentId}`
        );

        setAppointments((prev) =>
          prev.filter((a) => a.id !== appointmentId)
        );
      } catch (err) {
        console.error("Failed to delete appointment:", err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [babyId]
  );

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  };
};
