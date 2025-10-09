/**
 * Conversation Context Manager
 * Manages conversation state and follow-up context for RAG system
 */

class ConversationContext {
  constructor() {
    this.pendingFollowUp = null;
    this.conversationHistory = [];
    this.userContext = null;
  }

  /**
   * Set pending follow-up context
   */
  setPendingFollowUp(intent, partialData, missingFields) {
    this.pendingFollowUp = {
      intent,
      partialData,
      missingFields,
      timestamp: Date.now()
    };
  }

  /**
   * Clear pending follow-up context
   */
  clearPendingFollowUp() {
    this.pendingFollowUp = null;
  }

  /**
   * Get pending follow-up context
   */
  getPendingFollowUp() {
    return this.pendingFollowUp;
  }

  /**
   * Check if there's a pending follow-up
   */
  hasPendingFollowUp() {
    return this.pendingFollowUp !== null;
  }

  /**
   * Update partial data in pending follow-up
   */
  updatePartialData(newData) {
    if (this.pendingFollowUp && newData && typeof newData === 'object') {
      this.pendingFollowUp.partialData = {
        ...(this.pendingFollowUp.partialData || {}),
        ...newData
      };
    }
  }

  /**
   * Add message to conversation history
   */
  addMessage(role, content, metadata = {}) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: Date.now(),
      ...metadata
    });

    // Keep only last 50 messages to prevent memory issues
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }
  }

  /**
   * Get conversation history
   */
  getConversationHistory() {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory() {
    this.conversationHistory = [];
    this.clearPendingFollowUp();
  }

  /**
   * Set user context
   */
  setUserContext(context) {
    this.userContext = context;
  }

  /**
   * Get user context
   */
  getUserContext() {
    return this.userContext;
  }

  /**
   * Process follow-up response
   */
  async processFollowUpResponse(userQuery, ragService) {
    if (!this.pendingFollowUp) {
      return null;
    }

    try {
      // Extract data from the follow-up response
      const extractedData = await ragService.extractData(userQuery, this.pendingFollowUp.intent);
      
      // Ensure extractedData is a valid object
      if (!extractedData || typeof extractedData !== 'object') {
        console.error('Invalid extractedData:', extractedData);
        return {
          success: false,
          message: `❌ I'm having trouble processing that information. Could you try again?`
        };
      }
      
      // Merge with existing partial data (only update non-null values)
      const mergedData = {
        ...(this.pendingFollowUp.partialData || {})
      };
      
      // Only update fields that have actual values (not null/undefined)
      // Double-check that extractedData is still valid before Object.entries
      if (extractedData && typeof extractedData === 'object' && extractedData !== null) {
        for (const [key, value] of Object.entries(extractedData)) {
          if (value !== null && value !== undefined && value !== '') {
            mergedData[key] = value;
          }
        }
      }

      // Handle special cases for appointment management
      if (this.pendingFollowUp.intent.action === 'updateAppointment' || 
          this.pendingFollowUp.intent.action === 'deleteAppointment') {
        
        // Check if this is an appointment selection response
        if (this.pendingFollowUp.matchingAppointments && 
            this.pendingFollowUp.missingFields.includes('appointment_selection')) {
          
          const selection = this.parseAppointmentSelection(userQuery, this.pendingFollowUp.matchingAppointments);
          
          if (selection) {
            // Execute the action with the selected appointment(s)
            const intent = this.pendingFollowUp.intent;
            this.clearPendingFollowUp();
            
            if (intent.action === 'deleteAppointment') {
              return await this.handleMultipleAppointmentDeletion(selection, ragService);
            } else if (intent.action === 'updateAppointment') {
              return await this.handleAppointmentUpdate(selection[0], mergedData, ragService);
            }
          } else {
            return {
              success: false,
              message: `❌ I couldn't understand your selection. Please specify by number (1, 2, etc.) or say "all"/"both".`
            };
          }
        }
      }

      // Check if we still have missing fields
      const missingFields = ragService.checkMissingFields(mergedData, this.pendingFollowUp.intent);
      
      if (missingFields.length > 0) {
        // Still missing information, update context and ask for more
        if (extractedData && typeof extractedData === 'object') {
          this.updatePartialData(extractedData);
        }
        return await ragService.generateFollowUpQuestions(
          this.pendingFollowUp.intent, 
          missingFields, 
          mergedData
        );
      } else {
        // All information gathered, execute the action
        const intent = this.pendingFollowUp.intent;
        this.clearPendingFollowUp();
        return await ragService.executeAction(intent, mergedData, this.userContext);
      }
    } catch (error) {
      console.error('Follow-up processing error:', error);
      return {
        success: false,
        message: `❌ I'm having trouble processing that information. Could you try again?\n\nError details: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Get conversation summary for context
   */
  getConversationSummary() {
    if (this.conversationHistory.length === 0) {
      return 'No previous conversation.';
    }

    const recentMessages = this.conversationHistory.slice(-5);
    return recentMessages.map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');
  }

  /**
   * Check if conversation is related to current context
   */
  isRelatedToCurrentContext(userQuery) {
    if (!this.pendingFollowUp) {
      return false;
    }

    const query = userQuery.toLowerCase();
    const intent = this.pendingFollowUp.intent;
    
    // Check if query contains information relevant to missing fields
    for (const field of this.pendingFollowUp.missingFields) {
      const fieldKeywords = {
        'title': ['ultrasound', 'checkup', 'consultation', 'blood test', 'scan'],
        'date': ['tomorrow', 'today', 'next week', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        'time': ['am', 'pm', 'morning', 'afternoon', 'evening', 'night'],
        'location': ['delhi', 'mumbai', 'bangalore', 'hospital', 'clinic', 'office'],
        'weight': ['kg', 'kilos', 'pounds', 'lbs'],
        'week': ['week'],
        'symptom': ['nausea', 'headache', 'pain', 'sick', 'dizzy'],
        'systolic': ['120', '130', '140', '150'],
        'diastolic': ['80', '90', '100'],
        'name': ['paracetamol', 'iron', 'vitamin', 'medicine'],
        'dose': ['mg', 'ml', 'tablets', 'pills'],
        'type': ['normal', 'spotting', 'heavy', 'light'],
        'color': ['clear', 'white', 'pink', 'brown'],
        'screen': ['home', 'weight', 'symptoms', 'medicine', 'appointments'],
        'field': ['name', 'age', 'phone', 'due date'],
        'value': ['shreya', '25', '1234567890', 'june 24']
      };

      if (fieldKeywords[field]) {
        for (const keyword of fieldKeywords[field]) {
          if (query.includes(keyword)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Parse appointment selection from user response
   */
  parseAppointmentSelection(userQuery, matchingAppointments) {
    const query = userQuery.toLowerCase().trim();
    
    // Check for "all"
    if (query.includes('all')) {
      return matchingAppointments;
    }
    
    // Check for "both" - handle multiple scenarios
    if (query.includes('both')) {
      if (matchingAppointments.length === 2) {
        return matchingAppointments;
      } else if (matchingAppointments.length > 2) {
        // If more than 2 appointments, "both" could mean "all" or ask for clarification
        return matchingAppointments; // Treat as "all" for now
      } else {
        // Less than 2 appointments, can't select "both"
        return null;
      }
    }
    
    // Check for numbers
    const numbers = query.match(/\d+/g);
    if (numbers) {
      const selectedAppointments = [];
      for (const numStr of numbers) {
        const num = parseInt(numStr);
        if (num >= 1 && num <= matchingAppointments.length) {
          selectedAppointments.push(matchingAppointments[num - 1]);
        }
      }
      if (selectedAppointments.length > 0) {
        return selectedAppointments;
      }
    }
    
    // Check for "first" and "last"
    if (query.includes('first')) {
      return [matchingAppointments[0]];
    }
    
    if (query.includes('last')) {
      return [matchingAppointments[matchingAppointments.length - 1]];
    }
    
    return null;
  }

  /**
   * Handle multiple appointment deletion
   */
  async handleMultipleAppointmentDeletion(selectedAppointments, ragService) {
    const results = [];
    let successCount = 0;
    
    // Import BASE_URL from environment
    const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000';
    
    for (const appointment of selectedAppointments) {
      try {
        const response = await fetch(`${BASE_URL}/delete_appointment/${appointment.id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          successCount++;
          results.push(`✅ "${appointment.title}" deleted successfully`);
        } else {
          const errorData = await response.json();
          results.push(`❌ Failed to delete "${appointment.title}": ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        results.push(`❌ Error deleting "${appointment.title}": ${error.message}`);
      }
    }
    
    const message = `📋 **Deletion Results:**\n\n${results.join('\n')}\n\n✅ Successfully deleted ${successCount} out of ${selectedAppointments.length} appointments.`;
    
    return {
      success: successCount > 0,
      message: message
    };
  }

  /**
   * Handle appointment update with selected appointment
   */
  async handleAppointmentUpdate(selectedAppointment, updateData, ragService) {
    try {
      const updatePayload = {
        title: updateData.title || selectedAppointment.title,
        appointment_date: updateData.date ? ragService.convertToDate(updateData.date) : selectedAppointment.appointment_date,
        appointment_time: updateData.time ? ragService.convertToTime(updateData.time) : selectedAppointment.appointment_time,
        appointment_location: updateData.location || selectedAppointment.appointment_location,
        content: updateData.note || selectedAppointment.content
      };
      
      // Import BASE_URL from environment
      const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000';
      
      const response = await fetch(`${BASE_URL}/update_appointment/${selectedAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
      
      if (response.ok) {
        return {
          success: true,
          message: `✅ Appointment "${updatePayload.title}" updated successfully!\n\n📅 Date: ${updatePayload.appointment_date}\n⏰ Time: ${updatePayload.appointment_time}\n📍 Location: ${updatePayload.appointment_location}`
        };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update appointment');
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to update appointment: ${error.message}`
      };
    }
  }
}

// Export singleton instance
export const conversationContext = new ConversationContext();
export default conversationContext;
