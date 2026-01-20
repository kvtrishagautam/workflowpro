export type JobStatus = 'scheduled' | 'sent' | 'failed' | 'cancelled';
export type ScheduleType = 'one-time' | 'recurring';

export interface ScheduledEmailJobData {
  id?: string;
  subject: string;
  body: string;
  recipients: string[]; // Array of email addresses
  recipientGroupId?: string;
  scheduledDateTime?: Date;
  cronExpression?: string;
  scheduleType: ScheduleType;
  status: JobStatus;
  personalizationCSV?: string;
  createdAt?: Date;
  updatedAt?: Date;
  executedAt?: Date;
  errorMessage?: string;
}

export interface RecipientGroupData {
  id?: string;
  name: string;
  emails: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DeliveryLogData {
  id?: string;
  jobId: string;
  recipient: string;
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
  timestamp?: Date;
}

export interface PersonalizationVariables {
  [key: string]: string;
}

export interface PersonalizationData {
  email: string;
  variables: PersonalizationVariables;
}
