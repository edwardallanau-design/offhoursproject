import { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/apiResponse';

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  temporary_password: z.string().min(8),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  company: z.string().optional(),
});

export const listStrataManagers = async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('strata_managers')
    .select('*')
    .order('name');
  if (error) throw new Error(error.message);
  sendSuccess(res, data);
};

export const createStrataManager = async (req: Request, res: Response) => {
  const body = createSchema.parse(req.body);

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.temporary_password,
    email_confirm: true,
    app_metadata: { role: 'strata_manager' },
  });

  if (authErr) return sendError(res, 400, authErr.message, 'AUTH_ERROR');

  const { data, error } = await supabase
    .from('strata_managers')
    .insert({
      user_id: authData.user.id,
      name: body.name,
      phone: body.phone,
      email: body.email,
      company: body.company ?? null,
    })
    .select()
    .single();

  if (error) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(error.message);
  }

  sendSuccess(res, data, 201);
};

export const updateStrataManager = async (req: Request, res: Response) => {
  const body = updateSchema.parse(req.body);
  const { data, error } = await supabase
    .from('strata_managers')
    .update(body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (!data) return sendError(res, 404, 'Strata manager not found', 'NOT_FOUND');
  sendSuccess(res, data);
};
