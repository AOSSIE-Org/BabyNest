import React from 'react';
import AppointmentFormModal from './AppointmentFormModal';

const AddAppointmentModal = ({
  visible,
  onClose,
  newAppointment,
  setNewAppointment,
  onSave,
  onDatePress,
}) => {
  return (
    <AppointmentFormModal
      visible={visible}
      onClose={onClose}
      appointment={newAppointment}
      setAppointment={setNewAppointment}
      onSave={onSave}
      onDatePress={onDatePress}
      title="New Appointment"
      saveLabel="Create Appointment"
    />
  );
};

export default AddAppointmentModal;
