import sgMail from '@sendgrid/mail';
import { Job, Contractor, StrataManager } from '../types';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM = process.env.EMAIL_FROM!;
const APP_URL = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

export const sendJobAssignmentEmail = async (
  contractor: Contractor,
  job: Job,
): Promise<void> => {
  await sgMail.send({
    to: contractor.email,
    from: FROM,
    subject: `[Off-Hours Service] New Job Assigned: ${job.service_type}`,
    html: `
      <h2>New job assigned to you</h2>
      <table>
        <tr><td><strong>Service Type</strong></td><td>${job.service_type.replace('_', ' ')}</td></tr>
        <tr><td><strong>Client Name</strong></td><td>${job.homeowner_name}</td></tr>
        <tr><td><strong>Client Phone</strong></td><td>${job.homeowner_phone}</td></tr>
        <tr><td><strong>Address</strong></td><td>${job.homeowner_address}</td></tr>
        ${job.unit_number ? `<tr><td><strong>Unit</strong></td><td>${job.unit_number}</td></tr>` : ''}
        ${job.description ? `<tr><td><strong>Description</strong></td><td>${job.description}</td></tr>` : ''}
      </table>
      <p><a href="${APP_URL}/contractor/jobs/${job.id}">View Job &rarr;</a></p>
      <p style="color:#888;font-size:12px">Off-Hours Emergency Service Platform</p>
    `,
  });
};

export const sendStrataNotificationEmail = async (
  manager: StrataManager,
  subject: string,
  body: string,
): Promise<void> => {
  await sgMail.send({
    to: manager.email,
    from: FROM,
    subject: `[Off-Hours Service] ${subject}`,
    html: `<p>${body.replace(/\n/g, '<br>')}</p><p style="color:#888;font-size:12px">Off-Hours Emergency Service Platform</p>`,
  });
};

export const sendGenericEmail = async (
  to: string,
  subject: string,
  body: string,
): Promise<void> => {
  await sgMail.send({
    to,
    from: FROM,
    subject: `[Off-Hours Service] ${subject}`,
    html: `<p>${body.replace(/\n/g, '<br>')}</p><p style="color:#888;font-size:12px">Off-Hours Emergency Service Platform</p>`,
  });
};
