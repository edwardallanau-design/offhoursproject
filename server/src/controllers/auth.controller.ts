import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess } from '../utils/apiResponse';

export const getSession = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const role = req.role;

  let profile = null;
  if (role === 'contractor') {
    const { data } = await supabase
      .from('contractors')
      .select('*')
      .eq('user_id', userId)
      .single();
    profile = data;
  } else if (role === 'unit_owner') {
    const { data } = await supabase
      .from('unit_owners')
      .select('*')
      .eq('user_id', userId)
      .single();
    profile = data;
  } else if (role === 'strata_manager') {
    const { data } = await supabase
      .from('strata_managers')
      .select('*')
      .eq('user_id', userId)
      .single();
    profile = data;
  }

  sendSuccess(res, {
    user: { id: userId, email: req.user!.email, role },
    profile,
  });
};
