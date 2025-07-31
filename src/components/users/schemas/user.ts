// schemas/user.ts
import { z } from "zod";
import {roles as role} from "@/config/roles";

const roleValues = Object.values(role) as [string, ...string[]];

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
    contact: z.string().min(6, {
        message: "Contact number must be at least 6 characters.",
    }),
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
});

export type UserFormValues = z.infer<typeof userFormSchema>;