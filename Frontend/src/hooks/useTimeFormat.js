import { useState, useEffect } from 'react';

export const useTimeFormat = () => {
  const [is24HourFormat, setIs24HourFormat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pure JS detection of system time format
    const checkFormat = () => {
      try {
        const date = new Date();
        const formatted = date.toLocaleTimeString(undefined, { hour: 'numeric' });
        // If it DOES NOT contain AM or PM, it is likely 24-hour.
        const is24 = !formatted.match(/AM|PM|am|pm/);
        setIs24HourFormat(is24);
      } catch (error) {
         console.warn("Failed to check 24h format", error);
         setIs24HourFormat(false); // Fallback to 12h
      } finally {
        setLoading(false);
      }
    };
    
    checkFormat();
  }, []);

  return { is24HourFormat, loading };
};
