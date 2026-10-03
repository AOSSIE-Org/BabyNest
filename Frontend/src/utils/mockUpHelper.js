export function calculatePregnancyWeek(lmp) {
  const lmpDate = new Date(`${lmp}T00:00:00`);
  const today = new Date();

  if (Number.isNaN(lmpDate.getTime())) {
    throw new Error('Invalid LMP date');
  }

  const diffMs = today.getTime() - lmpDate.getTime();

  if (diffMs < 0) {
    return 0;
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Gestational week completed.
  return Math.floor(days / 7) + 1;
}

/**
- Mock / projected data calculated using CDC/IOM pregnancy weight-gain guidelines. 
- This is not an actual medical measurement. 
- Please check and update if necessary with your actual weight.  
- For more information, check CDC pregnancy weight-gain guidelines.
*/
export function generateInitialWeightData(userId, currentWeight, currentWeek) {
  const records = [];

  const weight = Number(currentWeight);

  if (!Number.isFinite(weight) || weight <= 0) {
    return records;
  }

  // Current week = user's actual entered weight.
  records.push({
    user_id: userId,
    week_number: currentWeek,
    weight: Number(weight.toFixed(1)),
    note: 'Actual weight entered during profile creation.',
  });

  for (let week = currentWeek + 1; week <= 40; week++) {
    const weeksAhead = week - currentWeek;

    const projectedWeight = currentWeight + weeksAhead * 0.405;

    records.push({
      user_id: userId,
      week_number: week,
      weight: Number(projectedWeight.toFixed(1)),
      note: "Projected data calculated using CDC/IOM pregnancy weight-gain guidelines.",
    });
  }

  return records;
}

/**
Default/mock prenatal supplement reminder based on general CDC/IOM guidance.
This is not a personal medical prescription. 
Check and update with your healthcare provider and actual prescription.
For more information, check CDC pregnancy nutrition guidance.
*/
const DEFAULT_PRENATAL_MEDICINES = [
  {
    startWeek: 1,
    endWeek: 40,
    name: 'Prenatal Vitamin',
    dose: 'As directed on product label',
    time: '08:00',
    note:
      'General prenatal vitamin reminder; should provide folic acid. ' +
      'CDC recommends 400 mcg folic acid daily for women capable of becoming pregnant.',
  },
  {
    startWeek: 14,
    endWeek: 40,
    name: 'Iron Supplement',
    dose: 'As directed by healthcare provider',
    time: '13:00',
    note:
      'Iron supplementation may be recommended during pregnancy depending on ' +
      'dietary intake, blood tests, and healthcare-provider advice.',
  },
];

export function generateInitialMedicineData(userId, currentWeek) {
  const records = [];

  for (const medicine of DEFAULT_PRENATAL_MEDICINES) {
    // Only create a record if the user is currently
    // within or beyond this medicine's recommended stage.
    if (currentWeek >= medicine.startWeek) {
      records.push({
        user_id: userId,
        week_number: currentWeek,
        name: medicine.name,
        dose: medicine.dose,
        time: medicine.time,
        taken: 0,
        note: `${medicine.note}`,
      });
    }
  }

  return records;
}

const DEFAULT_SYMPTOMS = [
  {
    startWeek: 6,
    endWeek: 12,
    symptom: 'Morning Sickness',
    note: 'Commonly occurs during early pregnancy.',
  },
  {
    startWeek: 8,
    endWeek: 13,
    symptom: 'Breast Tenderness',
    note: 'Breast sensitivity can occur during early pregnancy.',
  },
  {
    startWeek: 8,
    endWeek: 20,
    symptom: 'Frequent Urination',
    note: 'Increased urination can occur during pregnancy.',
  },
  {
    startWeek: 14,
    endWeek: 40,
    symptom: 'Fatigue',
    note: 'Fatigue can occur throughout pregnancy.',
  },
];

export function generateInitialSymptoms(userId, currentWeek) {
  return DEFAULT_SYMPTOMS.filter(
    symptom =>
      currentWeek >= symptom.startWeek && currentWeek <= symptom.endWeek,
  ).map(symptom => ({
    user_id: userId,
    week_number: currentWeek,
    symptom: symptom.symptom,
    note: `${symptom.note} ${MOCK_SYMPTOM_NOTE}`,
  }));
}

const DEFAULT_TASKS = [
  // First Trimester
  {
    title: 'Initial Prenatal Visit',
    content: 'First doctor visit to confirm pregnancy and health check.',
    starting_week: 4,
    ending_week: 4,
    task_priority: 'high',
    isOptional: 0,
  },
  {
    title: 'Early Ultrasound',
    content: 'Confirm pregnancy location and heartbeat.',
    starting_week: 6,
    ending_week: 8,
    task_priority: 'high',
    isOptional: 0,
  },
  {
    title: 'Folic Acid Supplementation',
    content: 'Start folic acid for neural tube development.',
    starting_week: 4,
    ending_week: 12,
    task_priority: 'high',
    isOptional: 0,
  },
  {
    title: 'Blood Tests',
    content: 'Check for blood type, hemoglobin, and infections.',
    starting_week: 8,
    ending_week: 10,
    task_priority: 'high',
    isOptional: 0,
  },
  {
    title: 'Down Syndrome Screening',
    content: 'Non-invasive prenatal screening for chromosomal conditions.',
    starting_week: 10,
    ending_week: 12,
    task_priority: 'medium',
    isOptional: 0,
  },

  // Second Trimester
  {
    title: 'NT Scan',
    content: 'Nuchal translucency scan for fetal abnormalities.',
    starting_week: 12,
    ending_week: 14,
    task_priority: 'high',
    isOptional: 0,
  },
  {
    title: 'Gestational Diabetes Test',
    content: 'Glucose test to check blood sugar levels.',
    starting_week: 14,
    ending_week: 16,
    task_priority: 'high',
    isOptional: 0,
  },
  {
    title: 'Detailed Anomaly Scan',
    content: '20-week scan to check fetal development.',
    starting_week: 18,
    ending_week: 20,
    task_priority: 'high',
    isOptional: 0,
  },
  {
    title: 'Fetal Movement Monitoring',
    content: 'Track baby movements for health assessment.',
    starting_week: 21,
    ending_week: 24,
    task_priority: 'medium',
    isOptional: 0,
  },
  {
    title: 'Iron and Calcium Supplements',
    content: 'Ensure proper bone and blood health for mother and baby.',
    starting_week: 21,
    ending_week: 28,
    task_priority: 'medium',
    isOptional: 0,
  },

  // Third Trimester
  {
    title: 'Rh Factor Screening',
    content: 'Test if mother needs Rh immunoglobulin.',
    starting_week: 26,
    ending_week: 28,
    task_priority: 'high',
    isOptional: 0,
  },
  {
    title: 'Glucose Tolerance Test',
    content: 'Second test if needed for gestational diabetes.',
    starting_week: 28,
    ending_week: 28,
    task_priority: 'medium',
    isOptional: 0,
  },
  {
    title: 'Pre-Birth Vaccination',
    content: 'Tdap and flu shots for maternal and newborn protection.',
    starting_week: 30,
    ending_week: 32,
    task_priority: 'high',
    isOptional: 0,
  },
  {
    title: 'Third-Trimester Ultrasound',
    content: 'Assess baby’s growth and position.',
    starting_week: 30,
    ending_week: 32,
    task_priority: 'high',
    isOptional: 0,
  },
  {
    title: 'Birth Plan Discussion',
    content: 'Discuss delivery preferences with doctor.',
    starting_week: 33,
    ending_week: 34,
    task_priority: 'medium',
    isOptional: 1,
  },
  {
    title: 'Hospital Tour',
    content: 'Visit maternity hospital to prepare for delivery.',
    starting_week: 33,
    ending_week: 34,
    task_priority: 'low',
    isOptional: 1,
  },
  {
    title: 'Labor Signs Monitoring',
    content: 'Educate about labor contractions and when to go to hospital.',
    starting_week: 36,
    ending_week: 40,
    task_priority: 'high',
    isOptional: 0,
  },
  {
    title: 'Final Checkups',
    content: 'Last medical assessments before labor.',
    starting_week: 38,
    ending_week: 40,
    task_priority: 'high',
    isOptional: 0,
  },
];

export async function insertDefaultTasks(db, userId) {
  for (const task of DEFAULT_TASKS) {
    await db.execute(
      `
      INSERT INTO tasks
      (
        user_id,
        title,
        content,
        starting_week,
        ending_week,
        task_priority,
        isOptional,
        isAppointmentMade,
        task_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        task.title,
        task.content,
        task.starting_week,
        task.ending_week,
        task.task_priority,
        task.isOptional,
        0,
        'pending',
      ],
    );
  }
}
