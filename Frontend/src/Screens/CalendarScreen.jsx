import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import CalendarHeader from '../Components/Calendar/CalendarHeader';
import WeekDateSelector from '../Components/Calendar/WeekDateSelector';
import ScheduleTimeline from '../Components/Calendar/ScheduleTimeline';
import AddAppointmentModal from '../Components/Calendar/AddAppointmentModal';
import AppointmentDetailsModal from '../Components/Calendar/AppointmentDetailsModal';
import EditAppointmentModal from '../Components/Calendar/EditAppointmentModal';
import { useCalendar } from '../hooks/useCalendar';

const ScheduleScreen = () => {
  const { state, actions, forms } = useCalendar();

  return (
    <SafeAreaView style={styles.container}>
      <CalendarHeader
        selectedDate={state.selectedDate}
        onDateSelectorPress={() => actions.setModals(m => ({ ...m, dateSelector: true }))}
        onAddPress={actions.openAddModal}
      />

      <WeekDateSelector
        weekDates={state.weekDates}
        selectedDate={state.selectedDate}
        onDateSelect={actions.setSelectedDate}
      />

      <ScheduleTimeline
        appointments={state.dailyAppointments}
        selectedDate={state.selectedDate}
        onAppointmentPress={actions.openDetailsModal}
        refreshing={state.refreshing}
        onRefresh={actions.handleRefresh}
      />

      <AddAppointmentModal
        visible={state.modals.add}
        onClose={actions.closeModals}
        newAppointment={forms.newAppointment}
        setNewAppointment={forms.setNewAppointment}
        onSave={actions.addAppointment}
        onDatePress={() => {
          actions.setActiveModal('add');
          actions.setModals(m => ({ ...m, calendar: true }));
        }}
      />

      <AppointmentDetailsModal
        visible={state.modals.details}
        onClose={() => actions.setModals(m => ({ ...m, details: false }))}
        appointment={forms.selectedAppointment}
        onEdit={actions.openEditModal}
        onDelete={actions.deleteAppointment}
      />

      <EditAppointmentModal
        visible={state.modals.edit}
        onClose={() => actions.setModals(m => ({ ...m, edit: false }))}
        editAppointment={forms.editAppointment}
        setEditAppointment={forms.setEditAppointment}
        onSave={actions.updateAppointment}
        onDatePress={() => {
          actions.setActiveModal('edit');
          actions.setModals(m => ({ ...m, calendar: true }));
        }}
      />

      {/* Shared Date Pickers */}
      <View style={{zIndex: 9999, elevation: 10}}>
        <DateTimePickerModal
          isVisible={state.modals.calendar}
          mode="datetime"
          minimumDate={new Date()}
          onConfirm={actions.handleDateConfirm}
          onCancel={() => actions.setModals(m => ({ ...m, calendar: false }))}
        />
      </View>

      <DateTimePickerModal
        isVisible={state.modals.dateSelector}
        mode="date"
        minimumDate={new Date()}
        onConfirm={actions.handleDateConfirm}
        onCancel={() => actions.setModals(m => ({ ...m, dateSelector: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    marginHorizontal: 20,
    paddingTop: 40,
  },
});

export default ScheduleScreen;
