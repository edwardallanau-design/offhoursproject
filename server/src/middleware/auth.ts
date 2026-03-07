import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { sendError } from '../utils/apiResponse';
import { UserRole } from '../types';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 401, 'Missing or invalid authorization header', 'UNAUTHORIZED');
    return;
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    sendError(res, 401, 'Invalid or expired token', 'UNAUTHORIZED');
    return;
  }

  req.user = user as Request['user'];
  req.role = (user.app_metadata?.role as UserRole) ?? undefined;

  // Attach profile ID for role-scoped queries
  if (req.role === 'contractor') {
    const { data } = await supabase
      .from('contractors')
      .select('id')
      .eq('user_id', user.id)
      .single();
    req.contractorId = data?.id;
  } else if (req.role === 'unit_owner') {
    const { data } = await supabase
      .from('unit_owners')
      .select('id')
      .eq('user_id', user.id)
      .single();
    req.unitOwnerId = data?.id;
  } else if (req.role === 'strata_manager') {
    const { data } = await supabase
      .from('strata_managers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    req.strataManagerId = data?.id;
  }

  next();
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      sendError(res, 403, 'Insufficient permissions', 'FORBIDDEN');
      return;
    }
    next();
  };
};

export const requireAdmin = requireRole('admin');
