import { useState, useCallback } from 'react';
import apiClient from '../services/apiClient';

export const useAppointments = (babyId) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all appointments
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/babies/${babyId}/appointments`);
      setAppointments(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  // Add appointment
  const addAppointment = useCallback(async (appointmentData) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/babies/${babyId}/appointments`, appointmentData);
      setAppointments((prev) => [...prev, response.data]);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  // Update appointment
  const updateAppointment = useCallback(async (appointmentId, appointmentData) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/babies/${babyId}/appointments/${appointmentId}`, appointmentData);
      setAppointments((prev) =>
        prev.map(a => a.id === appointmentId ? response.data : a)
      );
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  // Delete appointment
  const deleteAppointment = useCallback(async (appointmentId) => {
    setLoading(true);
    try {
      await apiClient.delete(`/babies/${babyId}/appointments/${appointmentId}`);
      setAppointments((prev) => prev.filter(a => a.id !== appointmentId));
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [babyId]);

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
