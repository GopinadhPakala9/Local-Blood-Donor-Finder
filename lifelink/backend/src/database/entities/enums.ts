export enum UserRole {
  DONOR = 'donor',
  PATIENT = 'patient',
  HOSPITAL = 'hospital',
  BLOOD_BANK = 'blood_bank',
  ADMIN = 'admin',
}

export enum BloodGroup {
  A_POS = 'A+',
  A_NEG = 'A-',
  B_POS = 'B+',
  B_NEG = 'B-',
  O_POS = 'O+',
  O_NEG = 'O-',
  AB_POS = 'AB+',
  AB_NEG = 'AB-',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum Urgency {
  NORMAL = 'Normal',
  URGENT = 'Urgent',
  CRITICAL = 'Critical',
}

export enum RequestStatus {
  OPEN = 'Open',
  FULFILLED = 'Fulfilled',
  CANCELLED = 'Cancelled',
}
