import { useState, useEffect } from 'react';
import { weightAPI } from '../api';

export const useWeight = (userId) => {
  const [weight, setWeight] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeight = async () => {
      try {
        setLoading(true);
        const data = await weightAPI.getRecords(userId);
        setWeight(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchWeight();
  }, [userId]);

  const addWeight = async (weightData) => {
    try {
      const newRecord = await weightAPI.addRecord(weightData);
      setWeight((prev) => [...prev, newRecord]);
      return newRecord;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { weight, loading, error, addWeight };
};
