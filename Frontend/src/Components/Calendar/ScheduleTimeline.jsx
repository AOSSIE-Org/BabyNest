import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { formatTime } from '../../utils/timeUtils';

const colors = ['#FDE68A', '#BFDBFE', '#FECACA', '#D1FAE5'];

const to_min = str => {
    if (!str) return 0;
    const [hours, minutes] = str.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes ? minutes.split(' ')[0] : '0', 10);
    return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

const ScheduleTimeline = ({ appointments, selectedDate, onAppointmentPress, refreshing, onRefresh }) => {

  // Start time is 6:00 AM
  const START_HOUR = 6;
  const START_MINUTES = START_HOUR * 60;
  const timeSlotHeight = 80;
  const DEFAULT_DURATION = 60;

  const calculateTopOffset = (timeStr) => {
    const minutes = to_min(timeStr);
    const offset = ((minutes - START_MINUTES) / 60) * timeSlotHeight;
    return Math.max(0, offset);
  };
  
  const calculateHeight = (duration) => {
      return (duration / 60) * timeSlotHeight;
  };

  // Process appointments for layout
  const processedAppointments = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => {
        return to_min(a.appointment_time) - to_min(b.appointment_time);
    });

    const columns = []; 
    const processed = sorted.map(event => {
        const startMin = to_min(event.appointment_time);
        const endMin = startMin + DEFAULT_DURATION;
        
      
        let placed = false;
        let colIndex = 0;

        for (let i = 0; i < columns.length; i++) {
            const col = columns[i];
            const lastEventInCol = col[col.length - 1];
         
            if (startMin >= lastEventInCol.endMin) {
                col.push({ ...event, startMin, endMin });
                colIndex = i;
                placed = true;
                break;
            }
        }

        if (!placed) {
            // New column needed
            colIndex = columns.length;
            columns.push([{ ...event, startMin, endMin }]);
        }

        return { ...event, startMin, endMin, colIndex };
    });
    
    return { events: processed, numColumns: Math.max(1, columns.length) };
  }, [appointments]);

  return (
    <ScrollView
      style={styles.scheduleContainer}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.scheduleList}>
        {Array.from({ length: 18 }, (_, i) => START_HOUR + i).map(hour => (
          <View
            key={hour}
            style={[styles.scheduleItem, { height: timeSlotHeight }]}>
            <Text style={styles.timeText}>
                {formatTime(`${hour}:00`)}
            </Text>
            <View style={styles.scheduleLine} />
          </View>
        ))}
      </View>

      {processedAppointments.events.map((appt, index) => {
         const colWidth = (100 - 15) / processedAppointments.numColumns; 
         
         return (
            <View
            key={appt.id}
            style={{
                ...styles.appointment,
                backgroundColor: colors[index % colors.length],
                top: calculateTopOffset(appt.appointment_time),
                height: calculateHeight(DEFAULT_DURATION),
                // Layout Logic
                left: `${18 + (appt.colIndex * (80 / processedAppointments.numColumns))}%`,
                width: `${80 / processedAppointments.numColumns}%`,
                zIndex: 1,
            }}>
            <TouchableOpacity onPress={() => onAppointmentPress(appt)} style={{flex:1}}>
                <Text style={styles.apptTitle} numberOfLines={1}>{appt.title}</Text>
                <Text style={styles.apptTime}>
                    {formatTime(appt.appointment_time)}
                </Text>
            </TouchableOpacity>
            </View>
         );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scheduleContainer: {
    flex: 1,
    paddingHorizontal: 10,
    
  },
  scheduleList: {
    flex: 1,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start', 
    paddingTop: 2, 
  },
  timeText: {
    width: 50,
    fontSize: 14,
    color: '#3D5A80',
  },
  scheduleLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginTop: 10,
  },
  appointment: {
    position: 'absolute',
    borderRadius: 10,
    padding: 10,
    elevation: 3,
  },
  apptTitle: {
    fontSize: 14, 
    fontWeight: 'bold',
    color: '#3D5A80',
  },
  apptTime: {
    fontSize: 12,
    color: '#6B7280',
  },

});

export default ScheduleTimeline;
