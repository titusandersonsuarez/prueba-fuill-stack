import type { PrescriptionStatus } from '@prescriptions/shared';

export interface PrescriptionItem {
  id: string;
  medicationName: string;
  dosage: string | null;
  frequency: string | null;
  quantity: number | null;
  instructions: string | null;
}

export interface PrescriptionAuthor {
  id: string;
  firstName: string;
  lastName: string;
  speciality: string;
}

export interface PrescriptionPatientRef {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Prescription {
  id: string;
  code: string;
  status: PrescriptionStatus;
  notes: string | null;
  consumedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: PrescriptionAuthor;
  patient: PrescriptionPatientRef;
  items: PrescriptionItem[];
}

export interface PatientUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  phone: string | null;
  user: PatientUser;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  speciality: string;
  licenseNumber: string;
  user: { id: string; email: string };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PagedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
