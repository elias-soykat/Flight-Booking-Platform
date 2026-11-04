import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AppContext } from '../types/env';
import { requireRole } from '../middleware/rbac';
import { paymentService, PaymentError } from '../modules/payment/service';

export const paymentsRouter = new Hono<AppContext>();

const ReconcileBodySchema = z.object({
  action: z.enum(['FORCE_SUCCESS', 'FORCE_FAIL', 'RETRY']),
  note: z.string().min(5, 'Reconciliation note must be at least 5 characters')
});

// Reconcile a payment in UNKNOWN or failed state (Admin only)
paymentsRouter.post(
  '/:paymentId/reconcile',
  requireRole('ADMIN'),
  zValidator('json', ReconcileBodySchema, (result, c) => {
    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid reconciliation parameters',
          details: result.error.errors
        }
      }, 400);
    }
    return undefined;
  }),
  async (c) => {
    const paymentId = c.req.param('paymentId');
    const body = c.req.valid('json');
    const adminUserId = c.get('userId')!;

    try {
      const result = await paymentService.reconcilePayment({
        paymentId,
        action: body.action,
        note: body.note,
        adminUserId
      });

      return c.json({
        success: true,
        data: result
      }, 200);
    } catch (err: unknown) {
      if (err instanceof PaymentError) {
        return c.json({
          success: false,
          error: {
            code: err.code,
            message: err.message
          }
        }, err.statusCode as any);
      }
      const message = err instanceof Error ? err.message : 'Failed to reconcile payment';
      return c.json({
        success: false,
        error: {
          code: 'RECONCILIATION_FAILED',
          message
        }
      }, 500);
    }
  }
);

// Get list of unreconciled payments (Admin only)
paymentsRouter.get(
  '/unreconciled',
  requireRole('ADMIN'),
  async (c) => {
    const unreconciled = await paymentService.getUnreconciledPayments();
    return c.json({
      success: true,
      count: unreconciled.length,
      data: unreconciled
    });
  }
);
