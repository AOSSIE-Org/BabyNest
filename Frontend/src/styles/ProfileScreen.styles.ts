import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollContent: {
    paddingHorizontal: Platform.OS === 'ios' ? 16 : 16,
    paddingTop: Platform.OS === 'ios' ? 24 : 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 32 : 24,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
  },

  avatarContainer: {
    width: Platform.OS === 'ios' ? 80 : 72,
    height: Platform.OS === 'ios' ? 80 : 72,
    borderRadius: Platform.OS === 'ios' ? 40 : 36,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 16 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: Platform.OS === 'ios' ? 4 : 0,
    elevation: Platform.OS === 'ios' ? 0 : 2,
  },

  avatarPlaceholder: {
    fontSize: Platform.OS === 'ios' ? 40 : 36,
  },

  userName: {
    fontSize: Platform.OS === 'ios' ? 22 : 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: Platform.OS === 'ios' ? 8 : 6,
    textAlign: 'center',
  },

  userEmail: {
    fontSize: Platform.OS === 'ios' ? 14 : 13,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '400',
  },

  // Section Container
  sectionContainer: {
    marginBottom: Platform.OS === 'ios' ? 28 : 24,
  },

  sectionHeader: {
    marginBottom: Platform.OS === 'ios' ? 12 : 10,
    paddingHorizontal: Platform.OS === 'ios' ? 4 : 0,
  },

  sectionTitle: {
    fontSize: Platform.OS === 'ios' ? 18 : 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // Theme Card
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: Platform.OS === 'ios' ? 16 : 14,
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: Platform.OS === 'ios' ? 72 : 64,
  },

  themeContent: {
    flex: 1,
    marginRight: Platform.OS === 'ios' ? 12 : 10,
  },

  themeLabel: {
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: Platform.OS === 'ios' ? 4 : 3,
  },

  themeDescription: {
    fontSize: Platform.OS === 'ios' ? 13 : 12,
    color: '#666666',
    fontWeight: '400',
    lineHeight: Platform.OS === 'ios' ? 18 : 16,
  },

  switchControl: {
    transform: [
      { scaleX: Platform.OS === 'ios' ? 1.0 : 0.9 },
      { scaleY: Platform.OS === 'ios' ? 1.0 : 0.9 },
    ],
  },

  // Input Card
  inputCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: Platform.OS === 'ios' ? 16 : 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },

  inputLabel: {
    fontSize: Platform.OS === 'ios' ? 14 : 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: Platform.OS === 'ios' ? 8 : 6,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.OS === 'ios' ? 8 : 6,
    paddingHorizontal: Platform.OS === 'ios' ? 12 : 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    marginBottom: Platform.OS === 'ios' ? 8 : 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },

  textInput: {
    flex: 1,
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    color: '#1A1A1A',
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  inputIcon: {
    fontSize: Platform.OS === 'ios' ? 18 : 16,
    marginLeft: Platform.OS === 'ios' ? 8 : 6,
  },

  inputHelperText: {
    fontSize: Platform.OS === 'ios' ? 12 : 11,
    color: '#999999',
    fontWeight: '400',
    marginTop: Platform.OS === 'ios' ? 6 : 4,
  },

  // Save Button
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 8 : 6,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0,
    shadowRadius: Platform.OS === 'ios' ? 8 : 0,
    elevation: Platform.OS === 'ios' ? 0 : 4,
  },

  saveButtonText: {
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Info Section
  infoSection: {
    marginTop: Platform.OS === 'ios' ? 28 : 24,
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    alignItems: 'center',
  },

  infoText: {
    fontSize: Platform.OS === 'ios' ? 12 : 11,
    color: '#999999',
    fontWeight: '400',
    marginBottom: Platform.OS === 'ios' ? 4 : 3,
  },
});

export default styles;
