import { Response } from 'express';

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200, message?: string) => {
  return res.status(statusCode).json({ data, ...(message && { message }) });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  code?: string,
) => {
  return res.status(statusCode).json({ error: { message, code: code ?? 'ERROR' } });
};
