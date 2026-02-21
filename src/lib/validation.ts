import { z } from 'zod';

/**
 * Input validation schemas for API endpoints
 * Using Zod for runtime type checking and validation
 */

// Booking validation
export const createBookingSchema = z.object({
  boatId: z.string().uuid('Invalid boat ID format'),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format'),
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const deleteBookingSchema = z.object({
  id: z.string().uuid('Invalid booking ID format'),
});

// Admin boat validation
const imageUrlField = z.preprocess(
  (val) => (val === '' ? null : val),
  z.string().url('Invalid image URL').nullable().optional()
);

export const updateBoatSchema = z.object({
  boatId: z.string().uuid('Invalid boat ID format'),
  name: z.string().min(1, 'Boat name is required').max(100, 'Boat name too long'),
  description: z.string().max(500, 'Description too long').nullable().optional(),
  capacity: z.number().int().min(1).max(100).optional(),
  imageUrl: imageUrlField,
  isActive: z.boolean().optional(),
  groupIds: z.array(z.string().min(1, 'Invalid group ID')).optional(),
});

export const createBoatSchema = z.object({
  name: z.string().min(1, 'Boat name is required').max(100, 'Boat name too long'),
  description: z.string().max(500, 'Description too long').nullable().optional(),
  capacity: z.number().int().min(1).max(100).optional(),
  imageUrl: imageUrlField,
  isActive: z.boolean().optional(),
  groupIds: z.array(z.string().min(1, 'Invalid group ID')).optional(),
});

// Admin user validation
export const updateUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  groupIds: z.array(z.string().min(1, 'Invalid group ID')).optional(),
  isActive: z.boolean().optional(),
});

// Admin group validation
export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name too long'),
  description: z.string().max(500, 'Description too long').nullable().optional(),
});

export const updateGroupSchema = z.object({
  id: z.string().min(1, 'Group ID is required'),
  name: z.string().min(1, 'Group name is required').max(100, 'Group name too long'),
  description: z.string().max(500, 'Description too long').nullable().optional(),
});

// Query parameter validation
export const dateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD'),
});

export const uuidQuerySchema = z.object({
  id: z.string().uuid('Invalid ID format — must be a UUID'),
});

/**
 * Helper function to safely validate and parse request data
 * Returns parsed data or throws with validation errors
 */
export function validateRequest<T>(schema: z.Schema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Helper function for safe validation with result
 * Returns success/error instead of throwing
 */
export function safeValidateRequest<T>(
  schema: z.Schema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
