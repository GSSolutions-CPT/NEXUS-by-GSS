import { z } from "zod";

// Visitor Validation
export const visitorSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    phone: z.string().regex(/^\+?[\d\s-]{7,15}$/, "Invalid phone format"),
    validFrom: z.string().datetime({ offset: true }).optional(),
    validUntil: z.string().datetime({ offset: true }).optional(),
    needsParking: z.boolean().default(false).optional(),
    accessWindows: z.array(
        z.object({
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
            from: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
            to: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
        })
    ).optional().nullable(),
});

// Admin User Creation Validation
export const userSchema = z.object({
    email: z.string().email("Invalid email format"),
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    role: z.enum(["Owner", "Guard", "SuperAdmin"]),
    unitId: z.string().uuid("Invalid Unit ID").optional().or(z.literal("")).nullable(),
});

// Parcel Logging Validation
export const parcelSchema = z.object({
    unit_id: z.string().uuid("Invalid Unit ID"),
    courier_name: z.string().min(1, "Courier name is required").max(150),
    recipient_name: z.string().max(150).optional().nullable(),
});

// Maintenance Ticket Validation
export const maintenanceSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(150),
    description: z.string().min(10, "Description must be at least 10 characters").max(2000),
    category: z.enum(['General', 'Plumbing', 'Electrical', 'HVAC', 'Security', 'Appliance', 'Structural']),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
    image_url: z.string().url("Invalid image URL").optional().nullable(),
});

export const announcementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
  content: z.string().min(10, "Content must be at least 10 characters").max(2000, "Content is too long"),
  type: z.enum(['info', 'warning', 'emergency'], { 
    message: "Invalid announcement type selected" 
  }),
});
