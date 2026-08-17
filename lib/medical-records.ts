export type ExaminationPhoto = {
  id: string
  // In production this will be a Firebase Storage download URL.
  url: string | null
  description: string
}

export type MedicalRecord = {
  patientId: string
  labNotes: string
  xrayImageUrl: string | null
  history: string
  historyImageUrl: string | null
  oldPrescriptionUrl: string | null
  newPrescription: string
  examinationNotes: string
  examinations: ExaminationPhoto[]
}

// Image fields that accept a single uploaded picture across the tabs.
export type ImageField = "xrayImageUrl" | "historyImageUrl" | "oldPrescriptionUrl"

// Mock seed data — replace with data fetched from Firestore later.
export const initialMedicalRecords: Record<string, MedicalRecord> = {
  "1": {
    patientId: "1",
    labNotes:
      "CBC within normal range. Vitamin D slightly low (24 ng/mL). Recommend supplementation and recheck in 3 months.",
    xrayImageUrl: null,
    history:
      "Appendectomy (2015). Seasonal allergies. No known drug allergies. Mother has history of hypertension.",
    historyImageUrl: null,
    oldPrescriptionUrl: null,
    newPrescription: "Vitamin D3 2000 IU — once daily with food for 90 days.",
    examinationNotes: "General appearance normal. No acute distress observed.",
    examinations: [
      { id: "e1", url: null, description: "Throat examination — mild inflammation" },
    ],
  },
  "2": {
    patientId: "2",
    labNotes:
      "Fasting glucose 132 mg/dL. HbA1c 6.8%. Lipid panel shows elevated LDL (161 mg/dL). Monitor for type 2 diabetes.",
    xrayImageUrl: null,
    history:
      "Type 2 diabetes (diagnosed 2019). Coronary stent placement (2021). Currently on Metformin and Atorvastatin.",
    historyImageUrl: null,
    oldPrescriptionUrl: null,
    newPrescription: "Metformin 1000mg — twice daily.\nAtorvastatin 20mg — once at night.",
    examinationNotes: "",
    examinations: [],
  },
  "3": {
    patientId: "3",
    labNotes: "Routine screening — all values normal. No follow-up required.",
    xrayImageUrl: null,
    history: "No significant past medical or surgical history. Non-smoker.",
    historyImageUrl: null,
    oldPrescriptionUrl: null,
    newPrescription: "",
    examinationNotes: "",
    examinations: [],
  },
  "4": {
    patientId: "4",
    labNotes: "Chest X-ray ordered to rule out lower respiratory infection. Awaiting results.",
    xrayImageUrl: null,
    history: "Fractured left wrist (2018). Smoker — 1 pack/day for 20 years. Advised on cessation.",
    historyImageUrl: null,
    oldPrescriptionUrl: null,
    newPrescription: "Amoxicillin 500mg — three times daily for 7 days.",
    examinationNotes: "",
    examinations: [],
  },
  "5": {
    patientId: "5",
    labNotes:
      "Bone density scan indicates osteopenia. Kidney function stable. Blood pressure well controlled.",
    xrayImageUrl: null,
    history:
      "Hypertension (long-standing). Cataract surgery, both eyes (2020, 2022). Hip replacement (2023).",
    historyImageUrl: null,
    oldPrescriptionUrl: null,
    newPrescription: "Calcium + Vitamin D — once daily.\nAmlodipine 5mg — once daily.",
    examinationNotes: "",
    examinations: [],
  },
}

export function getRecordForPatient(patientId: string): MedicalRecord {
  return (
    initialMedicalRecords[patientId] ?? {
      patientId,
      labNotes: "",
      xrayImageUrl: null,
      history: "",
      historyImageUrl: null,
      oldPrescriptionUrl: null,
      newPrescription: "",
      examinationNotes: "",
      examinations: [],
    }
  )
}
