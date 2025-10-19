/**
 * ActionExecutor - Maps JSON actions to SQL operations
 * Handles structured action execution with validation and error handling
 */

import { BASE_URL } from '@env';

class ActionExecutor {
  constructor() {
    this.actionHistory = [];
    this.isOnline = true;
  }

  /**
   * Execute a structured action
   * @param {Object} action - The action object with type and payload
   * @param {Object} userContext - User context information
   * @returns {Promise<Object>} - Execution result
   */
  async executeAction(action, userContext = {}) {
    try {
      // Validate action structure
      if (!this.validateAction(action)) {
        return {
          success: false,
          message: '❌ Invalid action structure',
          error: 'Missing required fields: type and payload'
        };
      }

      // Execute the action and get result
      let result;
      switch (action.type) {
        case 'create_appointment':
          result = await this.createAppointment(action.payload, userContext);
          break;
        
        case 'update_appointment':
          result = await this.updateAppointment(action.payload, userContext);
          break;
        
        case 'delete_appointment':
          result = await this.deleteAppointment(action.payload, userContext);
          break;
        
        case 'create_weight':
          result = await this.createWeight(action.payload, userContext);
          break;
        
        case 'create_mood':
          result = await this.createMood(action.payload, userContext);
          break;
        
        case 'create_sleep':
          result = await this.createSleep(action.payload, userContext);
          break;
        
        case 'create_symptom':
          result = await this.createSymptom(action.payload, userContext);
          break;
        
        case 'create_medicine':
          result = await this.createMedicine(action.payload, userContext);
          break;
        
        case 'create_blood_pressure':
          result = await this.createBloodPressure(action.payload, userContext);
          break;
        
        case 'query_stats':
          result = await this.queryStats(action.payload, userContext);
          break;
        
        case 'undo_last':
          result = await this.undoLastAction(userContext);
          break;
        
        case 'navigate':
          result = await this.navigate(action.payload, userContext);
          break;
        
        default:
          result = {
            success: false,
            message: `❌ Unknown action type: ${action.type}`,
            error: 'Unsupported action type'
          };
          break;
      }

      // Only log successful actions that can be undone
      if (result.success && this.isUndoableAction(action.type)) {
        this.logAction(action, userContext, result);
      }

      return result;
    } catch (error) {
      console.error('ActionExecutor error:', error);
      return {
        success: false,
        message: `❌ Action execution failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Validate action structure
   */
  validateAction(action) {
    if (!action || typeof action !== 'object') {
      return false;
    }
    
    if (!action.type || typeof action.type !== 'string') {
      return false;
    }
    
    if (!action.payload || typeof action.payload !== 'object') {
      return false;
    }
    
    return true;
  }

  /**
   * Check if an action type can be undone
   */
  isUndoableAction(actionType) {
    const undoableActions = [
      'create_appointment',
      'update_appointment', 
      'delete_appointment',
      'create_weight',
      'create_mood',
      'create_sleep',
      'create_symptom',
      'create_medicine',
      'create_blood_pressure'
    ];
    return undoableActions.includes(actionType);
  }

  /**
   * Log action for undo functionality
   */
  logAction(action, userContext, result) {
    const actionLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action: action,
      userContext: userContext,
      result: result,
      executed: true,
      undone: false
    };
    
    this.actionHistory.push(actionLog);
    
    // Keep only last 50 actions
    if (this.actionHistory.length > 50) {
      this.actionHistory = this.actionHistory.slice(-50);
    }
  }

  /**
   * Create appointment action
   */
  async createAppointment(payload, userContext) {
    try {
      // Validate required fields
      const requiredFields = ['title', 'startISO'];
      const missingFields = requiredFields.filter(field => !payload[field]);
      
      if (missingFields.length > 0) {
        return {
          success: false,
          message: `❌ Missing required fields: ${missingFields.join(', ')}`,
          error: 'Missing required fields',
          missingFields: missingFields
        };
      }

      // Prepare appointment data
      const appointmentData = {
        title: payload.title,
        description: payload.description || '',
        location: payload.location || '',
        appointment_date: this.formatDate(payload.startISO),
        appointment_time: this.formatTime(payload.startISO),
        appointment_status: 'scheduled',
        content: payload.description || '',
        week_number: userContext.current_week || 12
      };

      const response = await fetch(`${BASE_URL}/create_appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: `✅ Appointment "${payload.title}" created successfully!\n\n📅 Date: ${appointmentData.appointment_date}\n⏰ Time: ${appointmentData.appointment_time}\n📍 Location: ${appointmentData.location}`,
          data: result,
          actionType: 'create_appointment',
          appointmentId: result.id || result.appointment_id // Include ID for rollback
        };
      } else {
        throw new Error('Failed to create appointment');
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to create appointment: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Update appointment action
   */
  async updateAppointment(payload, userContext) {
    try {
      if (!payload.id) {
        return {
          success: false,
          message: '❌ Appointment ID is required for update',
          error: 'Missing appointment ID'
        };
      }

      const updateData = {};
      if (payload.title) updateData.title = payload.title;
      if (payload.description) updateData.description = payload.description;
      if (payload.location) updateData.appointment_location = payload.location;
      if (payload.startISO) {
        updateData.appointment_date = this.formatDate(payload.startISO);
        updateData.appointment_time = this.formatTime(payload.startISO);
      }

      const response = await fetch(`${BASE_URL}/update_appointment/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        return {
          success: true,
          message: `✅ Appointment updated successfully!`,
          actionType: 'update_appointment'
        };
      } else {
        throw new Error('Failed to update appointment');
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to update appointment: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Delete appointment action
   */
  async deleteAppointment(payload, userContext) {
    try {
      if (!payload.id) {
        return {
          success: false,
          message: '❌ Appointment ID is required for deletion',
          error: 'Missing appointment ID'
        };
      }

      const response = await fetch(`${BASE_URL}/delete_appointment/${payload.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        return {
          success: true,
          message: `✅ Appointment deleted successfully!`,
          actionType: 'delete_appointment'
        };
      } else {
        throw new Error('Failed to delete appointment');
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to delete appointment: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Create weight entry action
   */
  async createWeight(payload, userContext) {
    try {
      if (!payload.weight) {
        return {
          success: false,
          message: '❌ Weight value is required',
          error: 'Missing weight value'
        };
      }

      const weightData = {
        weight: payload.weight,
        week_number: payload.week || userContext.current_week || 12,
        note: payload.note || ''
      };

      const response = await fetch(`${BASE_URL}/weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weightData)
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: `⚖️ Weight logged successfully!\n\n**Weight:** ${payload.weight}\n**Week:** ${weightData.week_number}`,
          actionType: 'create_weight',
          weightId: result.id || result.weight_id // Include ID for rollback
        };
      } else {
        throw new Error('Failed to log weight');
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to log weight: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Create mood entry action
   */
  async createMood(payload, userContext) {
    try {
      if (!payload.mood) {
        return {
          success: false,
          message: '❌ Mood value is required',
          error: 'Missing mood value'
        };
      }

      const moodData = {
        mood: payload.mood,
        intensity: payload.intensity || 'medium',
        note: payload.note || '',
        week_number: userContext.current_week || 12
      };

      const response = await fetch(`${BASE_URL}/log_mood`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moodData)
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: `😊 Mood logged successfully!\n\n**Mood:** ${payload.mood}\n**Intensity:** ${moodData.intensity}`,
          actionType: 'create_mood',
          moodId: result.id || result.mood_id // Include ID for rollback
        };
      } else {
        throw new Error('Failed to log mood');
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to log mood: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Create sleep entry action
   */
  async createSleep(payload, userContext) {
    try {
      if (!payload.duration) {
        return {
          success: false,
          message: '❌ Sleep duration is required',
          error: 'Missing sleep duration'
        };
      }

      const sleepData = {
        duration: payload.duration,
        bedtime: payload.bedtime || null,
        wake_time: payload.wake_time || null,
        quality: payload.quality || 'good',
        note: payload.note || '',
        week_number: userContext.current_week || 12
      };

      const response = await fetch(`${BASE_URL}/log_sleep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sleepData)
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: `😴 Sleep logged successfully!\n\n**Duration:** ${payload.duration} hours\n**Quality:** ${sleepData.quality}`,
          actionType: 'create_sleep',
          sleepId: result.id || result.sleep_id // Include ID for rollback
        };
      } else {
        throw new Error('Failed to log sleep');
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to log sleep: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Create symptom entry action
   */
  async createSymptom(payload, userContext) {
    try {
      if (!payload.symptom) {
        return {
          success: false,
          message: '❌ Symptom description is required',
          error: 'Missing symptom description'
        };
      }

      const symptomData = {
        symptom: payload.symptom,
        week_number: payload.week || userContext.current_week || 12,
        note: payload.note || ''
      };

      const response = await fetch(`${BASE_URL}/symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(symptomData)
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: `🤒 Symptom logged successfully!\n\n**Symptom:** ${payload.symptom}`,
          actionType: 'create_symptom',
          symptomId: result.id || result.symptom_id // Include ID for rollback
        };
      } else {
        throw new Error('Failed to log symptom');
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to log symptom: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Create medicine entry action
   */
  async createMedicine(payload, userContext) {
    try {
      if (!payload.name) {
        return {
          success: false,
          message: '❌ Medicine name is required',
          error: 'Missing medicine name'
        };
      }

      const medicineData = {
        name: payload.name,
        dose: payload.dose || '',
        time: payload.time || '',
        week_number: payload.week || userContext.current_week || 12,
        note: payload.note || ''
      };

      const response = await fetch(`${BASE_URL}/medicine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicineData)
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: `💊 Medicine logged successfully!\n\n**Medicine:** ${payload.name}\n**Dose:** ${medicineData.dose}`,
          actionType: 'create_medicine',
          medicineId: result.id || result.medicine_id // Include ID for rollback
        };
      } else {
        throw new Error('Failed to log medicine');
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to log medicine: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Create blood pressure entry action
   */
  async createBloodPressure(payload, userContext) {
    try {
      if (!payload.systolic || !payload.diastolic) {
        return {
          success: false,
          message: '❌ Both systolic and diastolic values are required',
          error: 'Missing blood pressure values'
        };
      }

      const bpData = {
        systolic: payload.systolic,
        diastolic: payload.diastolic,
        week_number: payload.week || userContext.current_week || 12,
        note: payload.note || ''
      };

      const response = await fetch(`${BASE_URL}/blood_pressure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bpData)
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: `🩸 Blood pressure logged successfully!\n\n**BP:** ${payload.systolic}/${payload.diastolic} mmHg`,
          actionType: 'create_blood_pressure',
          bpId: result.id || result.bp_id // Include ID for rollback
        };
      } else {
        throw new Error('Failed to log blood pressure');
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to log blood pressure: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Query statistics action
   */
  async queryStats(payload, userContext) {
    try {
      if (!payload.metric) {
        return {
          success: false,
          message: '❌ Metric type is required',
          error: 'Missing metric type'
        };
      }

      const queryData = {
        metric: payload.metric,
        timeframe: payload.timeframe || 'week',
        chart_type: payload.chart_type || 'summary'
      };

      const response = await fetch(`${BASE_URL}/get_analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryData)
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: `📊 Analytics retrieved successfully!`,
          data: result,
          actionType: 'query_stats'
        };
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to fetch analytics: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Undo last action
   */
  async undoLastAction(userContext) {
    try {
      // Find the last executed, non-undone action
      const lastAction = this.actionHistory
        .slice()
        .reverse()
        .find(action => action.executed && !action.undone);
      
      if (!lastAction) {
        return {
          success: false,
          message: '❌ No actions to undo',
          error: 'No undoable action history available'
        };
      }

      // Perform the actual rollback operation
      const rollbackResult = await this.performRollback(lastAction);
      
      if (rollbackResult.success) {
        // Mark action as undone
        lastAction.undone = true;
        
        return {
          success: true,
          message: `↩️ Last action undone successfully!`,
          actionType: 'undo_last',
          undoneAction: lastAction.action.type,
          rollbackDetails: rollbackResult.message
        };
      } else {
        return {
          success: false,
          message: `❌ Failed to undo action: ${rollbackResult.message}`,
          error: rollbackResult.message
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to undo action: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Perform the actual rollback operation
   */
  async performRollback(actionLog) {
    try {
      const { action, result } = actionLog;
      
      switch (action.type) {
        case 'create_appointment':
          return await this.rollbackCreateAppointment(result);
        
        case 'update_appointment':
          return await this.rollbackUpdateAppointment(action.payload, result);
        
        case 'delete_appointment':
          return await this.rollbackDeleteAppointment(result);
        
        case 'create_weight':
          return await this.rollbackCreateWeight(result);
        
        case 'create_mood':
          return await this.rollbackCreateMood(result);
        
        case 'create_sleep':
          return await this.rollbackCreateSleep(result);
        
        case 'create_symptom':
          return await this.rollbackCreateSymptom(result);
        
        case 'create_medicine':
          return await this.rollbackCreateMedicine(result);
        
        case 'create_blood_pressure':
          return await this.rollbackCreateBloodPressure(result);
        
        default:
          return {
            success: false,
            message: `Cannot undo action type: ${action.type}`
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Rollback failed: ${error.message}`
      };
    }
  }

  /**
   * Navigate action
   */
  async navigate(payload, userContext) {
    try {
      if (!payload.screen) {
        return {
          success: false,
          message: '❌ Screen name is required for navigation',
          error: 'Missing screen name'
        };
      }

      return {
        success: true,
        message: `🚀 Navigating to ${payload.screen}...`,
        actionType: 'navigate',
        screen: payload.screen
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Navigation failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Rollback Methods - These perform the actual database operations to undo actions
   */

  async rollbackCreateAppointment(result) {
    try {
      if (result.appointmentId) {
        const response = await fetch(`${BASE_URL}/appointments/${result.appointmentId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          return {
            success: true,
            message: 'Appointment creation rolled back - appointment deleted'
          };
        }
      }
      return {
        success: false,
        message: 'No appointment ID found in result to rollback'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to rollback appointment creation: ${error.message}`
      };
    }
  }

  async rollbackUpdateAppointment(originalPayload, result) {
    try {
      if (result.appointmentId && result.previousData) {
        const response = await fetch(`${BASE_URL}/appointments/${result.appointmentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.previousData)
        });
        
        if (response.ok) {
          return {
            success: true,
            message: 'Appointment update rolled back - previous values restored'
          };
        }
      }
      return {
        success: false,
        message: 'Cannot rollback appointment update - missing data'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to rollback appointment update: ${error.message}`
      };
    }
  }

  async rollbackDeleteAppointment(result) {
    try {
      if (result.deletedAppointment) {
        const response = await fetch(`${BASE_URL}/appointments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.deletedAppointment)
        });
        
        if (response.ok) {
          return {
            success: true,
            message: 'Appointment deletion rolled back - appointment restored'
          };
        }
      }
      return {
        success: false,
        message: 'Cannot rollback appointment deletion - missing data'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to rollback appointment deletion: ${error.message}`
      };
    }
  }

  async rollbackCreateWeight(result) {
    try {
      if (result.weightId) {
        const response = await fetch(`${BASE_URL}/weight/${result.weightId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          return {
            success: true,
            message: 'Weight creation rolled back - weight entry deleted'
          };
        }
      }
      return {
        success: false,
        message: 'No weight ID found in result to rollback'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to rollback weight creation: ${error.message}`
      };
    }
  }

  async rollbackCreateMood(result) {
    try {
      if (result.moodId) {
        const response = await fetch(`${BASE_URL}/mood/${result.moodId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          return {
            success: true,
            message: 'Mood creation rolled back - mood entry deleted'
          };
        }
      }
      return {
        success: false,
        message: 'No mood ID found in result to rollback'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to rollback mood creation: ${error.message}`
      };
    }
  }

  async rollbackCreateSleep(result) {
    try {
      if (result.sleepId) {
        const response = await fetch(`${BASE_URL}/sleep/${result.sleepId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          return {
            success: true,
            message: 'Sleep creation rolled back - sleep entry deleted'
          };
        }
      }
      return {
        success: false,
        message: 'No sleep ID found in result to rollback'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to rollback sleep creation: ${error.message}`
      };
    }
  }

  async rollbackCreateSymptom(result) {
    try {
      if (result.symptomId) {
        const response = await fetch(`${BASE_URL}/symptoms/${result.symptomId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          return {
            success: true,
            message: 'Symptom creation rolled back - symptom entry deleted'
          };
        }
      }
      return {
        success: false,
        message: 'No symptom ID found in result to rollback'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to rollback symptom creation: ${error.message}`
      };
    }
  }

  async rollbackCreateMedicine(result) {
    try {
      if (result.medicineId) {
        const response = await fetch(`${BASE_URL}/medicine/${result.medicineId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          return {
            success: true,
            message: 'Medicine creation rolled back - medicine entry deleted'
          };
        }
      }
      return {
        success: false,
        message: 'No medicine ID found in result to rollback'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to rollback medicine creation: ${error.message}`
      };
    }
  }

  async rollbackCreateBloodPressure(result) {
    try {
      if (result.bpId) {
        const response = await fetch(`${BASE_URL}/blood_pressure/${result.bpId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          return {
            success: true,
            message: 'Blood pressure creation rolled back - BP entry deleted'
          };
        }
      }
      return {
        success: false,
        message: 'No BP ID found in result to rollback'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to rollback blood pressure creation: ${error.message}`
      };
    }
  }

  /**
   * Utility: Format ISO date to YYYY-MM-DD
   */
  formatDate(isoString) {
    if (!isoString) return null;
    
    const directMatch = isoString.match(/^\d{4}-\d{2}-\d{2}/);
    if (directMatch) {
      return directMatch[0];
    }
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  /**
   * Utility: Format ISO date to HH:MM
   */
  formatTime(isoString) {
    if (!isoString) return null;
    return new Date(isoString).toTimeString().slice(0, 5);
  }

  /**
   * Get action history for debugging
   */
  getActionHistory() {
    return this.actionHistory;
  }

  /**
   * Clear action history
   */
  clearActionHistory() {
    this.actionHistory = [];
  }
}

// Export singleton instance
export const actionExecutor = new ActionExecutor();
export default actionExecutor;
