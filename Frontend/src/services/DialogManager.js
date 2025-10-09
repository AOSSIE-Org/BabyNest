/**
 * DialogManager - Advanced slot filling and follow-up questions
 * Handles multi-turn conversations with intelligent context management
 */

class DialogManager {
  constructor() {
    this.activeDialogs = new Map(); // userID -> dialog state
    this.dialogTemplates = this.initializeDialogTemplates();
    this.conversationMemory = new Map(); // userID -> conversation history
  }

  /**
   * Initialize dialog templates for different intents
   */
  initializeDialogTemplates() {
    return {
      'create_appointment': {
        requiredSlots: ['title', 'date', 'time', 'location'],
        optionalSlots: ['description'],
        slotQuestions: {
          'title': 'What type of appointment would you like to schedule?',
          'date': 'What date would you prefer for this appointment?',
          'time': 'What time works best for you?',
          'location': 'Where should this appointment take place?',
          'description': 'Any additional notes for this appointment?'
        },
        quickReplies: {
          'title': ['Checkup', 'Ultrasound', 'Blood Test', 'Consultation'],
          'time': ['9:00', '14:00', 'Morning', 'Afternoon'],
          'location': ['Delhi', 'City Hospital', 'Home', 'Clinic']
        },
        confirmationMessage: 'Perfect! I\'ll schedule your {title} appointment for {date} at {time} at {location}.',
        maxTurns: 5
      },

      'log_mood': {
        requiredSlots: ['mood'],
        optionalSlots: ['intensity', 'note'],
        slotQuestions: {
          'mood': 'How are you feeling right now?',
          'intensity': 'How intense is this feeling?',
          'note': 'Would you like to add any notes about your mood?'
        },
        quickReplies: {
          'mood': ['Happy', 'Anxious', 'Calm', 'Tired', 'Stressed'],
          'intensity': ['Low', 'Medium', 'High']
        },
        confirmationMessage: 'Got it! I\'ve logged your mood as {mood} with {intensity} intensity.',
        maxTurns: 3
      },

      'log_sleep': {
        requiredSlots: ['duration'],
        optionalSlots: ['quality', 'bedtime', 'wake_time', 'note'],
        slotQuestions: {
          'duration': 'How many hours did you sleep?',
          'quality': 'How was your sleep quality?',
          'bedtime': 'What time did you go to bed?',
          'wake_time': 'What time did you wake up?',
          'note': 'Any additional notes about your sleep?'
        },
        quickReplies: {
          'duration': ['8 hours', '7 hours', '6 hours', '9 hours'],
          'quality': ['Excellent', 'Good', 'Fair', 'Poor']
        },
        confirmationMessage: 'Sleep logged! You slept {duration} hours with {quality} quality.',
        maxTurns: 4
      },

      'query_analytics': {
        requiredSlots: ['metric'],
        optionalSlots: ['timeframe', 'chart_type'],
        slotQuestions: {
          'metric': 'What would you like to analyze?',
          'timeframe': 'What time period are you interested in?',
          'chart_type': 'What type of visualization would you prefer?'
        },
        quickReplies: {
          'metric': ['Weight', 'Sleep', 'Mood', 'Symptoms'],
          'timeframe': ['This week', 'This month', 'Today', 'All time'],
          'chart_type': ['Summary', 'Trend', 'Comparison']
        },
        confirmationMessage: 'I\'ll generate a {chart_type} analysis of your {metric} for {timeframe}.',
        maxTurns: 3
      }
    };
  }

  /**
   * Start a new dialog session
   * @param {string} userId - User identifier
   * @param {string} intent - Intent type
   * @param {Object} initialContext - Initial context data
   */
  startDialog(userId, intent, initialContext = {}) {
    const template = this.dialogTemplates[intent];
    if (!template) {
      throw new Error(`No dialog template found for intent: ${intent}`);
    }

    const dialogState = {
      intent: intent,
      template: template,
      slots: { ...initialContext },
      filledSlots: new Set(),
      currentTurn: 0,
      maxTurns: template.maxTurns,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    this.activeDialogs.set(userId, dialogState);
    return dialogState;
  }

  /**
   * Process user input in an active dialog
   * @param {string} userId - User identifier
   * @param {string} userInput - User's input text
   * @param {Object} extractedData - Data extracted from user input
   * @returns {Object} Dialog response
   */
  processUserInput(userId, userInput, extractedData = {}) {
    const dialogState = this.activeDialogs.get(userId);
    if (!dialogState) {
      return {
        success: false,
        message: 'No active dialog found. Please start a new conversation.',
        action: 'start_new_dialog'
      };
    }

    // Update last activity
    dialogState.lastActivity = new Date().toISOString();
    dialogState.currentTurn++;

    // Check if max turns exceeded
    if (dialogState.currentTurn > dialogState.maxTurns) {
      return this.endDialog(userId, 'timeout');
    }

    // Update slots with extracted data
    this.updateSlots(dialogState, extractedData);

    // Check if all required slots are filled
    const missingRequiredSlots = this.getMissingRequiredSlots(dialogState);
    
    if (missingRequiredSlots.length === 0) {
      // All required slots filled, ready for confirmation
      return this.generateConfirmation(dialogState);
    } else {
      // Ask for next missing slot
      return this.generateNextQuestion(dialogState, missingRequiredSlots);
    }
  }

  /**
   * Update dialog slots with extracted data
   */
  updateSlots(dialogState, extractedData) {
    Object.keys(extractedData).forEach(key => {
      if (extractedData[key] !== null && extractedData[key] !== undefined && extractedData[key] !== '') {
        dialogState.slots[key] = extractedData[key];
        dialogState.filledSlots.add(key);
      }
    });
  }

  /**
   * Get missing required slots
   */
  getMissingRequiredSlots(dialogState) {
    return dialogState.template.requiredSlots.filter(
      slot => !dialogState.filledSlots.has(slot)
    );
  }

  /**
   * Generate next question for missing slots
   */
  generateNextQuestion(dialogState, missingSlots) {
    const nextSlot = missingSlots[0];
    const question = dialogState.template.slotQuestions[nextSlot];
    const quickReplies = dialogState.template.quickReplies[nextSlot] || [];

    return {
      success: true,
      message: `🤖 ${question}`,
      requiresFollowUp: true,
      intent: { action: dialogState.intent },
      partialData: { ...dialogState.slots },
      missingFields: [nextSlot],
      quickReplies: quickReplies,
      dialogState: dialogState
    };
  }

  /**
   * Generate confirmation message
   */
  generateConfirmation(dialogState) {
    let confirmationMessage = dialogState.template.confirmationMessage;
    
    // Replace placeholders with actual values
    Object.keys(dialogState.slots).forEach(key => {
      const placeholder = `{${key}}`;
      if (confirmationMessage.includes(placeholder)) {
        confirmationMessage = confirmationMessage.replace(placeholder, dialogState.slots[key]);
      }
    });

    return {
      success: true,
      message: `✅ ${confirmationMessage}`,
      requiresFollowUp: false,
      intent: { action: dialogState.intent },
      partialData: { ...dialogState.slots },
      missingFields: [],
      confirmation: true,
      dialogState: dialogState
    };
  }

  /**
   * Confirm and execute dialog action
   * @param {string} userId - User identifier
   * @param {boolean} confirmed - Whether user confirmed the action
   */
  confirmDialog(userId, confirmed = true) {
    const dialogState = this.activeDialogs.get(userId);
    if (!dialogState) {
      return {
        success: false,
        message: 'No active dialog to confirm.',
        action: 'error'
      };
    }

    if (confirmed) {
      const result = {
        success: true,
        message: 'Dialog confirmed and ready for execution.',
        action: 'execute_action',
        intent: { action: dialogState.intent },
        payload: { ...dialogState.slots },
        dialogState: dialogState
      };
      
      // End dialog after confirmation
      this.endDialog(userId, 'completed');
      return result;
    } else {
      // User declined, end dialog
      this.endDialog(userId, 'cancelled');
      return {
        success: true,
        message: 'Dialog cancelled.',
        action: 'dialog_cancelled'
      };
    }
  }

  /**
   * End dialog session
   * @param {string} userId - User identifier
   * @param {string} reason - Reason for ending (completed, cancelled, timeout, error)
   */
  endDialog(userId, reason = 'completed') {
    const dialogState = this.activeDialogs.get(userId);
    if (dialogState) {
      dialogState.status = reason;
      dialogState.endedAt = new Date().toISOString();
      
      // Store in conversation memory
      this.addToConversationMemory(userId, dialogState);
      
      // Remove from active dialogs
      this.activeDialogs.delete(userId);
      
      return {
        success: true,
        message: `Dialog ended: ${reason}`,
        action: 'dialog_ended'
      };
    }
    
    return {
      success: false,
      message: 'No active dialog to end.',
      action: 'error'
    };
  }

  /**
   * Get active dialog for user
   */
  getActiveDialog(userId) {
    return this.activeDialogs.get(userId);
  }

  /**
   * Check if user has active dialog
   */
  hasActiveDialog(userId) {
    return this.activeDialogs.has(userId);
  }

  /**
   * Add dialog to conversation memory
   */
  addToConversationMemory(userId, dialogState) {
    if (!this.conversationMemory.has(userId)) {
      this.conversationMemory.set(userId, []);
    }
    
    const userHistory = this.conversationMemory.get(userId);
    userHistory.push({
      ...dialogState,
      memoryId: Date.now().toString()
    });
    
    // Keep only last 20 dialogs per user
    if (userHistory.length > 20) {
      userHistory.splice(0, userHistory.length - 20);
    }
  }

  /**
   * Get conversation history for user
   */
  getConversationHistory(userId, limit = 10) {
    const history = this.conversationMemory.get(userId) || [];
    return history.slice(-limit);
  }

  /**
   * Get context from previous dialogs
   */
  getContextFromHistory(userId, intent) {
    const history = this.getConversationHistory(userId, 5);
    const relevantDialogs = history.filter(dialog => dialog.intent === intent);
    
    if (relevantDialogs.length === 0) {
      return null;
    }
    
    // Return most recent relevant dialog's slots as context
    const lastDialog = relevantDialogs[relevantDialogs.length - 1];
    return lastDialog.slots;
  }

  /**
   * Suggest quick replies based on dialog state
   */
  getQuickReplies(userId) {
    const dialogState = this.activeDialogs.get(userId);
    if (!dialogState) return [];

    const missingSlots = this.getMissingRequiredSlots(dialogState);
    if (missingSlots.length === 0) {
      // All slots filled, show confirmation options
      return ['Yes, confirm', 'No, cancel', 'Let me change something'];
    }

    const nextSlot = missingSlots[0];
    return dialogState.template.quickReplies[nextSlot] || [];
  }

  /**
   * Handle quick reply selection
   */
  handleQuickReply(userId, quickReply) {
    const dialogState = this.activeDialogs.get(userId);
    if (!dialogState) return null;

    const missingSlots = this.getMissingRequiredSlots(dialogState);
    if (missingSlots.length === 0) {
      // Handle confirmation quick replies
      if (quickReply.toLowerCase().includes('yes') || quickReply.toLowerCase().includes('confirm')) {
        return this.confirmDialog(userId, true);
      } else if (quickReply.toLowerCase().includes('no') || quickReply.toLowerCase().includes('cancel')) {
        return this.confirmDialog(userId, false);
      }
    }

    // Map quick reply to slot value
    const nextSlot = missingSlots[0];
    const extractedData = { [nextSlot]: quickReply };
    
    return this.processUserInput(userId, quickReply, extractedData);
  }

  /**
   * Clean up inactive dialogs
   */
  cleanupInactiveDialogs(maxAgeMinutes = 30) {
    const now = new Date();
    const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds
    
    for (const [userId, dialogState] of this.activeDialogs.entries()) {
      const lastActivity = new Date(dialogState.lastActivity);
      const age = now.getTime() - lastActivity.getTime();
      
      if (age > maxAge) {
        this.endDialog(userId, 'timeout');
      }
    }
  }

  /**
   * Get dialog statistics
   */
  getDialogStats() {
    return {
      activeDialogs: this.activeDialogs.size,
      totalUsers: this.conversationMemory.size,
      dialogTemplates: Object.keys(this.dialogTemplates).length
    };
  }

  /**
   * Reset all dialogs (for testing/debugging)
   */
  reset() {
    this.activeDialogs.clear();
    this.conversationMemory.clear();
  }
}

// Export singleton instance
export const dialogManager = new DialogManager();
export default dialogManager;
