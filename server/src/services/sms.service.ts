import twilio from 'twilio';
import { Job, Contractor } from '../types';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);

export const sendJobAssignmentSMS = async (contractor: Contractor, job: Job): Promise<void> => {
  const body = [
    `[Off-Hours Service] New job assigned to you.`,
    `Service: ${job.service_type.replace('_', ' ').toUpperCase()}`,
    `Client: ${job.homeowner_name}`,
    `Address: ${job.homeowner_address}`,
    `Phone: ${job.homeowner_phone}`,
    job.description ? `Notes: ${job.description}` : null,
    `Please log in to accept or reject this job.`,
  ]
    .filter(Boolean)
    .join('\n');

  await client.messages.create({
    to: contractor.phone,
    from: process.env.TWILIO_FROM_NUMBER!,
    body,
  });
};

export const sendAdminSMS = async (phone: string, message: string): Promise<void> => {
  await client.messages.create({
    to: phone,
    from: process.env.TWILIO_FROM_NUMBER!,
    body: message,
  });
};
