import { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/apiResponse';

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  trade: z.string().optional(),
  temporary_password: z.string().min(8),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  trade: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const listContractors = async (req: Request, res: Response) => {
  const { is_active } = req.query;
  let query = supabase.from('contractors').select('*').order('name');
  if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  sendSuccess(res, data);
};

export const createContractor = async (req: Request, res: Response) => {
  const body = createSchema.parse(req.body);

  // Create Supabase auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.temporary_password,
    email_confirm: true,
    app_metadata: { role: 'contractor' },
  });

  if (authErr) return sendError(res, 400, authErr.message, 'AUTH_ERROR');

  // Create contractor profile
  const { data, error } = await supabase
    .from('contractors')
    .insert({
      user_id: authData.user.id,
      name: body.name,
      phone: body.phone,
      email: body.email,
      trade: body.trade ?? null,
    })
    .select()
    .single();

  if (error) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(error.message);
  }

  sendSuccess(res, data, 201);
};

export const updateContractor = async (req: Request, res: Response) => {
  const body = updateSchema.parse(req.body);
  const { data, error } = await supabase
    .from('contractors')
    .update(body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (!data) return sendError(res, 404, 'Contractor not found', 'NOT_FOUND');
  sendSuccess(res, data);
};
