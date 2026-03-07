import React from 'react';
import AppointmentFormModal from './AppointmentFormModal';

const EditAppointmentModal = ({
  visible,
  onClose,
  editAppointment,
  setEditAppointment,
  onSave,
  onDatePress,
}) => {
  return (
    <AppointmentFormModal
      visible={visible}
      onClose={onClose}
      appointment={editAppointment}
      setAppointment={setEditAppointment}
      onSave={onSave}
      onDatePress={onDatePress}
      title="Edit Appointment"
      saveLabel="Save Changes"
    />
  );
};

export default EditAppointmentModal;
