/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ServiceType = 'doctor' | 'laboratory' | 'triage' | 'pharmacy';

export interface ServiceDetail {
  id: ServiceType;
  title: string;
  icon: string;
  themeColor: string;
  hoverBg: string;
  textClass: string;
  iconClass: string;
}

export type VisitorType = 'new' | 'returning' | 'guest' | null;

export interface PatientProfile {
  name: string;
  id: string;
  idType: 'IP' | 'GUEST' | 'NEW_PATIENT';
  phone?: string;
  age?: string;
}

export interface IntakeForm {
  symptoms: string;
  duration: string;
  medications: string[];
}

export interface IntakeRecord {
  patient: PatientProfile;
  service: ServiceType;
  form: IntakeForm;
  queueNo: string;
  waitTime: string;
  queuePosition: number;
  timestamp: string;
}
