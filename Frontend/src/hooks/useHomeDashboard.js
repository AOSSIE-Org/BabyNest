import { useEffect, useState } from 'react';
import { profileApi } from '../api/profile';
import { appointmentsApi } from '../api/appointments';
import { tasksApi } from '../api/tasks';
import { calculateCurrentWeek } from '../utils/pregnancyUtils';

export function useHomeDashboard() {
  const [state, setState] = useState({
    week: 1,
    dueDate: '',
    appointments: [],
    tasks: [],
  });

  const refresh = async () => {
    const profile = await profileApi.get();
    const week = calculateCurrentWeek(profile.due_date);
    setState({
      week,
      dueDate: profile.due_date,
      appointments: await appointmentsApi.list(),
      tasks: await tasksApi.list(),
    });
  };

  useEffect(() => { refresh(); }, []);

  return state;
}
