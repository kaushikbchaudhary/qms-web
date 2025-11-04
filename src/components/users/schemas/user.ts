// schemas/user.ts
import { z } from "zod";
import { roles as role } from "@/config/roles";

const roleValues = Object.values(role) as [string, ...string[]];
const contactNumberSchema = z
    .string()
    .regex(/^\d{10}$/, {
        message: "Enter a 10-digit contact number without the country code or '+'.",
    });

export const userFormSchema = z.object({
    firstName: z.string().min(2, {
        message: "First name must be at least 2 characters.",
    }),
    middleName: z.string().optional(),
    lastName: z.string().min(2, {
        message: "Last name must be at least 2 characters.",
    }),
    emailId: z.string().email({
        message: "Please enter a valid email address.",
    }),
    contact: contactNumberSchema,
    countryCode: z.string().min(1, {
        message: "Country code is required.",
    }),
    role: z.union([
        z.array(z.enum(roleValues)).nonempty("At least one role is required"),
        z.enum(roleValues),
    ]),
    organization: z.string().min(2, {
        message: "Organization must be at least 2 characters.",
    }),
    signature: z.object({
        path: z.string().min(1, { message: "Signature is required" }),
        filename: z.string().optional(),
    }).optional(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
