/**
 * RAG (Retrieval-Augmented Generation) Service
 * Intelligent query processing system for BabyNest app
 * Handles all user queries with semantic understanding
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {updateProfile} from '../storage/profile';
import {
  addAppointment,
  deleteAppointment,
  getAppointments,
  updateAppointment,
} from '../storage/appointments';
import {
  addBPLog,
  deleteBPLog,
  getBPLogs,
  updateBPLog,
} from '../storage/bloodPressure';
import {generateRAGResponse, generateResponse} from '../model/model';
import {
  addDischargeLog,
  deleteDischargeLog,
  getDischargeLogs,
  updateDischargeLog,
} from '../storage/discharge';
import {
  deleteMedicine,
  getAllMedicine,
  updateMedicine,
} from '../storage/medicine';
import {
  addSymptom,
  deleteSymptom,
  getAllSymptoms,
  updateSymptom,
} from '../storage/symptoms';
import {addTask, getTasks} from '../storage/tasks';
import {
  addWeight,
  deleteWeight,
  getAllWeights,
  updateWeight,
} from '../storage/weight';
import {openDB} from '../database';

class RAGService {
  constructor() {
    this.intentEmbeddings = {};
    this.conversationContext = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the RAG system with intent embeddings
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load pre-computed intent embeddings
      this.intentEmbeddings = await this.loadIntentEmbeddings();
      this.isInitialized = true;
      console.log('🧠 RAG Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RAG service:', error);
      throw error;
    }
  }

  /**
   * Load intent embeddings for semantic matching
   */
  async loadIntentEmbeddings() {
    return {
      // Appointment intents
      create_appointment: {
        keywords: [
          'appointment',
          'schedule',
          'book',
          'meeting',
          'visit',
          'consultation',
        ],
        examples: [
          'make an appointment',
          'schedule a visit',
          'book appointment for tomorrow',
          'I need to see a doctor',
          'can I get an appointment',
          'schedule ultrasound',
          'book consultation',
        ],
        action: 'createAppointment',
        requiredFields: ['title', 'date', 'time', 'location'],
        optionalFields: ['note'],
      },

      // Weight logging intents
      log_weight: {
        keywords: ['weight', 'weigh', 'kg', 'kilos', 'pounds', 'lbs'],
        examples: [
          'log my weight',
          'my weight is 65kg',
          'I weigh 65kg',
          'record weight',
          'add weight',
          'weight 65kg',
          'log weight 65kg for week 12',
        ],
        action: 'logWeight',
        requiredFields: ['weight'],
        optionalFields: ['week_number', 'note'],
      },

      // Symptom logging intents
      log_symptoms: {
        keywords: [
          'symptom',
          'symptoms',
          'feeling',
          'pain',
          'ache',
          'nausea',
          'sick',
        ],
        examples: [
          'log symptoms',
          'I have nausea',
          'feeling sick',
          'add symptom',
          'record symptoms',
          'I feel dizzy',
          'morning sickness',
          'log symptom nausea',
        ],
        action: 'logSymptoms',
        requiredFields: ['symptom'],
        optionalFields: ['week_number', 'note'],
      },

      // Analytics and query intents
      query_analytics: {
        keywords: [
          'analytics',
          'stats',
          'statistics',
          'trend',
          'average',
          'summary',
          'report',
          'show',
          'chart',
          'graph',
          'visualization',
        ],
        examples: [
          'show weight analytics',
          'show weight trend',
          'weight analytics',
          'sleep analytics',
          'mood analytics',
          'blood pressure analytics',
          'show sleep data',
          'weight chart',
          'sleep trend',
          'mood summary',
          'analytics dashboard',
          'show my health data',
          'generate health report',
          'weight statistics',
          'sleep statistics',
          'mood statistics',
        ],
        action: 'queryAnalytics',
        requiredFields: ['metric'],
        optionalFields: ['timeframe', 'chart_type'],
      },

      // Blood pressure logging intents
      log_blood_pressure: {
        keywords: ['blood pressure', 'bp', 'pressure', 'systolic', 'diastolic'],
        examples: [
          'log blood pressure',
          'blood pressure 120/80',
          'my bp is 120/80',
          'record blood pressure',
          'bp 120/80',
          'pressure reading',
        ],
        action: 'logBloodPressure',
        requiredFields: ['systolic', 'diastolic', 'time'],
        optionalFields: ['week_number', 'note'],
      },

      // Medicine logging intents
      log_medicine: {
        keywords: [
          'medicine',
          'medication',
          'med',
          'pill',
          'tablet',
          'drug',
          'took',
          'taking',
          'log',
          'prescription',
        ],
        examples: [
          'log medicine',
          'log medicine prescription',
          'I want to log a medicine prescription',
          'took paracetamol',
          'taking medicine',
          'add medication',
          'record medicine',
          'medicine paracetamol',
          'took 500mg paracetamol',
        ],
        action: 'logMedicine',
        requiredFields: ['name', 'dose', 'time'],
        optionalFields: ['week_number', 'note'],
      },

      // Discharge logging intents
      log_discharge: {
        keywords: ['discharge', 'bleeding', 'spotting', 'flow'],
        examples: [
          'log discharge',
          'having discharge',
          'bleeding',
          'spotting',
          'record discharge',
          'discharge normal',
        ],
        action: 'logDischarge',
        requiredFields: ['type', 'color', 'bleeding'],
        optionalFields: ['week_number', 'note'],
      },

      // Task creation intents
      create_task: {
        keywords: ['task', 'reminder', 'todo', 'schedule', 'need to', 'should'],
        examples: [
          'create task',
          'add reminder',
          'need ultrasound',
          'schedule blood test',
          'create reminder',
          'add todo',
          'task ultrasound scan',
        ],
        action: 'createTask',
        requiredFields: ['title'],
        optionalFields: ['week', 'priority', 'note'],
      },

      // View logs intents
      view_weight_logs: {
        keywords: [
          'weight logs',
          'weight history',
          'weight entries',
          'show weight',
          'view weight',
          'my weights',
          'weight records',
        ],
        examples: [
          'show my weight logs',
          'view weight history',
          'display weight entries',
          'show all weights',
          'my weight records',
          'weight tracking history',
        ],
        action: 'viewWeightLogs',
        requiredFields: [],
        optionalFields: ['week_number', 'limit'],
      },

      view_medicine_logs: {
        keywords: [
          'medicine logs',
          'medicine history',
          'medicine entries',
          'show medicine',
          'view medicine',
          'my medicines',
          'medicine records',
          'prescription history',
        ],
        examples: [
          'show my medicine logs',
          'view medicine history',
          'display medicine entries',
          'show all medicines',
          'my medicine records',
          'prescription tracking history',
        ],
        action: 'viewMedicineLogs',
        requiredFields: [],
        optionalFields: ['week_number', 'limit'],
      },

      view_symptoms_logs: {
        keywords: [
          'symptoms logs',
          'symptoms history',
          'symptoms entries',
          'show symptoms',
          'view symptoms',
          'my symptoms',
          'symptoms records',
        ],
        examples: [
          'show my symptoms logs',
          'view symptoms history',
          'display symptoms entries',
          'show all symptoms',
          'my symptoms records',
          'symptoms tracking history',
        ],
        action: 'viewSymptomsLogs',
        requiredFields: [],
        optionalFields: ['week_number', 'limit'],
      },

      view_blood_pressure_logs: {
        keywords: [
          'blood pressure logs',
          'bp logs',
          'bp history',
          'blood pressure history',
          'bp entries',
          'show blood pressure',
          'view blood pressure',
          'my bp records',
        ],
        examples: [
          'show my blood pressure logs',
          'view bp history',
          'display blood pressure entries',
          'show all bp readings',
          'my blood pressure records',
          'bp tracking history',
        ],
        action: 'viewBloodPressureLogs',
        requiredFields: [],
        optionalFields: ['week_number', 'limit'],
      },

      view_discharge_logs: {
        keywords: [
          'discharge logs',
          'discharge history',
          'discharge entries',
          'show discharge',
          'view discharge',
          'my discharge records',
        ],
        examples: [
          'show my discharge logs',
          'view discharge history',
          'display discharge entries',
          'show all discharge records',
          'my discharge tracking',
        ],
        action: 'viewDischargeLogs',
        requiredFields: [],
        optionalFields: ['week_number', 'limit'],
      },

      // Navigation intents
      navigate: {
        keywords: [
          'go to',
          'navigate',
          'open',
          'show',
          'take me to',
          'switch to',
        ],
        examples: [
          'go to weight screen',
          'navigate to appointments',
          'open calendar',
          'show symptoms',
          'take me to home',
          'switch to medicine',
          'open timeline',
        ],
        action: 'navigate',
        requiredFields: ['screen'],
        optionalFields: [],
      },

      // Profile update intents
      update_profile: {
        keywords: ['update', 'change', 'set', 'modify', 'edit'],
        examples: [
          'update my name',
          'change due date',
          'set my age',
          'update phone number',
          'modify profile',
          'edit details',
        ],
        action: 'updateProfile',
        requiredFields: [],
        optionalFields: ['value'],
      },

      // Data retrieval intents
      get_data: {
        keywords: [
          'show',
          'get',
          'list',
          'view',
          'display',
          'see',
          'when',
          'upcoming',
          'next',
          'schedule',
          'appointment',
        ],
        examples: [
          'show appointments',
          'get my weight history',
          'list symptoms',
          'view medicine log',
          'display tasks',
          'see blood pressure',
          'when is my upcoming appointment',
          'what are my next appointments',
          'show my schedule',
          'list my appointments',
          'when is my next appointment',
          'upcoming appointments',
        ],
        action: 'getData',
        requiredFields: ['type'],
        optionalFields: ['week', 'date'],
      },

      // Appointment management intents
      update_appointment: {
        keywords: ['update', 'change', 'modify', 'edit', 'reschedule'],
        examples: [
          'update appointment',
          'change appointment time',
          'modify appointment date',
          'edit appointment',
          'reschedule appointment',
          'update my appointment',
          'change ultrasound appointment',
        ],
        action: 'updateAppointment',
        requiredFields: ['appointment_identifier'],
        optionalFields: ['title', 'date', 'time', 'location', 'note'],
      },

      delete_appointment: {
        keywords: [
          'delete',
          'remove',
          'cancel',
          'delete appointment',
          'cancel appointment',
        ],
        examples: [
          'delete appointment',
          'remove appointment',
          'cancel appointment',
          'delete my appointment',
          'cancel ultrasound',
          'remove checkup appointment',
          'delete appointment on monday',
        ],
        action: 'deleteAppointment',
        requiredFields: ['appointment_identifier'],
        optionalFields: [],
      },

      // Emergency intents
      emergency: {
        keywords: ['emergency', 'help', 'urgent', 'sos', 'critical'],
        examples: [
          'emergency',
          'help me',
          'urgent',
          'sos',
          'critical situation',
          'need help',
        ],
        action: 'emergency',
        requiredFields: [],
        optionalFields: ['type'],
      },

      // Logout intents
      logout: {
        keywords: ['logout', 'sign out', 'exit', 'quit'],
        examples: ['logout', 'sign out', 'exit app', 'quit', 'log out'],
        action: 'logout',
        requiredFields: [],
        optionalFields: [],
      },

      // Medicine CRUD operations
      update_medicine: {
        keywords: [
          'update',
          'change',
          'modify',
          'edit',
          'medicine',
          'medication',
          'med',
        ],
        examples: [
          'update medicine',
          'change medication',
          'modify medicine entry',
          'edit medicine record',
          'update paracetamol dose',
          'change medicine time',
        ],
        action: 'updateMedicine',
        requiredFields: ['medicine_name'],
        optionalFields: ['dose', 'frequency', 'start_date', 'end_date', 'note'],
      },

      delete_medicine: {
        keywords: ['delete', 'remove', 'stop', 'medicine', 'medication', 'med'],
        examples: [
          'delete medicine',
          'remove medication',
          'stop taking medicine',
          'delete paracetamol',
          'remove medicine entry',
        ],
        action: 'deleteMedicine',
        requiredFields: ['medicine_name'],
        optionalFields: ['date'],
      },

      // Blood Pressure CRUD operations
      update_blood_pressure: {
        keywords: [
          'update',
          'change',
          'modify',
          'edit',
          'blood pressure',
          'bp',
        ],
        examples: [
          'update blood pressure',
          'change bp reading',
          'modify blood pressure',
          'edit bp entry',
          'update pressure reading',
        ],
        action: 'updateBloodPressure',
        requiredFields: ['systolic', 'diastolic'],
        optionalFields: ['date', 'time', 'note'],
      },

      delete_blood_pressure: {
        keywords: ['delete', 'remove', 'blood pressure', 'bp'],
        examples: [
          'delete blood pressure',
          'remove bp reading',
          'delete pressure entry',
          'remove blood pressure record',
        ],
        action: 'deleteBloodPressure',
        requiredFields: ['date'],
        optionalFields: ['time'],
      },

      // Discharge CRUD operations
      update_discharge: {
        keywords: [
          'update',
          'change',
          'modify',
          'edit',
          'discharge',
          'bleeding',
          'spotting',
        ],
        examples: [
          'update discharge',
          'change discharge record',
          'modify bleeding entry',
          'edit discharge log',
          'update spotting record',
        ],
        action: 'updateDischarge',
        requiredFields: ['discharge_type'],
        optionalFields: ['date', 'time', 'note'],
      },

      delete_discharge: {
        keywords: ['delete', 'remove', 'discharge', 'bleeding', 'spotting'],
        examples: [
          'delete discharge',
          'remove discharge entry',
          'delete bleeding record',
          'remove discharge log',
        ],
        action: 'deleteDischarge',
        requiredFields: ['date'],
        optionalFields: ['time'],
      },

      // Symptoms CRUD operations
      update_symptoms: {
        keywords: ['update', 'change', 'modify', 'edit', 'symptoms', 'symptom'],
        examples: [
          'update symptoms',
          'change symptom entry',
          'modify symptoms',
          'edit symptom record',
          'update nausea entry',
        ],
        action: 'updateSymptoms',
        requiredFields: ['symptom'],
        optionalFields: ['date', 'time', 'note'],
      },

      delete_symptoms: {
        keywords: ['delete', 'remove', 'symptoms', 'symptom'],
        examples: [
          'delete symptoms',
          'remove symptom entry',
          'delete symptom record',
          'remove symptoms log',
        ],
        action: 'deleteSymptoms',
        requiredFields: ['date'],
        optionalFields: ['time'],
      },

      // Weight CRUD operations
      update_weight: {
        keywords: ['update', 'change', 'modify', 'edit', 'weight'],
        examples: [
          'update weight',
          'change weight entry',
          'modify weight record',
          'edit weight log',
          'update weight reading',
        ],
        action: 'updateWeight',
        requiredFields: ['weight'],
        optionalFields: ['date', 'week', 'note'],
      },

      delete_weight: {
        keywords: ['delete', 'remove', 'weight'],
        examples: [
          'delete weight',
          'remove weight entry',
          'delete weight record',
          'remove weight log',
        ],
        action: 'deleteWeight',
        requiredFields: ['date'],
        optionalFields: ['time'],
      },
    };
  }

  /**
   * Process user query with semantic understanding
   */
  async processQuery(userQuery, userContext = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🧠 Processing query:', userQuery);

      // 1. Find the best matching intent
      const bestIntent = await this.findBestIntent(userQuery);
      console.log("Intent found ", bestIntent);

      // 2. Extract structured data from the query
      const extractedData = await this.extractData(userQuery, bestIntent);
      console.log("Data extracted", bestIntent);

      // 3. Check if we have all required information
      const missingFields = this.checkMissingFields(extractedData, bestIntent);

      if (missingFields.length > 0) {
        // Generate follow-up questions
        return await this.generateFollowUpQuestions(
          bestIntent,
          missingFields,
          extractedData,
        );
      }

      // 4. Execute the action
      return await this.executeAction(bestIntent, extractedData, userContext);
    } catch (error) {
      console.error('RAG processing error:', error);
      return {
        success: false,
        message: `❌ I'm having trouble understanding that. Could you try rephrasing your request?`,
        error: error.message,
      };
    }
  }

  /**
   * Find the best matching intent using semantic similarity
   */
  async findBestIntent(userQuery) {
    const query = userQuery.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    // Ensure intentEmbeddings is valid
    if (!this.intentEmbeddings || typeof this.intentEmbeddings !== 'object') {
      console.error('intentEmbeddings is not valid:', this.intentEmbeddings);
      return {
        name: 'unknown',
        action: 'unknown',
        confidence: 0,
      };
    }

    // Special case: If query contains analytics-related keywords, prioritize analytics intent
    const analyticsKeywords = [
      'analytics',
      'stats',
      'analysis',
      'analyse',
      'statistics',
      'trend',
      'chart',
      'graph',
      'report',
    ];
    const hasAnalyticsKeyword = analyticsKeywords.some(keyword =>
      query.includes(keyword),
    );

    if (hasAnalyticsKeyword) {
      const analyticsIntent = this.intentEmbeddings['query_analytics'];
      if (analyticsIntent) {
        return {
          name: 'query_analytics',
          ...analyticsIntent,
          confidence: 1.0,
        };
      }
    }

    // Special case: If query contains view-related keywords, prioritize view logs intents
    const viewLogsKeywords = [
      'logs',
      'history',
      'entries',
      'records',
      'show',
      'view',
      'display',
      'all',
    ];
    const hasViewLogsKeyword = viewLogsKeywords.some(keyword =>
      query.includes(keyword),
    );

    if (hasViewLogsKeyword) {
      if (query.includes('weight')) {
        const weightLogsIntent = this.intentEmbeddings['view_weight_logs'];
        if (weightLogsIntent) {
          return {
            name: 'view_weight_logs',
            ...weightLogsIntent,
            confidence: 1.0,
          };
        }
      }

      if (query.includes('medicine')) {
        const medicineLogsIntent = this.intentEmbeddings['view_medicine_logs'];
        if (medicineLogsIntent) {
          return {
            name: 'view_medicine_logs',
            ...medicineLogsIntent,
            confidence: 1.0,
          };
        }
      }

      if (query.includes('symptoms')) {
        const symptomsLogsIntent = this.intentEmbeddings['view_symptoms_logs'];
        if (symptomsLogsIntent) {
          return {
            name: 'view_symptoms_logs',
            ...symptomsLogsIntent,
            confidence: 1.0,
          };
        }
      }

      if (query.includes('blood pressure') || query.includes('bp')) {
        const bpLogsIntent = this.intentEmbeddings['view_blood_pressure_logs'];
        if (bpLogsIntent) {
          return {
            name: 'view_blood_pressure_logs',
            ...bpLogsIntent,
            confidence: 1.0,
          };
        }
      }

      if (query.includes('discharge')) {
        const dischargeLogsIntent =
          this.intentEmbeddings['view_discharge_logs'];
        if (dischargeLogsIntent) {
          return {
            name: 'view_discharge_logs',
            ...dischargeLogsIntent,
            confidence: 1.0,
          };
        }
      }
    }

    for (const [intentName, intentData] of Object.entries(
      this.intentEmbeddings,
    )) {
      let score = 0;

      // Check keyword matches
      for (const keyword of intentData.keywords) {
        if (query.includes(keyword.toLowerCase())) {
          score += 2; // Higher weight for keyword matches
        }
      }

      // Check example matches
      for (const example of intentData.examples) {
        const similarity = this.calculateSimilarity(
          query,
          example.toLowerCase(),
        );
        score += similarity;
      }

      // Normalize score
      score = score / (intentData.keywords.length + intentData.examples.length);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          name: intentName,
          ...intentData,
          confidence: score,
        };
      }
    }

    // If no good match found, return a default intent
    if (!bestMatch || bestScore < 0.1) {
      return {
        name: 'general_chat',
        action: 'generalChat',
        requiredFields: [],
        optionalFields: [],
        confidence: 0,
      };
    }

    return bestMatch;
  }

  /**
   * Calculate similarity between two strings
   */
  calculateSimilarity(str1, str2) {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');

    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2) {
          matches++;
          break;
        }
      }
    }

    return matches / Math.max(words1.length, words2.length);
  }

  /**
   * Extract structured data from user query
   */
  async extractData(userQuery, intent) {
    const data = {};
    const query = userQuery.toLowerCase();

    switch (intent.name) {
      case 'query_analytics':
        data.metric = this.extractAnalyticsMetric(query);
        break;

      case 'create_appointment':
        const systemPromptForAppointment =
          this.getAppointmentExtractionPrompt();

        const extractedDataForAppointment = await generateRAGResponse(
          query,
          systemPromptForAppointment,
        );

        if (!extractedDataForAppointment) {
          throw new Error('Failed to extract appointment details.');
        }

        data.title = extractedDataForAppointment.title ?? null;
        data.date = extractedDataForAppointment.date ?? null;
        data.time = extractedDataForAppointment.time ?? null;
        data.location = extractedDataForAppointment.location ?? null;

        break;

      case 'log_weight':
        const systemPromptForWeight = this.getWeightExtractionPrompt();

        const extractedDataForWeight = await generateRAGResponse(
          query,
          systemPromptForWeight,
        );
        
        if (!extractedDataForWeight) {
          throw new Error('Failed to extract weight details.');
        }

        data.weight = extractedDataForWeight.weight ?? null;
        data.week_number = extractedDataForWeight.week_number ?? null;
        data.note = extractedDataForWeight.note ?? null;
        break;

      case 'log_symptoms':
        const systemPromptForSymptoms = this.getSymptomsExtractionPrompt();

        const extractedDataForSymptoms = await generateRAGResponse(
          query,
          systemPromptForSymptoms,
        );

        if (!extractedDataForSymptoms) {
          throw new Error('Failed to extract symptom details.');
        }
        const symptomData = extractedDataForSymptoms.data;

        data.symptom = symptomData.symptom ?? null;
        data.week_number = symptomData.week_number ?? null;
        data.note = symptomData.note ?? null;

        break;

      case 'log_blood_pressure':
        const systemPromptForBloodPressure =
          this.getBloodPressureExtractionPrompt();
        const extractedDataForBloodPressure = await generateRAGResponse(
          query,
          systemPromptForBloodPressure,
        );

        if (!extractedDataForBloodPressure) {
          throw new Error('Failed to extract blood pressure details.');
        }

        const bloodPressureData = extractedDataForBloodPressure.data;

        data.systolic = bloodPressureData.systolic ?? null;
        data.diastolic = bloodPressureData.diastolic ?? null;
        data.time = bloodPressureData.time ?? null;
        data.week_number = bloodPressureData.week_number ?? null;
        data.note = bloodPressureData.note ?? null;

        break;

      case 'log_medicine':
        console.log('🔍 DEBUG: Extracting medicine data from query:', query);
        const systemPromptForMedicine = this.getMedicineExtractionPrompt();
        const extractedDataForMedicine = await generateRAGResponse(
          query,
          systemPromptForMedicine,
        );

        if (!extractedDataForMedicine) {
          throw new Error('Failed to extract medicine details.');
        }
        const medicineData = extractedDataForMedicine.data;

        data.name = medicineData.name ?? null;
        data.dose = medicineData.dose ?? null;
        data.time = medicineData.time ?? null;
        data.week_number = medicineData.week_number ?? null;
        data.note = medicineData.note ?? null;
        console.log('🔍 DEBUG: Extracted medicine data:', data);
        break;

      case 'log_discharge':
        const systemPromptForDischarge = this.getDischargeExtractionPrompt();
        const extractedDataForDischarge = await generateRAGResponse(
          query,
          systemPromptForDischarge,
        );

        if (!extractedDataForDischarge) {
          throw new Error('Failed to extract discharge details.');
        }
        const dischargeData = extractedDataForDischarge.data;

        data.type = dischargeData.type ?? null;
        data.color = dischargeData.color ?? null;
        data.bleeding = dischargeData.bleeding ?? null;
        data.week_number = dischargeData.week_number ?? null;
        data.note = dischargeData.note ?? null;

        break;

      case 'create_task':
        const systemPromptForTask = this.getTaskExtractionPrompt();
        const extractedDataForTask = await generateRAGResponse(
          query,
          systemPromptForTask,
        );

        if (!extractedDataForTask) {
          throw new Error('Failed to extract task details.');
        }

        const taskData = extractedDataForTask.data;

        data.title = taskData.title ?? null;
        data.week = taskData.week ?? null;
        data.priority = taskData.priority ?? null;
        data.note = taskData.note ?? null;

        break;

      case 'navigate':
        data.screen = this.extractScreenName(query);
        break;

      case 'update_profile':
        const systemPromptForProfile = this.getProfileExtractionPrompt();
        const extractedDataForProfile = await generateRAGResponse(
          query,
          systemPromptForProfile,
        );

        if (!extractedDataForProfile) {
          throw new Error('Failed to extract profile details.');
        }

        const profileData = extractedDataForProfile.data;

        for (const field of [
          'age',
          'location',
          'due_date',
          'lmp',
          'name',
          'periodLength',
        ]) {
          if (profileData[field] !== null && profileData[field] !== undefined) {
            data[field] = profileData[field];
          }
        }
        break;

      case 'get_data':
        const systemPromptForData = this.getDataExtractionPrompt();
        const extractedDataForData = await generateRAGResponse(
          query,
          systemPromptForData,
        );

        if (!extractedDataForData) {
          throw new Error('Failed to extract data query details.');
        }

        const requestedData = extractedDataForData.data;

        data.type = requestedData.type ?? null;
        data.week = requestedData.week ?? null;
        data.date = requestedData.date ?? null;
        break;

      case 'update_appointment':
        const systemPromptForUpdateAppointment =
          this.getUpdateAppointmentExtractionPrompt();

        const extractedDataForUpdateAppointment = await generateRAGResponse(
          query,
          systemPromptForUpdateAppointment,
        );

        if (!extractedDataForUpdateAppointment) {
          throw new Error('Failed to extract appointment update details.');
        }

        const appointmentData = extractedDataForUpdateAppointment.data;

        data.appointment_identifier =
          appointmentData.appointment_identifier ?? null;
        data.title = appointmentData.title ?? null;
        data.date = appointmentData.date ?? null;
        data.time = appointmentData.time ?? null;
        data.location = appointmentData.location ?? null;
        data.note = appointmentData.note ?? null;
        break;

      case 'delete_appointment':
        data.appointment_identifier = null;
        break;

      case 'view_weight_logs':
        break;

      case 'view_medicine_logs':
        break;

      case 'view_symptoms_logs':
        break;

      case 'view_blood_pressure_logs':
        break;

      case 'view_discharge_logs':
        break;

      case 'general_chat':
        data.message = userQuery;
        break;
    }

    return data;
  }

  extractAnalyticsMetric = query => {
    const appointmentsMetricData = [
      'appointment',
      'appointments',
      'schedule',
      'schedules',
      'scheduled',
      'booking',
      'bookings',
      'checkup',
      'check-up',
      'visit',
      'visits',
    ];

    const tasksMetricData = [
      'task',
      'tasks',
      'todo',
      'to-do',
      'todos',
      'to-dos',
      'pending task',
      'completed task',
      'activity',
      'activities',
    ];

    const blood_pressure_logsMetricData = [
      'blood pressure',
      'blood pressures',
      'bp',
      'systolic',
      'diastolic',
      'hypertension',
    ];

    const discharge_logsMetricData = [
      'discharge',
      'discharges',
      'vaginal discharge',
      'fluid discharge',
      'discharge log',
    ];

    const weightMetricData = [
      'weight',
      'weights',
      'body weight',
      'weight gain',
      'weight loss',
    ];

    const medicineMetricData = [
      'medicine',
      'medicines',
      'medication',
      'medications',
      'drug',
      'drugs',
      'pills',
      'tablets',
    ];

    const symptomsMetricData = [
      'symptom',
      'symptoms',
      'pain',
      'nausea',
      'vomiting',
      'headache',
      'fatigue',
      'cramps',
      'dizziness',
    ];

    const metrics = [
      {
        keywords: appointmentsMetricData,
        metric: 'appointment_metric',
      },
      {
        keywords: tasksMetricData,
        metric: 'task_metric',
      },
      {
        keywords: blood_pressure_logsMetricData,
        metric: 'blood_pressure_metric',
      },
      {
        keywords: discharge_logsMetricData,
        metric: 'discharge_metric',
      },
      {
        keywords: weightMetricData,
        metric: 'weight_metric',
      },
      {
        keywords: medicineMetricData,
        metric: 'medicine_metric',
      },
      {
        keywords: symptomsMetricData,
        metric: 'symptom_metric',
      },
    ];

    if (typeof query !== 'string' || !query.trim()) {
      return null;
    }

    const normalizedQuery = query.toLowerCase();

    const matchedMetric = metrics.find(({keywords}) =>
      keywords.some(keyword => {
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const regex = new RegExp(
          `(^|[^a-z0-9])${escapedKeyword}([^a-z0-9]|$)`,
          'i',
        );

        return regex.test(normalizedQuery);
      }),
    );

    return matchedMetric?.metric ?? null;
  };

  /**
   *
   * @returns String
   */
  getUpdateAppointmentExtractionPrompt = () => {
    const currentDate = new Date().toISOString().slice(0, 10);

    return `
      You are a structured data extraction engine for BabyNest.

      Extract appointment identification and update details from the user's query.
      Do not answer conversationally or execute any action.

      Return only a valid JSON object in this exact structure:

      {
        "intent": "update_appointment",
        "data": {
          "appointment_identifier": {
            "type": null,
            "value": null
          },
          "title": null,
          "date": null,
          "time": null,
          "location": null,
          "note": null
        },
        "missing_fields": [],
        "needs_clarification": false
      }

      Rules:
      - appointment_identifier identifies the existing appointment to update.
      - Its type must be one of: "title", "date", "time", "location",
        "relative", or "day".
      - Its value must identify the existing appointment using information
        explicitly stated by the user.
      - Prefer a specific existing appointment title when mentioned.
      - Otherwise, use its explicit date, time, or location if provided.
      - Recognize relative references such as "my next appointment",
        "last appointment", "first appointment", "second appointment",
        "upcoming appointment", "appointment tomorrow", or weekdays.
      - For relative references, use type "relative" and preserve the
        relevant phrase as the value. For weekday references, type "day"
        and use the weekday name as the value.
      - Do not use the new title, date, time, or location being requested
        as the identifier unless it also clearly identifies the existing
        appointment.
      - title: Extract the new title only if the user requests a title change.
      - date: Extract the new date only if the user requests a date change,
        formatted as YYYY-MM-DD when clear.
      - time: Extract the new time only if the user requests a time change,
        formatted as HH:mm in 24-hour format.
      - location: Extract the new location only if the user requests a
        location change.
      - note: Extract additional update details stated by the user.
      - Current date: ${currentDate}. Resolve relative dates when possible.
      - Use null for missing or uncertain fields.
      - Never invent appointment details.
      - If the existing appointment cannot be identified clearly, include
        "appointment_identifier" in missing_fields and set
        needs_clarification to true.
      - Return valid JSON only, without Markdown or explanations.
`;
  };

  /**
   *
   * @returns String
   */
  getAppointmentExtractionPrompt = () => {
    const currentDate = new Date().toISOString().slice(0, 10);

    return `
  You are a structured data extraction engine for BabyNest.

  Extract appointment details from the user's query.
  Do not answer conversationally. Do not execute any action.
  Return only a valid JSON object with exactly these keys:

  {
    "title": string or null,
    "date": string or null,
    "time": string or null,
    "location": string or null
  }

  Required fields: title, date, time, location.

  Rules:
  - Extract only explicitly stated or clearly implied information.
  - Never invent missing values. Use null when unknown.
  - Resolve relative dates using the current date: ${currentDate}.
  - Format dates as YYYY-MM-DD.
  - Format times as HH:mm in 24-hour format.
  - Extract a concise, meaningful appointment title.
  - Return only JSON, without Markdown or explanations.
  `;
  };

  /**
   *
   * @returns String
   */
  getWeightExtractionPrompt = () => {
    return `
  You are a structured data extraction engine for BabyNest.

  Extract weight logging details from the user's message.
  Do not answer conversationally or execute any action.

  Return only a valid JSON object with exactly these keys:

  {
    "weight": number or null,
    "week_number": number or null,
    "note": string or null
  }

  Rules:
  - Extract weight as a numeric value in kilograms.
  - Convert grams to kilograms when the unit is explicitly provided.
  - Extract the pregnancy week number only if stated or clearly
    established by the conversation.
  - Do not confuse the pregnancy week with the number of weeks
    since a previous weight measurement.
  - Extract any additional relevant note provided by the user.
  - Use null for missing or uncertain values.
  - Never invent measurements or pregnancy details.
  - Return valid JSON only, without Markdown or explanations.
  `;
  };

  /**
   *
   * @returns String
   */
  getSymptomsExtractionPrompt = () => {
    return `
  You are a structured data extraction engine for BabyNest.

  Extract symptom details from the user's query.
  Do not answer conversationally or execute any action.

  Return only a valid JSON object in this exact structure:

  {
    "intent": "log_symptoms",
    "data": {
      "symptom": null,
      "week_number": null,
      "note": null
    },
    "missing_fields": [],
    "needs_clarification": false
  }

  Rules:
  - symptom: Extract the symptom explicitly reported by the user.
  - week_number: Extract the pregnancy week as a number only when
    explicitly stated or clearly established by the provided context.
  - note: Extract additional relevant details, such as severity,
    duration, frequency, or associated symptoms.
  - Use null for missing or uncertain values.
  - Never invent symptoms, pregnancy weeks, or medical details.
  - Do not infer a medical diagnosis.
  - If the symptom itself is missing or ambiguous, add "symptom"
    to missing_fields and set needs_clarification to true.
  - Return valid JSON only, without Markdown or explanations.
  `;
  };

  /**
   *
   * @returns String
   */
  getBloodPressureExtractionPrompt = () => {
    return `
  You are a structured data extraction engine for BabyNest.

  Extract blood pressure logging details from the user's query.
  Do not answer conversationally or execute any action.

  Return only a valid JSON object in this exact structure:

  {
    "intent": "log_blood_pressure",
    "data": {
      "systolic": null,
      "diastolic": null,
      "time": null,
      "week_number": null,
      "note": null
    },
    "missing_fields": [],
    "needs_clarification": false
  }

  Rules:
  - systolic: Extract the systolic blood pressure as a number.
  - diastolic: Extract the diastolic blood pressure as a number.
  - Interpret readings such as "120 over 80" as systolic 120
    and diastolic 80.
  - time: Extract the measurement time in HH:mm 24-hour format.
  - week_number: Extract the pregnancy week as a number only
    when explicitly stated or clearly established by context.
  - note: Extract additional relevant details stated by the user.
  - Use null for missing or uncertain values.
  - Never invent readings, times, or pregnancy weeks.
  - Do not diagnose a medical condition from a blood pressure reading.
  - If either blood pressure value is missing or ambiguous, add
    the corresponding field name to missing_fields and set
    needs_clarification to true.
  - Return valid JSON only, without Markdown or explanations.
  `;
  };

  /**
   *
   * @returns String
   */
  getMedicineExtractionPrompt = () => {
    return `
  You are a structured data extraction engine for BabyNest.

  Extract medicine logging details from the user's query.
  Do not answer conversationally or execute any action.

  Return only a valid JSON object in this exact structure:

  {
    "intent": "log_medicine",
    "data": {
      "name": null,
      "dose": null,
      "time": null,
      "week_number": null,
      "note": null
    },
    "missing_fields": [],
    "needs_clarification": false
  }

  Rules:
  - name: Extract the medicine name exactly as stated by the user.
  - dose: Extract the stated dosage, including its unit
    (e.g., "500 mg", "1 tablet", "5 ml").
  - time: Extract the medicine-taking time in HH:mm 24-hour format.
    Convert times such as "9 AM" to "09:00" and "8 PM" to "20:00".
  - week_number: Extract the pregnancy week as a number only when
    explicitly stated or clearly established by context.
  - note: Extract additional relevant details stated by the user,
    such as frequency, instructions, or reason for taking the medicine.
    Do not duplicate the medicine name or dose in the note.
  - Use null for missing or uncertain values.
  - Never invent medicine names, doses, times, or pregnancy weeks.
  - Do not recommend medicines or change the user's stated dosage.
  - If the medicine name is missing or ambiguous, add "name" to
    missing_fields and set needs_clarification to true.
  - If the dose is missing, leave it null; do not invent a dose.
  - Return valid JSON only, without Markdown or explanations.
  `;
  };

  /**
   *
   * @returns String
   */
  getDischargeExtractionPrompt = () => {
    return `
  You are a structured data extraction engine for BabyNest.

  Extract vaginal discharge logging details from the user's query.
  Do not answer conversationally, diagnose, or execute any action.

  Return only a valid JSON object in this exact structure:

  {
    "intent": "log_discharge",
    "data": {
      "type": null,
      "color": null,
      "bleeding": null,
      "week_number": null,
      "note": null
    },
    "missing_fields": [],
    "needs_clarification": false
  }

  Rules:
  - type: Extract the discharge type as stated by the user, such as
    watery, mucus-like, thick, sticky, or unusual.
  - color: Extract the stated color, such as clear, white, yellow,
    pink, brown, or red. Do not infer a color.
  - bleeding: Extract whether bleeding is reported.
    Use true if bleeding is explicitly reported, false if explicitly
    denied, and null if not mentioned or uncertain.
  - week_number: Extract the pregnancy week as a number only when
    explicitly stated or clearly established by context.
  - note: Extract other relevant details, such as amount, consistency,
    odor, duration, or associated symptoms. Do not repeat information
    already captured in other fields.
  - Use null for missing or uncertain values.
  - Never invent symptoms or infer details the user did not provide.
  - If the discharge type is missing or ambiguous, add "type" to
    missing_fields and set needs_clarification to true.
  - Do not diagnose a medical condition.
  - Return valid JSON only, without Markdown or explanations.
  `;
  };

  /**
   *
   * @returns String
   */
  getTaskExtractionPrompt = () => {
    return `
You are a structured data extraction engine for BabyNest.

Extract task creation details from the user's query.
Do not answer conversationally or execute any action.

Return only a valid JSON object in this exact structure:

{
  "intent": "create_task",
  "data": {
    "title": null,
    "week": null,
    "priority": null,
    "note": null
  },
  "missing_fields": [],
  "needs_clarification": false
}

Rules:
- title: Extract a short, clear task title describing what the user
  wants to do. Do not invent a task that the user did not request.
- week: Extract the pregnancy week as a number only when explicitly
  stated or clearly established by context. Otherwise, use null.
- priority: Extract the priority if stated. Allowed values are
  "low", "medium", and "high".
  Map "urgent", "very important", or "as soon as possible" to "high".
  Map "not urgent" or "low priority" to "low".
  Use "medium" only when explicitly stated. Otherwise, use null.
- note: Extract additional task details, instructions, or context
  that are not already captured in the title, week, or priority.
  Use null if no additional details are provided.
- Use null for missing or uncertain values.
- Never invent a week number or priority.
- If the task title is missing or ambiguous, add "title" to
  missing_fields and set needs_clarification to true.
- Return valid JSON only, without Markdown or explanations.
`;
  };

  /**
   * Extract screen name from query
   */
  extractScreenName(query) {
    const screens = {
      Home: ['home', 'main', 'dashboard'],
      Weight: ['weight', 'weigh', 'weight screen', 'weight tracking'],
      Symptoms: ['symptoms', 'symptom', 'symptom screen'],
      Medicine: ['medicine', 'medication', 'med', 'medicine screen'],
      Calendar: ['appointments', 'appointment', 'calendar', 'schedule'],
      BloodPressure: [
        'blood pressure',
        'bp',
        'pressure',
        'blood pressure screen',
      ],
      Discharge: ['discharge', 'discharge log', 'bleeding', 'spotting'],
      Timeline: ['timeline', 'history', 'timeline screen'],
      Profile: ['settings', 'profile', 'profile screen'],
      AllTasks: ['tasks', 'reminders', 'todo', 'task screen', 'all tasks'],
    };

    for (const [screen, keywords] of Object.entries(screens)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          return screen;
        }
      }
    }
    return null;
  }

  /**
   *
   * @returns String
   */
  getProfileExtractionPrompt = () => {
    return `
You are a structured data extraction engine for BabyNest.

Extract profile field values from the user's query.

Return only a valid JSON object in this exact structure:

{
  "intent": "update_profile",
  "data": {
    "age": null,
    "location": null,
    "due_date": null,
    "name": null,
    "lmp": null,
    "periodLength": null
  },
  "missing_fields": [],
  "needs_clarification": false
}

Rules:
- Extract only the profile fields explicitly requested or provided by the user.
- age: Extract age as a number.
- location: Extract the location as a string.
- due_date: Extract the due date in YYYY-MM-DD format when clear.
- lmp: Extract the last menstrual period date in YYYY-MM-DD format when clear.
- periodLength: Extract menstrual cycle length in days as a number.
- Set fields not mentioned in the query to null.
- Never invent or guess values.
- Return valid JSON only, without Markdown or explanations.
`;
  };

  /**
   *
   * @returns String
   */
  getDataExtractionPrompt = () => {
    const currentDate = new Date().toISOString().slice(0, 10);

    return `
You are a structured data extraction engine for BabyNest.

Extract the data type and optional filters from the user's query.

Return only a valid JSON object in this exact structure:

{
  "intent": "get_data",
  "data": {
    "type": null,
    "week": null,
    "date": null
  },
  "missing_fields": [],
  "needs_clarification": false
}

Rules:
- type: Must be one of these exact values:
  "blood_pressure", "appointments", "weight", "symptoms",
  "medicine", "discharge", "tasks".
- Map user requests about blood pressure or BP readings to "blood_pressure".
- Map appointment schedules or visits to "appointments".
- Map weight records to "weight".
- Map symptoms or symptom records to "symptoms".
- Map medicines or medication records to "medicine".
- Map vaginal discharge records to "discharge".
- Map tasks or to-do lists to "tasks".
- week: Extract the pregnancy week as a number if stated; otherwise null.
- date: Extract the requested date in YYYY-MM-DD format if clear.
  Current date: ${currentDate}.
  Resolve relative dates such as "today" or "yesterday" using this date.
- Use null for filters the user did not specify.
- Never invent values.
- If the requested data type is missing or ambiguous, add "type"
  to missing_fields and set needs_clarification to true.
- Return valid JSON only, without Markdown or explanations.
`;
  };

  /**
   * Check for missing required fields
   */
  checkMissingFields(data, intent) {
    console.log('🔍 DEBUG: Checking missing fields for intent:', intent.name);
    console.log('🔍 DEBUG: Required fields:', intent.requiredFields);
    console.log('🔍 DEBUG: Data to check:', data);

    const missing = [];
    for (const field of intent.requiredFields || []) {
      const value = data[field];

      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '')
      ) {
        missing.push(field);
      }
    }
    console.log('🔍 DEBUG: Missing fields:', missing);
    return missing;
  }

  /**
   * Generate follow-up questions for missing information
   */
  async generateFollowUpQuestions(intent, missingFields, partialData) {
    let message = `I'd be happy to help you with that! I need a few more details:\n\n`;

    const fieldQuestions = {
      title: `• **What type of ${intent.name}** would you like to schedule? (e.g., "ultrasound", "checkup")`,
      date: '• **What date** would you prefer? (e.g., "tomorrow", "next week", "October 14")',
      time: '• **What time** works for you? (e.g., "2pm", "morning")',
      location: '• **Where** should this be? (e.g., "City Hospital", "delhi")',
      weight: '• **What\'s your weight**? (e.g., "65kg", "140 pounds")',
      week: '• **Which week** should this be recorded for? (e.g., "week 12", "current week")',
      symptom:
        '• **What symptoms** are you experiencing? (e.g., "nausea", "headache")',
      systolic: '• **What\'s your systolic pressure**? (e.g., "120")',
      diastolic: '• **What\'s your diastolic pressure**? (e.g., "80")',
      name: '• **What medicine** did you take? (e.g., "paracetamol", "iron")',
      dose: '• **What dose** did you take? (e.g., "500mg", "2 tablets")',
      type: '• **What type of discharge**? (e.g., "normal", "spotting")',
      color: '• **What color** is it? (e.g., "clear", "white", "pink")',
      screen:
        '• **Which screen** would you like to go to? (e.g., "weight", "appointments")',
      field: '• **What would you like to update**? (e.g., "name", "due date")',
      value: '• **What\'s the new value**? (e.g., "Shreya", "June 24, 2026")',
      mood: '• **How are you feeling**? (e.g., "happy", "anxious", "calm", "tired")',
      intensity:
        '• **How intense is this feeling**? (e.g., "low", "medium", "high")',
      duration: '• **How long did you sleep**? (e.g., "8 hours", "7.5 hours")',
      bedtime: '• **What time did you go to bed**? (e.g., "10pm", "22:00")',
      wake_time: '• **What time did you wake up**? (e.g., "6am", "06:00")',
      quality:
        '• **How was your sleep quality**? (e.g., "excellent", "good", "fair", "poor")',
      metric:
        '• **What would you like to analyze**? (e.g., "weight", "sleep", "mood")',
      timeframe:
        '• **What timeframe**? (e.g., "this week", "last month", "all time")',
      chart_type: '• **What type of chart**? (e.g., "line", "bar", "summary")',
      action_type:
        '• **What type of action** to undo? (e.g., "weight", "appointment", "last")',

      // Medicine fields (for both logging and CRUD)
      name: '• **What medicine** did you take? (e.g., "paracetamol", "iron tablets")',
      frequency:
        '• **How often** do you take this medicine? (e.g., "twice daily", "as needed")',
      start_date:
        '• **When did you start** taking this medicine? (e.g., "today", "last week")',
      end_date:
        '• **When do you stop** taking this medicine? (e.g., "next week", "when symptoms stop")',

      // Blood Pressure CRUD fields
      pressure_reading:
        '• **What\'s your blood pressure reading**? (e.g., "120/80", "systolic 120 diastolic 80")',

      // Discharge CRUD fields
      discharge_type:
        '• **What type of discharge**? (e.g., "normal", "spotting", "bleeding")',

      // Common CRUD fields
      note: '• **Any additional notes**? (optional)',
      update_date:
        '• **Which date** would you like to update/delete? (e.g., "today", "yesterday", "December 19")',
      update_time: '• **What time**? (e.g., "morning", "2pm", "evening")',
    };

    for (const field of missingFields) {
      if (fieldQuestions[field]) {
        message += fieldQuestions[field] + '\n';
      }
    }

    // Add contextual tip based on intent
    const contextualTips = {
      create_appointment:
        '**Tip**: You can provide all details at once! For example: "make appointment for ultrasound tomorrow at 2pm at City Hospital"',
      log_weight:
        '**Tip**: You can provide all details at once! For example: "log weight 65kg for week 12 with note feeling good"',
      log_symptoms:
        '**Tip**: You can provide all details at once! For example: "log symptom nausea this morning with note mild discomfort"',
      log_blood_pressure:
        '**Tip**: You can provide all details at once! For example: "log blood pressure 120/80 this morning with note feeling normal"',
      query_analytics:
        '**Tip**: You can provide all details at once! For example: "show weight analytics for this month as line chart"',
      log_medicine:
        '**Tip**: You can provide all details at once! For example: "log medicine paracetamol 500mg twice daily starting today"',
      log_discharge:
        '**Tip**: You can provide all details at once! For example: "log discharge normal this morning with note light flow"',
      create_task:
        '**Tip**: You can provide all details at once! For example: "create task buy vitamins for next week with note urgent"',
      update_appointment:
        '**Tip**: You can provide all details at once! For example: "update appointment tomorrow change time to 3pm"',
      delete_appointment:
        '**Tip**: Use appointment screen to delete the appointment."',
      update_medicine:
        '**Tip**: You can provide all details at once! For example: "update paracetamol change dose to 1000mg twice daily"',
      delete_medicine:
        '**Tip**: You can provide all details at once! For example: "delete paracetamol from yesterday"',
      update_blood_pressure:
        '**Tip**: You can provide all details at once! For example: "update blood pressure change reading to 110/70"',
      delete_blood_pressure:
        '**Tip**: You can provide all details at once! For example: "delete blood pressure from this morning"',
      update_discharge:
        '**Tip**: You can provide all details at once! For example: "update discharge change to spotting this morning"',
      delete_discharge:
        '**Tip**: You can provide all details at once! For example: "delete discharge from yesterday"',
      update_symptoms:
        '**Tip**: You can provide all details at once! For example: "update symptoms change nausea to mild headache"',
      delete_symptoms:
        '**Tip**: You can provide all details at once! For example: "delete symptoms from this morning"',
      update_weight:
        '**Tip**: You can provide all details at once! For example: "update weight change to 66kg for week 12"',
      delete_weight:
        '**Tip**: You can provide all details at once! For example: "delete weight from yesterday"',
      get_data:
        '**Tip**: You can provide all details at once! For example: "show my appointments for next week"',
      navigate:
        '**Tip**: You can provide all details at once! For example: "go to weight screen" or "navigate to appointments"',
    };

    const tip =
      contextualTips[intent.action] ||
      '**Tip**: You can provide all details at once! For example: "make appointment for ultrasound tomorrow at 2pm at City Hospital"';
    message += `\n${tip}`;

    return {
      success: true,
      message: message,
      requiresFollowUp: true,
      intent: intent,
      partialData: partialData,
      missingFields: missingFields,
    };
  }

  /**
   * Execute the determined action
   */
  async executeAction(intent, data, userContext) {
    try {
      switch (intent.action) {
        case 'queryAnalytics':
          return await this.buildAnalyticsData(data, userContext);
        case 'createAppointment':
          return await this.createAppointment(data, userContext);
        case 'logWeight':
          return await this.logWeight(data, userContext);
        case 'logSymptoms':
          return await this.logSymptoms(data, userContext);
        case 'logBloodPressure':
          return await this.logBloodPressure(data, userContext);
        case 'logMedicine':
          return await this.logMedicine(data, userContext);
        case 'logDischarge':
          return await this.logDischarge(data, userContext);
        case 'createTask':
          return await this.createTask(data, userContext);
        case 'navigate':
          return await this.navigate(data, userContext);
        case 'updateProfile':
          return await this.updateProfile(data, userContext);
        case 'getData':
          return await this.getData(data, userContext);
        case 'updateAppointment':
          return await this.updateAppointment(data, userContext);
        case 'deleteAppointment':
          return await this.deleteAppointment(data, userContext);
        case 'viewWeightLogs':
          return await this.viewWeightLogs(data, userContext);
        case 'viewMedicineLogs':
          return await this.viewMedicineLogs(data, userContext);
        case 'viewSymptomsLogs':
          return await this.viewSymptomsLogs(data, userContext);
        case 'viewBloodPressureLogs':
          return await this.viewBloodPressureLogs(data, userContext);
        case 'viewDischargeLogs':
          return await this.viewDischargeLogs(data, userContext);
        case 'emergency':
          return await this.triggerEmergency(data, userContext);
        case 'logout':
          return await this.logout(data, userContext);
        case 'generalChat':
          return await this.handleGeneralChat(data, userContext);

        // Medicine CRUD operations
        case 'updateMedicine':
          return await this.updateMedicine(data, userContext);
        case 'deleteMedicine':
          return await this.deleteMedicine(data, userContext);

        // Blood Pressure CRUD operations
        case 'updateBloodPressure':
          return await this.updateBloodPressure(data, userContext);
        case 'deleteBloodPressure':
          return await this.deleteBloodPressure(data, userContext);

        // Discharge CRUD operations
        case 'updateDischarge':
          return await this.updateDischarge(data, userContext);
        case 'deleteDischarge':
          return await this.deleteDischarge(data, userContext);

        // Symptoms CRUD operations
        case 'updateSymptoms':
          return await this.updateSymptoms(data, userContext);
        case 'deleteSymptoms':
          return await this.deleteSymptoms(data, userContext);

        // Weight CRUD operations
        case 'updateWeight':
          return await this.updateWeight(data, userContext);
        case 'deleteWeight':
          return await this.deleteWeight(data, userContext);

        default:
          return {
            success: false,
            message: `❌ I'm not sure how to help with that. Could you try rephrasing your request?`,
          };
      }
    } catch (error) {
      console.error('Action execution error:', error);
      return {
        success: false,
        message: `❌ Failed to execute action: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Convert natural language date to proper date format
   */
  convertToDate(dateString) {
    if (!dateString || dateString === 'TBD') {
      return new Date().toISOString().split('T')[0]; // Default to today
    }

    const today = new Date();
    const currentYear = today.getFullYear();

    // Handle "tomorrow"
    if (dateString.toLowerCase().includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yearStr = tomorrow.getFullYear();
      const monthStr = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dayStr = String(tomorrow.getDate()).padStart(2, '0');
      return `${yearStr}-${monthStr}-${dayStr}`;
    }

    // Handle "today"
    if (dateString.toLowerCase().includes('today')) {
      const yearStr = today.getFullYear();
      const monthStr = String(today.getMonth() + 1).padStart(2, '0');
      const dayStr = String(today.getDate()).padStart(2, '0');
      return `${yearStr}-${monthStr}-${dayStr}`;
    }

    // Handle "next week"
    if (dateString.toLowerCase().includes('next week')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const yearStr = nextWeek.getFullYear();
      const monthStr = String(nextWeek.getMonth() + 1).padStart(2, '0');
      const dayStr = String(nextWeek.getDate()).padStart(2, '0');
      return `${yearStr}-${monthStr}-${dayStr}`;
    }

    // Handle dates like "12 october" or "12 October 2025"
    const monthNames = [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ];

    const dateMatch = dateString.match(
      /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?/i,
    );

    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const monthName = dateMatch[2].toLowerCase();
      const year = dateMatch[3] ? parseInt(dateMatch[3]) : currentYear;
      const month = monthNames.indexOf(monthName);

      if (month !== -1) {
        const date = new Date(year, month, day); // month is already 0-indexed from indexOf
        // Use timezone-safe formatting to avoid day shifts
        const yearStr = date.getFullYear();
        const monthStr = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');
        return `${yearStr}-${monthStr}-${dayStr}`;
      }
    }

    // Handle day names (monday, tuesday, etc.)
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const dayIndex = dayNames.findIndex(day =>
      dateString.toLowerCase().includes(day),
    );

    if (dayIndex !== -1) {
      const targetDate = new Date(today);
      const currentDay = today.getDay();
      const daysUntilTarget = (dayIndex - currentDay + 7) % 7;
      targetDate.setDate(today.getDate() + daysUntilTarget);
      const yearStr = targetDate.getFullYear();
      const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(targetDate.getDate()).padStart(2, '0');
      return `${yearStr}-${monthStr}-${dayStr}`;
    }

    // If no pattern matches, return today's date
    const yearStr = today.getFullYear();
    const monthStr = String(today.getMonth() + 1).padStart(2, '0');
    const dayStr = String(today.getDate()).padStart(2, '0');
    return `${yearStr}-${monthStr}-${dayStr}`;
  }

  /**
   * Convert natural language time to proper time format
   */
  convertToTime(timeString) {
    if (!timeString || timeString === 'TBD') {
      return '09:00'; // Default to 9 AM
    }

    // Handle "morning", "afternoon", "evening"
    if (timeString.toLowerCase().includes('morning')) return '09:00';
    if (timeString.toLowerCase().includes('afternoon')) return '14:00';
    if (timeString.toLowerCase().includes('evening')) return '18:00';
    if (timeString.toLowerCase().includes('night')) return '20:00';

    // Handle time formats like "2pm", "2 pm", "14:00"
    const timeMatch = timeString.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);

    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3] ? timeMatch[3].toLowerCase() : '';

      // Convert to 24-hour format
      if (period === 'pm' && hours !== 12) {
        hours += 12;
      } else if (period === 'am' && hours === 12) {
        hours = 0;
      }

      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}`;
    }

    return '09:00'; // Default fallback
  }

  /**
   * Build analytics data based on user query
   * @param {*} data
   * @param {*} userContext
   */
  async buildAnalyticsData(data, userContext) {
    try {
      const metric = typeof data === 'string' ? data : data?.metric;

      const userId = Number(userContext?.user_id ?? userContext?.id);

      if (!Number.isInteger(userId) || userId <= 0) {
        return {
          success: false,
          message: 'Valid user ID is required',
        };
      }

      let result;

      switch (metric) {
        case 'appointment_metric':
          result = await this.getAppointmentAnalytics(userId, userContext);
          break;

        case 'task_metric':
          result = await this.getTaskAnalytics(userId);
          break;

        case 'blood_pressure_metric':
          result = await this.getBloodPressureAnalytics(userId);
          break;

        case 'discharge_metric':
          result = await this.getDischargeAnalytics(userId);
          break;

        case 'weight_metric':
          result = await this.getWeightAnalytics(userId);
          break;

        case 'medicine_metric':
          result = await this.getMedicineAnalytics(userId);
          break;

        case 'symptom_metric':
          result = await this.getSymptomAnalytics(userId);
          break;

        default:
          return {
            success: false,
            message: `Unsupported analytics metric: ${metric}`,
          };
      }

      return {
        success: true,
        metric,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to create Analytics: ${error.message}`,
      };
    }
  }

  // Helper: get rows from SQLite
  async getAnalyticsRows(sql, params) {
    const db = await openDB();
    const result = await db.execute(sql, params);
    return result.rows?._array ?? [];
  }

  // Helper: count records by pregnancy week
  groupCountByWeek(rows, getWeek) {
    const counts = new Map();

    for (const row of rows) {
      const week = Number(getWeek(row));

      if (!Number.isInteger(week) || week < 1) continue;

      counts.set(week, (counts.get(week) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort(([a], [b]) => a - b)
      .map(([week, log]) => ({week, log}));
  }

  // 1. APPOINTMENTS
  async getAppointmentAnalytics(userId, userContext) {
    const rows = await this.getAnalyticsRows(
      `SELECT appointment_date, appointment_status
      FROM appointments
      WHERE user_id = ?
      ORDER BY appointment_date`,
      [userId],
    );

    // Appointment table has no week_number.
    // Derive pregnancy week from the user's LMP date.
    // Update this property if your context uses another name.
    let lmp = userContext?.context?.lmp ?? userContext?.profile?.lmp;

    if (!lmp) {
      return [];
    }

    const lmpTime = new Date(lmp).getTime();

    if (!Number.isFinite(lmpTime)) return [];

    return this.groupCountByWeek(
      rows.map(row => {
        const appointmentTime = new Date(row.appointment_date).getTime();

        return {
          ...row,
          pregnancyWeek:
            Math.floor(
              (appointmentTime - lmpTime) / (7 * 24 * 60 * 60 * 1000),
            ) + 1,
        };
      }),
      row => row.pregnancyWeek,
    );
  }

  // 2. TASKS
  async getTaskAnalytics(userId) {
    const rows = await this.getAnalyticsRows(
      `SELECT starting_week, ending_week
      FROM tasks
      WHERE user_id = ?`,
      [userId],
    );

    const counts = new Map();

    for (const task of rows) {
      const start = Number(task.starting_week);
      const end = Number(task.ending_week);

      if (!Number.isInteger(start) || start < 1) continue;

      // Count a task in every week it spans.
      // ending_week = 0 means it belongs to starting_week only.
      const finalWeek = end >= start ? end : start;

      for (let week = start; week <= finalWeek; week++) {
        counts.set(week, (counts.get(week) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort(([a], [b]) => a - b)
      .map(([week, log]) => ({week, log}));
  }

  // 3. BLOOD PRESSURE
  async getBloodPressureAnalytics(userId) {
    const rows = await this.getAnalyticsRows(
      `SELECT week_number, systolic, diastolic
      FROM blood_pressure_logs
      WHERE user_id = ?
      ORDER BY week_number`,
      [userId],
    );

    const grouped = new Map();

    for (const row of rows) {
      const week = Number(row.week_number);

      if (!Number.isInteger(week) || week < 1) continue;

      if (!grouped.has(week)) {
        grouped.set(week, {
          systolicTotal: 0,
          diastolicTotal: 0,
          count: 0,
        });
      }

      const group = grouped.get(week);
      group.systolicTotal += Number(row.systolic);
      group.diastolicTotal += Number(row.diastolic);
      group.count++;
    }

    return [...grouped.entries()]
      .sort(([a], [b]) => a - b)
      .map(([week, group]) => ({
        week,
        // Main graph value
        log: Number((group.systolicTotal / group.count).toFixed(1)),
        // Optional second graph line
        systolic: Number((group.systolicTotal / group.count).toFixed(1)),
        diastolic: Number((group.diastolicTotal / group.count).toFixed(1)),
      }));
  }

  // 4. DISCHARGE
  async getDischargeAnalytics(userId) {
    const rows = await this.getAnalyticsRows(
      `SELECT week_number
      FROM discharge_logs
      WHERE user_id = ?`,
      [userId],
    );

    return this.groupCountByWeek(rows, row => row.week_number);
  }

  // 5. WEIGHT
  async getWeightAnalytics(userId) {
    const rows = await this.getAnalyticsRows(
      `SELECT week_number, weight
      FROM weekly_weight
      WHERE user_id = ?
      ORDER BY week_number`,
      [userId],
    );

    const grouped = new Map();

    for (const row of rows) {
      const week = Number(row.week_number);
      const weight = Number(row.weight);

      if (!Number.isInteger(week) || week < 1 || !Number.isFinite(weight))
        continue;

      if (!grouped.has(week)) {
        grouped.set(week, {total: 0, count: 0});
      }

      const group = grouped.get(week);
      group.total += weight;
      group.count++;
    }

    return [...grouped.entries()]
      .sort(([a], [b]) => a - b)
      .map(([week, group]) => ({
        week,
        log: Number((group.total / group.count).toFixed(2)),
      }));
  }

  // 6. MEDICINE
  async getMedicineAnalytics(userId) {
    const rows = await this.getAnalyticsRows(
      `SELECT week_number
      FROM weekly_medicine
      WHERE user_id = ? AND taken = 1`,
      [userId],
    );

    return this.groupCountByWeek(rows, row => row.week_number);
  }

  // 7. SYMPTOMS
  async getSymptomAnalytics(userId) {
    const rows = await this.getAnalyticsRows(
      `SELECT week_number
      FROM weekly_symptoms
      WHERE user_id = ?`,
      [userId],
    );

    return this.groupCountByWeek(rows, row => row.week_number);
  }

  /**
   * Create appointment
   */
  async createAppointment(data, userContext) {
    try {
      // Convert natural language dates and times to proper formats
      const properDate = this.convertToDate(data.date);
      const properTime = this.convertToTime(data.time);

      console.log('📅 Converting appointment data:');
      console.log('Original date:', data.date, '→ Proper date:', properDate);
      console.log('Original time:', data.time, '→ Proper time:', properTime);

      const user_id = await AsyncStorage.getItem('user_id');
      const add_appointment_res = await addAppointment({
        title: data.title || 'Appointment',
        content: `Appointment scheduled via chat`,
        appointment_date: properDate,
        appointment_time: properTime,
        appointment_location: data.location || 'TBD',
        user_id,
      });

      if (!add_appointment_res.success) {
        throw new Error(add_appointment_res.error.message);
      }

      const add_appointment_data = add_appointment_res.data;
      if (add_appointment_res.success) {
        return {
          success: true,
          message: `📅 Appointment "${
            add_appointment_data.title || 'Appointment'
          }" scheduled for ${add_appointment_data.date || 'TBD'} at ${
            add_appointment_data.time || 'TBD'
          }${
            add_appointment_data.location
              ? ` at ${add_appointment_data.location}`
              : ''
          }`,
          action: 'navigate',
          screen: 'Calendar',
        };
      } else {
        throw new Error('Failed to create appointment');
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to create appointment: ${error.message}`,
      };
    }
  }

  /**
   * Log weight
   */
  async logWeight(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const addWeight_res = await addWeight(user_id, {
        weight: data.weight,
        week_number: data.week_number || userContext.current_week || 12,
        note: data.note || '',
      });

      if (addWeight_res.success) {
        return {
          success: true,
          message: `⚖️ Weight ${data.weight}kg logged for week ${
            data.week_number || userContext.current_week || 12
          }${data.note ? ` (Note: ${data.note})` : ''}`,
          action: 'navigate',
          screen: 'Weight',
        };
      } else {
        throw new Error(addWeight_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to log weight: ${error.message}`,
      };
    }
  }

  /**
   * Log symptoms
   */
  async logSymptoms(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const addSymptom_res = await addSymptom(user_id, {
        symptom: data.symptom,
        week_number: data.week_number || userContext.current_week || 12,
        note: data.note || '',
      });

      if (addSymptom_res.success) {
        return {
          success: true,
          message: `🩺 Symptom "${data.symptom}" logged for week ${
            data.week_number || userContext.current_week || 12
          }${data.note ? ` (Note: ${data.note})` : ''}`,
          action: 'navigate',
          screen: 'Symptoms',
        };
      } else {
        throw new Error(addSymptom_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to log symptoms: ${error.message}`,
      };
    }
  }

  /**
   * Log blood pressure
   */
  async logBloodPressure(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const addBPLog_response = await addBPLog(user_id, {
        systolic: data.systolic,
        diastolic: data.diastolic,
        week_number: data.week_number || userContext.current_week || 12,
        time: data.time || new Date().toLocaleTimeString(),
        note: data.note || '',
      });

      if (addBPLog_response.success) {
        return {
          success: true,
          message: `🩸 Blood pressure ${data.systolic}/${
            data.diastolic
          } logged for week ${
            data.week_number || userContext.current_week || 12
          }${data.note ? ` (Note: ${data.note})` : ''}`,
          action: 'navigate',
          screen: 'BloodPressure',
        };
      } else {
        throw new Error(
          addBPLog_response.error.message || 'Failed to log blood pressure',
        );
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to log blood pressure: ${error.message}`,
      };
    }
  }

  /**
   * Log medicine
   */
  async logMedicine(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const addMedicine_res = await addMedicine(user_id, {
        name: data.name,
        dose: data.dose || '',
        time: data.time || '',
        week_number: data.week_number || userContext.current_week || 12,
        note: data.note || '',
      });
      if (!addMedicine_res.success) {
      }
      if (addMedicine_res.success) {
        return {
          success: true,
          message: `💊 Medicine "${data.name}"${
            data.dose ? ` (${data.dose})` : ''
          } logged for week ${
            data.week_number || userContext.current_week || 12
          }${data.time ? ` at ${data.time}` : ''}${
            data.note ? ` (Note: ${data.note})` : ''
          }`,
          action: 'navigate',
          screen: 'Medicine',
        };
      } else {
        throw new Error(addMedicine_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to log medicine: ${error.message}`,
      };
    }
  }

  /**
   * Log discharge
   */
  async logDischarge(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const addDischargeLog_res = await addDischargeLog(user_id, {
        type: data.type,
        color: data.color,
        bleeding: data.bleeding || 'no',
        week_number: data.week_number || userContext.current_week || 12,
        note: data.note || '',
      });

      if (addDischargeLog_res.success) {
        return {
          success: true,
          message: `🩸 Discharge log recorded for week ${
            data.week_number || userContext.current_week || 12
          }: ${data.type}, ${data.color}${
            data.note ? ` (Note: ${data.note})` : ''
          }`,
          action: 'navigate',
          screen: 'Discharge',
        };
      } else {
        throw new Error(addDischargeLog_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to log discharge: ${error.message}`,
      };
    }
  }

  /**
   * Create task
   */
  async createTask(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const addTask_res = await addTask(user_id, {
        title: data.title,
        starting_week: data.week || userContext.current_week || 12,
        ending_week: data.week || userContext.current_week || 12,
        task_priority: data.priority || 'medium',
        task_status: 'pending',
        is_optional: false,
        content: data.note || '',
      });

      if (addTask_res.success) {
        return {
          success: true,
          message: `✅ Task "${data.title}" created for week ${
            data.week || userContext.current_week || 12
          } with ${data.priority || 'medium'} priority`,
          action: 'navigate',
          screen: 'AllTasks',
        };
      } else {
        throw new Error(addTask_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to create task: ${error.message}`,
      };
    }
  }

  /**
   * Navigate to screen
   */
  async navigate(data, userContext) {
    const screenNames = {
      home: 'Home',
      weight: 'Weight',
      symptoms: 'Symptoms',
      medicine: 'Medicine',
      appointments: 'Calendar',
      calendar: 'Calendar',
      blood_pressure: 'BloodPressure',
      discharge: 'Discharge',
      timeline: 'Timeline',
      settings: 'Profile',
      tasks: 'AllTasks',
    };

    const screenDisplayName = screenNames[data.screen] || data.screen;
    const actualScreenName = screenNames[data.screen] || data.screen;

    return {
      success: true,
      message: `🚀 Navigating to ${screenDisplayName}...`,
      action: 'navigate',
      screen: actualScreenName,
    };
  }

  /**
   * Update profile
   */
  async updateProfile(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const updated_data_res = await updateProfile(user_id, data);

      if (updated_data_res.success) {
        return {
          success: true,
          message: `👤 ${Object.values(data).map(
            value => `${value} `,
          )} updated successfully!`,
          action: 'navigate',
          screen: 'Profile',
        };
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to update profile: ${error.message}`,
      };
    }
  }

  /**
   * Get data
   */
  async getData(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      let endpoint = '';
      switch (data.type) {
        case 'appointments':
          endpoint = getAppointments;
          break;
        case 'weight':
          endpoint = getAllWeights;
          break;
        case 'symptoms':
          endpoint = getAllSymptoms;
          break;
        case 'medicine':
          endpoint = getAllMedicine;
          break;
        case 'blood_pressure':
          endpoint = getBPLogs;
          break;
        case 'discharge':
          endpoint = getDischargeLogs;
          break;
        case 'tasks':
          endpoint = getTasks;
          break;
        default:
          throw new Error('Unknown data type');
      }

      const response = await endpoint(user_id);
      if (response.success) {
        const result = response.data;

        // Format the data for display
        let formattedMessage = '';
        switch (data.type) {
          case 'appointments':
            if (result.length === 0) {
              formattedMessage =
                '📅 You have no upcoming appointments scheduled.';
            } else {
              formattedMessage = '📅 **Your Upcoming Appointments:**\n\n';
              result.forEach((apt, index) => {
                formattedMessage += `${index + 1}. **${apt.title}** (ID: ${
                  apt.id
                })\n`;
                formattedMessage += `   📅 Date: ${apt.appointment_date}\n`;
                formattedMessage += `   ⏰ Time: ${apt.appointment_time}\n`;
                formattedMessage += `   📍 Location: ${apt.appointment_location}\n`;
                formattedMessage += `   📝 Status: ${apt.appointment_status}\n\n`;
              });
            }
            break;
          case 'weight':
            formattedMessage = `⚖️ **Weight History:**\n\n${JSON.stringify(
              result,
              null,
              2,
            )}`;
            break;
          case 'symptoms':
            formattedMessage = `🤒 **Symptom Log:**\n\n${JSON.stringify(
              result,
              null,
              2,
            )}`;
            break;
          case 'medicine':
            formattedMessage = `💊 **Medicine Log:**\n\n${JSON.stringify(
              result,
              null,
              2,
            )}`;
            break;
          case 'blood_pressure':
            formattedMessage = `🩺 **Blood Pressure Log:**\n\n${JSON.stringify(
              result,
              null,
              2,
            )}`;
            break;
          case 'discharge':
            formattedMessage = `🩸 **Discharge Log:**\n\n${JSON.stringify(
              result,
              null,
              2,
            )}`;
            break;
          case 'tasks':
            formattedMessage = `✅ **Tasks:**\n\n${JSON.stringify(
              result,
              null,
              2,
            )}`;
            break;
          default:
            formattedMessage = `📊 **${data.type} Data:**\n\n${JSON.stringify(
              result,
              null,
              2,
            )}`;
        }

        return {
          success: true,
          message: formattedMessage,
          data: result,
        };
      } else {
        throw new Error(appointments_response.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to fetch ${data.type} data: ${error.message}`,
      };
    }
  }

  /**
   * Update appointment
   */
  async updateAppointment(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');

      // First, get all appointments to find the one to update
      const appointments_response = await getAppointments(user_id);
      if (!appointments_response.success) {
        throw new Error(appointments_response.error.message);
      }

      const appointments = appointments_response.data;
      const matchingAppointments = this.findMatchingAppointments(
        appointments,
        data.appointment_identifier,
      );

      if (matchingAppointments.length === 0) {
        return {
          success: false,
          message: `❌ No appointments found matching your criteria.`,
        };
      }

      if (matchingAppointments.length > 1) {
        // Multiple matches - ask user to clarify
        let message = `🔍 I found ${matchingAppointments.length} appointments that match your request:\n\n`;
        matchingAppointments.forEach((apt, index) => {
          message += `${index + 1}. **${apt.title}** (ID: ${apt.id})\n`;
          message += `   📅 ${apt.appointment_date} at ${apt.appointment_time}\n`;
          message += `   📍 ${apt.appointment_location}\n\n`;
        });
        message += `Please specify which appointment you want to update by saying the number (1, 2, etc.) or provide more details.`;

        return {
          success: true,
          message: message,
          requiresFollowUp: true,
          intent: {action: 'updateAppointment'},
          partialData: data,
          missingFields: ['appointment_selection'],
          matchingAppointments: matchingAppointments,
        };
      }

      // Single match - proceed with update
      const appointmentToUpdate = matchingAppointments[0];
      const updateData = {
        title: data.title || appointmentToUpdate.title,
        appointment_date: data.date
          ? this.convertToDate(data.date)
          : appointmentToUpdate.appointment_date,
        appointment_time: data.time
          ? this.convertToTime(data.time)
          : appointmentToUpdate.appointment_time,
        appointment_location:
          data.location || appointmentToUpdate.appointment_location,
        content: data.note || appointmentToUpdate.content,
      };

      const update_appointment_res = await updateAppointment(
        appointmentToUpdate.id,
        updateData,
      );

      if (update_appointment_res.success) {
        return {
          success: true,
          message: `✅ Appointment "${updateData.title}" updated successfully!\n\n📅 Date: ${updateData.appointment_date}\n⏰ Time: ${updateData.appointment_time}\n📍 Location: ${updateData.appointment_location}`,
        };
      } else {
        throw new Error(update_appointment_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to update appointment: ${error.message}`,
      };
    }
  }

  /**
   * Delete appointment
   */
  async deleteAppointment(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');

      // First, get all appointments to find the one to delete
      const appointments_response = await getAppointments(user_id);
      if (!appointments_response.success) {
        throw new Error(appointments_response.error.message);
      }

      const appointments = appointments_response.data;
      const matchingAppointments = this.findMatchingAppointments(
        appointments,
        data.appointment_identifier,
      );

      if (matchingAppointments.length === 0) {
        return {
          success: false,
          message: `❌ No appointments found matching your criteria.`,
        };
      }

      if (matchingAppointments.length > 1) {
        // Multiple matches - ask user to clarify
        let message = `🔍 I found ${matchingAppointments.length} appointments that match your request:\n\n`;
        matchingAppointments.forEach((apt, index) => {
          message += `${index + 1}. **${apt.title}** (ID: ${apt.id})\n`;
          message += `   📅 ${apt.appointment_date} at ${apt.appointment_time}\n`;
          message += `   📍 ${apt.appointment_location}\n\n`;
        });
        message += `Please specify which appointment(s) you want to delete by saying:\n`;
        message += `• A number (1, 2, etc.) for a single appointment\n`;
        message += `• "all" to delete all matching appointments\n`;
        if (matchingAppointments.length === 2) {
          message += `• "both" to delete both appointments\n`;
        } else if (matchingAppointments.length > 2) {
          message += `• "first" or "last" to delete the first or last appointment\n`;
        }
        message += `• Or provide more specific details`;

        return {
          success: true,
          message: message,
          requiresFollowUp: true,
          intent: {action: 'deleteAppointment'},
          partialData: data,
          missingFields: ['appointment_selection'],
          matchingAppointments: matchingAppointments,
        };
      }

      // Single match - proceed with deletion
      const appointmentToDelete = matchingAppointments[0];

      const delete_appointment_res = await deleteAppointment(
        appointmentToDelete.id,
        user_id,
      );
      if (delete_appointment_res.success) {
        return {
          success: true,
          message: `✅ Appointment "${appointmentToDelete.title}" deleted successfully!`,
        };
      } else {
        const errorMessage = delete_appointment_res.error.message;
        throw new Error(errorMessage || 'Failed to delete appointment');
      }
    } catch (error) {
      console.error('Delete appointment error:', error);
      return {
        success: false,
        message: `❌ Failed to delete appointment: ${error.message}`,
      };
    }
  }

  /**
   * Find matching appointments based on identifier
   */
  findMatchingAppointments(appointments, identifier) {
    if (!identifier) return appointments;

    const matches = [];

    for (const appointment of appointments) {
      let isMatch = false;

      switch (identifier.type) {
        case 'title':
          isMatch =
            appointment.title &&
            appointment.title
              .toLowerCase()
              .includes(identifier.value.toLowerCase());
          break;
        case 'date':
          // Enhanced date matching to handle year-less dates
          isMatch = this.isDateMatch(
            appointment.appointment_date,
            identifier.value,
          );
          break;
        case 'time':
          isMatch =
            appointment.appointment_time ===
            this.convertToTime(identifier.value);
          break;
        case 'location':
          isMatch =
            appointment.appointment_location &&
            appointment.appointment_location
              .toLowerCase()
              .includes(identifier.value.toLowerCase());
          break;
        case 'day':
          const appointmentDate = new Date(appointment.appointment_date);
          const dayNames = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
          ];
          const appointmentDay = dayNames[appointmentDate.getDay()];
          isMatch = appointmentDay === identifier.value.toLowerCase();
          break;
        case 'relative':
          if (identifier.value === 'first') {
            isMatch = appointments.indexOf(appointment) === 0;
          } else if (identifier.value === 'last') {
            isMatch =
              appointments.indexOf(appointment) === appointments.length - 1;
          } else if (identifier.value === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            isMatch = appointment.appointment_date === tomorrowStr;
          } else if (identifier.value === 'today') {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            isMatch = appointment.appointment_date === todayStr;
          }
          break;
      }

      if (isMatch) {
        matches.push(appointment);
      }
    }

    return matches;
  }

  /**
   * Enhanced date matching to handle year-less dates
   */
  isDateMatch(appointmentDate, queryDate) {
    // First try exact match
    const convertedQueryDate = this.convertToDate(queryDate);
    if (appointmentDate === convertedQueryDate) {
      return true;
    }

    // If no exact match and query doesn't contain a year, try month-day matching
    if (!queryDate.match(/\d{4}/)) {
      const appointmentDateObj = new Date(appointmentDate);
      const appointmentMonth = appointmentDateObj.getMonth() + 1; // 0-indexed
      const appointmentDay = appointmentDateObj.getDate();

      // Try to extract month and day from query
      const monthNames = [
        'january',
        'february',
        'march',
        'april',
        'may',
        'june',
        'july',
        'august',
        'september',
        'october',
        'november',
        'december',
      ];

      const dateMatch = queryDate.match(
        /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      );

      if (dateMatch) {
        const queryDay = parseInt(dateMatch[1]);
        const queryMonthName = dateMatch[2].toLowerCase();
        const queryMonth = monthNames.indexOf(queryMonthName) + 1; // 0-indexed to 1-indexed

        return queryDay === appointmentDay && queryMonth === appointmentMonth;
      }
    }

    return false;
  }

  /**
   * Trigger emergency
   */
  async triggerEmergency(data, userContext) {
    return {
      success: true,
      message: `🚨 Emergency mode activated! Help is on the way.`,
      action: 'emergency',
      emergency: true,
    };
  }

  /**
   * Logout
   */
  async logout(data, userContext) {
    return {
      success: true,
      message: `👋 Logging out... Goodbye!`,
      action: 'logout',
    };
  }

  /**
   * Handle general chat
   */
  async handleGeneralChat(data, userContext) {
    try {
      const query = data?.message?.trim() || '';

      if (!query) {
        return {
          success: true,
          message:
            "I'm here to help with your pregnancy journey! What would you like to know?",
          action: 'generalChat',
          intent: 'general_chat',
        };
      }

      if (__DEV__) {
        console.log('🤖 Handling general chat with local AI...');
        console.log('Query:', query);
      }

      // Build a simple context-aware prompt for the local model
      const prompt = `
  You are BabyNest, a helpful pregnancy assistant.

  The user's request did not match any specific app intent, so respond naturally.

  User context:
  ${JSON.stringify(userContext || {}, null, 2)}

  User message:
  ${query}

  Instructions:
  - Answer the user's question naturally and clearly.
  - Use the provided user context when it is relevant.
  - Do not pretend that an app action was performed.
  - Do not invent medical information.
  - If the question is unrelated to pregnancy, you can still answer normally.
  - Keep the response concise and conversational.

  The tasks you can perform are:
    create_appointment
    log_weight
    log_symptoms
    log_blood_pressure
    log_medicine
    log_discharge
    create_task
    view_weight_logs
    view_medicine_logs
    view_symptoms_logs
    view_blood_pressure_logs
    view_discharge_logs
    navigate
    update_profile
    get_data
    update_appointment
    delete_appointment
    emergency
    logout
    update_medicine
    delete_medicine
    update_blood_pressure
    delete_blood_pressure
    update_discharge
    delete_discharge
    update_symptoms
    delete_symptoms
    update_weight
    delete_weight
  `;

      const response = await generateResponse([
        {
          role: 'user',
          content: prompt,
        },
      ]);

      return {
        success: true,
        message:
          response ||
          "I'm here to help with your pregnancy journey! How can I assist you today?",
        action: 'generalChat',
        intent: 'general_chat',
      };
    } catch (error) {
      console.error('❌ General chat failed:', error);

      return {
        success: true,
        message:
          "I'm here to help with your pregnancy journey! Could you try asking your question another way?",
        action: 'generalChat',
        intent: 'general_chat',
      };
    }
  }

  /**
   * View weight logs
   */
  async viewWeightLogs(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const getAllWeights_res = await getAllWeights(user_id);

      if (getAllWeights_res.success) {
        const logs = getAllWeights_res.data;

        // Filter by week if specified
        let filteredLogs = logs;
        if (data.week_number) {
          filteredLogs = logs.filter(
            log => log.week_number === data.week_number,
          );
        }

        // Limit results if specified
        if (data.limit) {
          filteredLogs = filteredLogs.slice(0, data.limit);
        }

        if (filteredLogs.length === 0) {
          return {
            success: true,
            message: `📊 **Weight Logs**\n\nNo weight entries found${
              data.week_number ? ` for week ${data.week_number}` : ''
            }.`,
          };
        }

        let message = `📊 **Weight Logs**\n\n`;

        // Add summary info
        message += `📈 **Total Entries:** ${filteredLogs.length}\n`;
        if (filteredLogs.length > 1) {
          const weights = filteredLogs.map(log => log.weight);
          const minWeight = Math.min(...weights);
          const maxWeight = Math.max(...weights);
          const avgWeight = (
            weights.reduce((a, b) => a + b, 0) / weights.length
          ).toFixed(1);
          message += `⚖️ **Range:** ${minWeight}kg - ${maxWeight}kg\n`;
          message += `📊 **Average:** ${avgWeight}kg\n\n`;
        }

        // Format individual entries
        filteredLogs.forEach((log, index) => {
          message += `**${index + 1}. Week ${log.week_number}**\n`;
          message += `   ⚖️ **Weight:** ${log.weight}kg\n`;
          if (log.note) message += `   📝 **Note:** ${log.note}\n`;
          if (log.created_at) {
            const date = new Date(log.created_at).toLocaleDateString();
            message += `   📅 **Date:** ${date}\n`;
          }
          message += `\n`;
        });

        return {
          success: true,
          message: message,
          data: filteredLogs,
        };
      } else {
        throw new Error(getAllWeights_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to get weight logs: ${error.message}`,
      };
    }
  }

  /**
   * View medicine logs
   */
  async viewMedicineLogs(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const getAllMedicine_res = await getAllMedicine(user_id);

      if (getAllMedicine_res.success) {
        const logs = getAllMedicine_res.data;

        // Filter by week if specified
        let filteredLogs = logs;
        if (data.week_number) {
          filteredLogs = logs.filter(
            log => log.week_number === data.week_number,
          );
        }

        // Limit results if specified
        if (data.limit) {
          filteredLogs = filteredLogs.slice(0, data.limit);
        }

        if (filteredLogs.length === 0) {
          return {
            success: true,
            message: `💊 **Medicine Logs**\n\nNo medicine entries found${
              data.week_number ? ` for week ${data.week_number}` : ''
            }.`,
          };
        }

        let message = `💊 **Medicine Logs**\n\n`;

        // Add summary info
        message += `📈 **Total Entries:** ${filteredLogs.length}\n`;
        const uniqueMedicines = [...new Set(filteredLogs.map(log => log.name))];
        if (uniqueMedicines.length > 1) {
          message += `💊 **Medicines:** ${uniqueMedicines.join(', ')}\n\n`;
        }

        // Format individual entries
        filteredLogs.forEach((log, index) => {
          message += `**${index + 1}. ${log.name}**\n`;
          message += `   💊 **Medicine:** ${log.name}\n`;
          message += `   📏 **Dose:** ${log.dose}\n`;
          message += `   ⏰ **Time:** ${log.time}\n`;
          message += `   📅 **Week:** ${log.week_number}\n`;
          if (log.note) message += `   📝 **Note:** ${log.note}\n`;
          if (log.created_at) {
            const date = new Date(log.created_at).toLocaleDateString();
            message += `   📅 **Date:** ${date}\n`;
          }
          message += `\n`;
        });

        return {
          success: true,
          message: message,
          data: filteredLogs,
        };
      } else {
        throw new Error(getAllMedicine_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to get medicine logs: ${error.message}`,
      };
    }
  }

  /**
   * View symptoms logs
   */
  async viewSymptomsLogs(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const getAllSymptoms_res = await getAllSymptoms(user_id);
      if (getAllSymptoms_res.success) {
        const logs = getAllSymptoms_res.data;

        // Filter by week if specified
        let filteredLogs = logs;
        if (data.week_number) {
          filteredLogs = logs.filter(
            log => log.week_number === data.week_number,
          );
        }

        // Limit results if specified
        if (data.limit) {
          filteredLogs = filteredLogs.slice(0, data.limit);
        }

        if (filteredLogs.length === 0) {
          return {
            success: true,
            message: `🤒 **Symptoms Logs**\n\nNo symptom entries found${
              data.week_number ? ` for week ${data.week_number}` : ''
            }.`,
          };
        }

        let message = `🤒 **Symptoms Logs**\n\n`;

        // Add summary info
        message += `📈 **Total Entries:** ${filteredLogs.length}\n`;
        const uniqueSymptoms = [
          ...new Set(filteredLogs.map(log => log.symptom)),
        ];
        if (uniqueSymptoms.length > 1) {
          message += `🤒 **Symptoms:** ${uniqueSymptoms.join(', ')}\n\n`;
        }

        // Format individual entries
        filteredLogs.forEach((log, index) => {
          message += `**${index + 1}. ${log.symptom}**\n`;
          message += `   🤒 **Symptom:** ${log.symptom}\n`;
          message += `   📅 **Week:** ${log.week_number}\n`;
          if (log.note) message += `   📝 **Note:** ${log.note}\n`;
          if (log.created_at) {
            const date = new Date(log.created_at).toLocaleDateString();
            message += `   📅 **Date:** ${date}\n`;
          }
          message += `\n`;
        });

        return {
          success: true,
          message: message,
          data: filteredLogs,
        };
      } else {
        throw new Error(getAllSymptoms_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to get symptoms logs: ${error.message}`,
      };
    }
  }

  /**
   * View blood pressure logs
   */
  async viewBloodPressureLogs(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const getBPLogs_response = await getBPLogs(user_id);
      if (getBPLogs_response.success) {
        const logs = getBPLogs_response.data;

        // Filter by week if specified
        let filteredLogs = logs;
        if (data.week_number) {
          filteredLogs = logs.filter(
            log => log.week_number === data.week_number,
          );
        }

        // Limit results if specified
        if (data.limit) {
          filteredLogs = filteredLogs.slice(0, data.limit);
        }

        if (filteredLogs.length === 0) {
          return {
            success: true,
            message: `🩸 **Blood Pressure Logs**\n\nNo BP entries found${
              data.week_number ? ` for week ${data.week_number}` : ''
            }.`,
          };
        }

        let message = `🩸 **Blood Pressure Logs**\n\n`;

        // Add summary info
        message += `📈 **Total Entries:** ${filteredLogs.length}\n`;
        if (filteredLogs.length > 1) {
          const readings = filteredLogs.map(log => ({
            systolic: log.systolic,
            diastolic: log.diastolic,
          }));
          const avgSystolic = (
            readings.reduce((a, b) => a + b.systolic, 0) / readings.length
          ).toFixed(0);
          const avgDiastolic = (
            readings.reduce((a, b) => a + b.diastolic, 0) / readings.length
          ).toFixed(0);
          message += `📊 **Average:** ${avgSystolic}/${avgDiastolic} mmHg\n\n`;
        }

        // Format individual entries
        filteredLogs.forEach((log, index) => {
          message += `**${index + 1}. ${log.systolic}/${
            log.diastolic
          } mmHg**\n`;
          message += `   🩸 **Reading:** ${log.systolic}/${log.diastolic} mmHg\n`;
          message += `   ⏰ **Time:** ${log.time}\n`;
          message += `   📅 **Week:** ${log.week_number}\n`;
          if (log.note) message += `   📝 **Note:** ${log.note}\n`;
          if (log.created_at) {
            const date = new Date(log.created_at).toLocaleDateString();
            message += `   📅 **Date:** ${date}\n`;
          }
          message += `\n`;
        });

        return {
          success: true,
          message: message,
          data: filteredLogs,
        };
      } else {
        throw new Error(
          getBPLogs_response.error.message ||
            'Failed to fetch blood pressure logs',
        );
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to get blood pressure logs: ${error.message}`,
      };
    }
  }

  /**
   * View discharge logs
   */
  async viewDischargeLogs(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const getDischargeLogs_res = await getDischargeLogs(user_id);

      if (getDischargeLogs_res.success) {
        const logs = getDischargeLogs_res.data;

        // Filter by week if specified
        let filteredLogs = logs;
        if (data.week_number) {
          filteredLogs = logs.filter(
            log => log.week_number === data.week_number,
          );
        }

        // Limit results if specified
        if (data.limit) {
          filteredLogs = filteredLogs.slice(0, data.limit);
        }

        if (filteredLogs.length === 0) {
          return {
            success: true,
            message: `🩸 **Discharge Logs**\n\nNo discharge entries found${
              data.week_number ? ` for week ${data.week_number}` : ''
            }.`,
          };
        }

        let message = `🩸 **Discharge Logs**\n\n`;

        // Add summary info
        message += `📈 **Total Entries:** ${filteredLogs.length}\n`;
        const uniqueTypes = [...new Set(filteredLogs.map(log => log.type))];
        if (uniqueTypes.length > 1) {
          message += `🩸 **Types:** ${uniqueTypes.join(', ')}\n\n`;
        }

        // Format individual entries
        filteredLogs.forEach((log, index) => {
          message += `**${index + 1}. ${log.type}**\n`;
          message += `   🩸 **Type:** ${log.type}\n`;
          message += `   🎨 **Color:** ${log.color}\n`;
          if (log.bleeding === 'yes') message += `   ⚠️ **Bleeding:** Yes\n`;
          message += `   📅 **Week:** ${log.week_number}\n`;
          if (log.note) message += `   📝 **Note:** ${log.note}\n`;
          if (log.created_at) {
            const date = new Date(log.created_at).toLocaleDateString();
            message += `   📅 **Date:** ${date}\n`;
          }
          message += `\n`;
        });

        return {
          success: true,
          message: message,
          data: filteredLogs,
        };
      } else {
        throw new Error(getDischargeLogs_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to get discharge logs: ${error.message}`,
      };
    }
  }

  // ==================== MEDICINE CRUD OPERATIONS ====================

  /**
   * Update medicine entry
   */
  async updateMedicine(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const updateMedicine_res = await updateMedicine(user_id, data.id, {
        medicine_name: data.medicine_name,
        dose: data.dose,
        frequency: data.frequency,
        start_date: data.start_date,
        end_date: data.end_date,
        note: data.note,
      });
      if (updateMedicine_res.success) {
        return {
          success: true,
          message: `✅ **Medicine Updated Successfully**\n\n📋 **${data.medicine_name}** has been updated with new information.`,
        };
      } else {
        throw new Error(updateMedicine_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to update medicine: ${error.message}`,
      };
    }
  }

  /**
   * Delete medicine entry
   */
  async deleteMedicine(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const deleteMedicine_res = await deleteMedicine(user_id, data.id);

      if (deleteMedicine_res.success) {
        return {
          success: true,
          message: `✅ **Medicine Deleted Successfully**\n\n🗑️ **${data.medicine_name}** entry has been removed from your records.`,
        };
      } else {
        throw new Error(deleteMedicine_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to delete medicine: ${error.message}`,
      };
    }
  }

  // ==================== BLOOD PRESSURE CRUD OPERATIONS ====================

  /**
   * Update blood pressure entry
   */
  async updateBloodPressure(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const updateBPLog_res = await updateBPLog(user_id, data.id, {
        systolic: data.systolic,
        diastolic: data.diastolic,
        date: data.date,
        time: data.time,
        note: data.note,
      });

      if (updateBPLog_res.success) {
        return {
          success: true,
          message: `✅ **Blood Pressure Updated Successfully**\n\n🩺 **${data.systolic}/${data.diastolic}** reading has been updated.`,
        };
      } else {
        throw new Error(updateBPLog_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to update blood pressure: ${error.message}`,
      };
    }
  }

  /**
   * Delete blood pressure entry
   */
  async deleteBloodPressure(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const deleteBPLog_res = await deleteBPLog(user_id, data.id);

      if (deleteBPLog_res.success) {
        return {
          success: true,
          message: `✅ **Blood Pressure Deleted Successfully**\n\n🗑️ Blood pressure reading for ${data.date} has been removed.`,
        };
      } else {
        throw new Error(deleteBPLog_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to delete blood pressure: ${error.message}`,
      };
    }
  }

  // ==================== DISCHARGE CRUD OPERATIONS ====================

  /**
   * Update discharge entry
   */
  async updateDischarge(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const updateDischargeLog_res = await updateDischargeLog(
        user_id,
        data.id,
        {
          discharge_type: data.discharge_type,
          date: data.date,
          time: data.time,
          note: data.note,
        },
      );

      if (updateDischargeLog_res.success) {
        return {
          success: true,
          message: `✅ **Discharge Updated Successfully**\n\n📋 **${data.discharge_type}** entry has been updated.`,
        };
      } else {
        throw new Error(updateDischargeLog_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to update discharge: ${error.message}`,
      };
    }
  }

  /**
   * Delete discharge entry
   */
  async deleteDischarge(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const deleteDischargeLog_res = await deleteDischargeLog(user_id, data.id);

      if (deleteDischargeLog_res.success) {
        return {
          success: true,
          message: `✅ **Discharge Deleted Successfully**\n\n🗑️ Discharge entry for ${data.date} has been removed.`,
        };
      } else {
        throw new Error(deleteDischargeLog_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to delete discharge: ${error.message}`,
      };
    }
  }

  // ==================== SYMPTOMS CRUD OPERATIONS ====================

  /**
   * Update symptoms entry
   */
  async updateSymptoms(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const updateSymptom_res = await updateSymptom(user_id, data.id, {
        symptom: data.symptom,
        date: data.date,
        time: data.time,
        note: data.note,
      });

      if (updateSymptom_res.success) {
        return {
          success: true,
          message: `✅ **Symptoms Updated Successfully**\n\n🤒 **${data.symptom}** entry has been updated.`,
        };
      } else {
        throw new Error(updateSymptom_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to update symptoms: ${error.message}`,
      };
    }
  }

  /**
   * Delete symptoms entry
   */
  async deleteSymptoms(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const deleteSymptom_res = await deleteSymptom(user_id, data.id);
      if (deleteSymptom_res.success) {
        return {
          success: true,
          message: `✅ **Symptoms Deleted Successfully**\n\n🗑️ Symptoms entry for ${data.date} has been removed.`,
        };
      } else {
        throw new Error(deleteSymptom_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to delete symptoms: ${error.message}`,
      };
    }
  }

  // ==================== WEIGHT CRUD OPERATIONS ====================

  /**
   * Update weight entry
   */
  async updateWeight(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const updateWeight_res = await updateWeight(user_id, data.id, {
        weight: data.weight,
        date: data.date,
        week: data.week,
        note: data.note,
      });

      if (updateWeight_res.success) {
        return {
          success: true,
          message: `✅ **Weight Updated Successfully**\n\n⚖️ **${data.weight}kg** entry has been updated.`,
        };
      } else {
        throw new Error(updateWeight_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to update weight: ${error.message}`,
      };
    }
  }

  /**
   * Delete weight entry
   */
  async deleteWeight(data, userContext) {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const deleteWeight_res = await deleteWeight(user_id, data.id);

      if (deleteWeight_res.success) {
        return {
          success: true,
          message: `✅ **Weight Deleted Successfully**\n\n🗑️ Weight entry for ${data.date} has been removed.`,
        };
      } else {
        throw new Error(deleteWeight_res.error.message);
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to delete weight: ${error.message}`,
      };
    }
  }
}

// Export singleton instance
export const ragService = new RAGService();
export default ragService;
