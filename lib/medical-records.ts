import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"

export type ExaminationPhoto = {
  id: string
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

const COLLECTION_NAME = "medicalRecords"

export function getDefaultMedicalRecord(patientId: string): MedicalRecord {
  return {
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
}

/**
 * Subscribe to a patient's medical record document in Firestore in real-time.
 */
export function subscribeMedicalRecord(
  patientId: string,
  callback: (record: MedicalRecord) => void,
  onError?: (error: Error) => void
) {
  const docRef = doc(db, COLLECTION_NAME, patientId)

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        callback({
          patientId,
          labNotes: data.labNotes ?? "",
          xrayImageUrl: data.xrayImageUrl ?? null,
          history: data.history ?? "",
          historyImageUrl: data.historyImageUrl ?? null,
          oldPrescriptionUrl: data.oldPrescriptionUrl ?? null,
          newPrescription: data.newPrescription ?? "",
          examinationNotes: data.examinationNotes ?? "",
          examinations: Array.isArray(data.examinations) ? data.examinations : [],
        })
      } else {
        callback(getDefaultMedicalRecord(patientId))
      }
    },
    (err) => {
      console.error("Error subscribing to medical record:", err)
      if (onError) onError(err)
      callback(getDefaultMedicalRecord(patientId))
    }
  )
}

/**
 * Save medical record text notes & data directly to Firestore.
 */
export async function saveMedicalRecordToFirestore(record: MedicalRecord): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, record.patientId)
  await setDoc(
    docRef,
    {
      patientId: record.patientId,
      labNotes: record.labNotes || "",
      xrayImageUrl: record.xrayImageUrl || null,
      history: record.history || "",
      historyImageUrl: record.historyImageUrl || null,
      oldPrescriptionUrl: record.oldPrescriptionUrl || null,
      newPrescription: record.newPrescription || "",
      examinationNotes: record.examinationNotes || "",
      examinations: record.examinations || [],
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  )
}

/**
 * Upload an image to Firebase Storage and return its public download URL.
 * Throws an error if Firebase Storage bucket is not enabled or fails.
 */
export async function uploadMedicalImageToStorage(
  patientId: string,
  file: File,
  folder: string
): Promise<string> {
  const fileExt = file.name.split(".").pop() || "png"
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`
  const storageRef = ref(storage, `medical-records/${patientId}/${folder}/${fileName}`)

  const snapshot = await uploadBytes(storageRef, file)
  const downloadUrl = await getDownloadURL(snapshot.ref)
  return downloadUrl
}
