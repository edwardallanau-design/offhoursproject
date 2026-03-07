import { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { sendSuccess } from '../utils/apiResponse';

export const getVapidPublicKey = async (_req: Request, res: Response) => {
  sendSuccess(res, { publicKey: process.env.VAPID_PUBLIC_KEY! });
};

export const savePushSubscription = async (req: Request, res: Response) => {
  const { subscription } = z
    .object({ subscription: z.record(z.string(), z.unknown()) })
    .parse(req.body);

  await supabase.from('push_subscriptions').upsert(
    { user_id: req.user!.id, subscription },
    { onConflict: 'user_id' },
  );

  sendSuccess(res, { message: 'Subscription saved' });
};

export const deletePushSubscription = async (req: Request, res: Response) => {
  await supabase.from('push_subscriptions').delete().eq('user_id', req.user!.id);
  sendSuccess(res, { message: 'Subscription removed' });
};
