import webpush from 'web-push';
import { supabase } from '../config/supabase';
import { Job } from '../types';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export const sendWebPush = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> => {
  const { data: row } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)
    .single();

  if (!row) return;

  try {
    await webpush.sendNotification(
      row.subscription as webpush.PushSubscription,
      JSON.stringify({ title, body, data }),
    );
  } catch (err: unknown) {
    // 410 = subscription expired, clean it up
    if (
      err &&
      typeof err === 'object' &&
      'statusCode' in err &&
      (err as { statusCode: number }).statusCode === 410
    ) {
      await supabase.from('push_subscriptions').delete().eq('user_id', userId);
    }
  }
};

export const sendJobAssignmentWebPush = async (
  userId: string,
  job: Job,
): Promise<void> => {
  await sendWebPush(
    userId,
    `New Job: ${job.service_type.replace('_', ' ')}`,
    `${job.homeowner_name} at ${job.homeowner_address}`,
    { jobId: job.id, path: `/contractor/jobs/${job.id}` },
  );
};
