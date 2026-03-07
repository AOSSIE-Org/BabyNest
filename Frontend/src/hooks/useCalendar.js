import { useState, useEffect, useRef, useMemo } from 'react';
import { Animated, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { BASE_URL } from '@env';
import NotificationService from '../services/NotificationService';

export const useCalendar = () => {

  const fadeAnim = useRef(new Animated.Value(0)).current;


  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const generateWeekDates = startDate => {
    let dates = [];
    for (let i = 0; i < 7; i++) {
        let date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push(date);
    }
    return dates;
  };
  const [weekDates, setWeekDates] = useState(generateWeekDates(new Date()));


  const [modals, setModals] = useState({
    calendar: false,
    dateSelector: false,
    add: false,
    edit: false,
    details: false,
  });

  const [activeModal, setActiveModal] = useState(null); // 'add' or 'edit' context for the date picker


  const [appointments, setAppointments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newAppointment, setNewAppointment] = useState({
    title: '', content: '', appointment_date: '', appointment_time: '', appointment_location: ''
  });
  const [editAppointment, setEditAppointment] = useState({
    title: '', content: '', appointment_date: '', appointment_time: '', appointment_location: ''
  });


  const dailyAppointments = useMemo(() => {
     return appointments.filter(appt => {
        if (!appt.appointment_date) return false;
        const [year, month, day] = appt.appointment_date.split('-').map(Number);
        const apptDate = new Date(year, month - 1, day);
        return apptDate.toDateString() === selectedDate.toDateString();
     });
  }, [appointments, selectedDate]);


  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, [fadeAnim]);

  useEffect(() => {
    fetchAppointments();
  }, []);


  const fetchAppointments = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${BASE_URL}/get_appointments`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      try {
          const data = await response.json();
          if (Array.isArray(data)) {
             setAppointments(data);
             return true;
          } else {
             console.error('Fetched data is not an array:', data);
             setAppointments([]); 
             return false;
          }
      } catch (jsonError) {
          console.error('Error parsing appointments JSON:', jsonError);
          // Keep previous state or set to empty array on parse error, don't crash
          setAppointments([]); 
          return false;
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Toast.show({ type: 'error', text1: 'Failed to fetch appointments' });
      return false;
    } finally {
      setRefreshing(false);
    }
  };



  const addAppointment = async () => {
    if (!newAppointment.title || !newAppointment.appointment_date || !newAppointment.appointment_time) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill in Title, Date, and Time.' });
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/add_appointment`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(newAppointment),
      });

      if (!response.ok) {
         const errorText = await response.text();
         throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      closeModals();
      await fetchAppointments();
      Toast.show({ type: 'success', text1: 'Appointment added successfully!' });

      // Notifications
      NotificationService.showLocalNotification(
        "Appointment Created",
        `"${newAppointment.title}" scheduled for ${newAppointment.appointment_date} at ${newAppointment.appointment_time}.`
      );

      if (data && data.id) {
        NotificationService.scheduleAppointmentReminder(
          newAppointment.title,
          newAppointment.content,
          newAppointment.appointment_date,
          newAppointment.appointment_time,
          data.id
        );
      } else {
        console.warn('[useCalendar] No ID returned from backend, skipping reminder schedule.');
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error adding appointment!' });
    }
  };

  const updateAppointment = async () => {
    if (!editAppointment.title || !editAppointment.appointment_date || !editAppointment.appointment_time) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill in Title, Date, and Time.' });
      return;
    }

     try {
      const response = await fetch(`${BASE_URL}/update_appointment/${editAppointment.id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(editAppointment),
      });

      if (!response.ok) {
         const errorText = await response.text();
         throw new Error(`Error ${response.status}: ${errorText}`);
      }

      // Only parse JSON if content exists and is JSON
      if (response.status !== 204) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
             await response.json();
          }
      }

      Toast.show({ type: 'success', text1: 'Appointment updated successfully!' });
      
      const fetchSuccess = await fetchAppointments();
      
      if (fetchSuccess) {
          NotificationService.showLocalNotification(
            "Appointment Updated", 
            `"${editAppointment.title}" rescheduled to ${editAppointment.appointment_date} at ${editAppointment.appointment_time}.`
          );
          NotificationService.cancelNotification(editAppointment.id);
          NotificationService.scheduleAppointmentReminder(
              editAppointment.title, 
              editAppointment.content, 
              editAppointment.appointment_date, 
              editAppointment.appointment_time, 
              editAppointment.id
          );
      }


      
      setModals(m => ({ ...m, edit: false }));
      setEditAppointment({ title: '', content: '', appointment_date: '', appointment_time: '', appointment_location: '' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error updating appointment!' });
    }
  };

  const deleteAppointment = async id => {
    try {
      const response = await fetch(`${BASE_URL}/delete_appointment/${id}`, { method: 'DELETE' });
      if (response.ok) {
        Toast.show({ type: 'success', text1: 'Appointment deleted successfully!' });
        await fetchAppointments();
        
        NotificationService.showLocalNotification(
          "Appointment Deleted", 
          `"${selectedAppointment?.title || 'Appointment'}" has been cancelled.`
        );
        NotificationService.cancelNotification(id);
      } else {
         Toast.show({ type: 'error', text1: 'Something went wrong!' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error deleting appointment!' });
    } finally {
       setModals(m => ({ ...m, details: false }));
    }
  };


  // --- Helper Handlers ---
  const handleDateConfirm = date => {
    let isPast = date < new Date();
    
    // If only selecting date, normalize to start of day for comparison
    if (modals.dateSelector) {
        const today = new Date();
        const selectedDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        isPast = selectedDateOnly < todayDateOnly;
    }

    if (isPast) {
      Toast.show({ type: 'error', text1: 'Invalid Date', text2: 'Please select a future date and time.' });
      setModals(m => ({ ...m, calendar: false, dateSelector: false }));
      return;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const appointmentDate = `${year}-${month}-${day}`;

    let appointmentTime = '';

    if (!modals.dateSelector) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        appointmentTime = `${hours}:${minutes}`;
    }

    if (activeModal === 'add') {
      setNewAppointment(prev => ({ 
          ...prev, 
          appointment_date: appointmentDate, 
          ...(appointmentTime !== '' ? { appointment_time: appointmentTime } : {}) 
      }));
    } else if (activeModal === 'edit') {
      setEditAppointment(prev => ({ 
          ...prev, 
          appointment_date: appointmentDate, 
          ...(appointmentTime !== '' ? { appointment_time: appointmentTime } : {}) 
      }));
    }

    setWeekDates(generateWeekDates(date));
    setSelectedDate(date);
    setModals(m => ({ ...m, calendar: false, dateSelector: false }));
  };

  const closeModals = () => {
    setModals(m => ({ ...m, add: false, edit: false, details: false }));
    setNewAppointment({ title: '', content: '', appointment_date: '', appointment_time: '', appointment_location: '' });
  };
  
  const openAddModal = () => setModals(m => ({ ...m, add: true }));
  const openEditModal = (appt) => {
      setEditAppointment(appt);
      setModals(m => ({ ...m, edit: true }));
  };
  const openDetailsModal = (appt) => {
      setSelectedAppointment(appt);
      setModals(m => ({ ...m, details: true }));
  };

  // --- Return Structure ---
  return {
    state: {
        fadeAnim,
        selectedDate,
        weekDates,
        appointments,
        dailyAppointments, // Memoized
        refreshing,
        modals, // {calendar, dateSelector, add, edit, details}
    },
    actions: {
        setSelectedDate,
        handleRefresh: fetchAppointments,
        handleDateConfirm,
        // Modal Toggles
        setModals,
        openAddModal,
        openEditModal,
        openDetailsModal,
        closeModals,
        setActiveModal,
        // CRUD
        addAppointment,
        updateAppointment,
        deleteAppointment,
    },
    forms: {
        newAppointment,
        setNewAppointment,
        editAppointment,
        setEditAppointment,
        selectedAppointment,
    }
  };
};
