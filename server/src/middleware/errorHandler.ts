import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  if (err instanceof Error) {
    console.error('[Error]', err.message, err.stack);
    res.status(500).json({
      error: { message: err.message || 'Internal server error', code: 'SERVER_ERROR' },
    });
    return;
  }

  console.error('[Unknown error]', err);
  res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
};
