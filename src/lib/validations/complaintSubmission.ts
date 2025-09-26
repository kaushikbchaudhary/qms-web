import { z } from 'zod';
import { ComplaintSubmissionRequirementMap } from '@/config/formRequirements';

const preprocessOptionalString = () =>
    z.preprocess((value) => {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed.length ? trimmed : undefined;
        }
        return value === '' ? undefined : value;
    }, z.string().optional());

const stringField = (
    requirements: ComplaintSubmissionRequirementMap,
    path: string,
    {
        message,
        minLength,
        email,
    }: {
        message: string;
        minLength?: number;
        email?: boolean;
    }
) => {
    if (requirements[path]) {
        let schema = z.string({ required_error: message }).trim();
        if (minLength) {
            schema = schema.min(minLength, message);
        }
        if (email) {
            schema = schema.email('Invalid email address');
        }
        return schema;
    }

    let schema = preprocessOptionalString();
    if (minLength) {
        schema = schema.refine((value) => value === undefined || value.length >= minLength, {
            message,
        });
    }
    if (email) {
        schema = schema.refine((value) => value === undefined || /.+@.+\..+/.test(value), {
            message: 'Invalid email address',
        });
    }
    return schema;
};

const enumField = <T extends readonly [string, ...string[]]>(
    requirements: ComplaintSubmissionRequirementMap,
    path: string,
    options: T,
    message: string
) => {
    if (requirements[path]) {
        return z.enum(options, { required_error: message });
    }
    return z.enum(options).optional();
};

const arrayOfStringsField = (
    requirements: ComplaintSubmissionRequirementMap,
    path: string
) => {
    const base = z.array(z.string());
    if (requirements[path]) {
        return base.min(1, 'At least one attachment is required');
    }
    return base.optional();
};

export const buildComplaintSubmissionSchema = (requirements: ComplaintSubmissionRequirementMap) =>
    z.object({
        customer: z.object({
            name: stringField(requirements, 'customer.name', {
                message: 'Name must be at least 2 characters',
                minLength: 2,
            }),
            company: preprocessOptionalString(),
            contact_number: stringField(requirements, 'customer.contact_number', {
                message: 'Invalid phone number',
                minLength: 10,
            }),
            email: stringField(requirements, 'customer.email', {
                message: 'Email is required',
                email: true,
            }),
        }),
        product_details: z.object({
            model: stringField(requirements, 'product_details.model', {
                message: 'Model is required',
                minLength: 1,
            }),
            batch_number: preprocessOptionalString(),
            serial_number: stringField(requirements, 'product_details.serial_number', {
                message: 'Serial number is required',
                minLength: 1,
            }),
            purchase_date: stringField(requirements, 'product_details.purchase_date', {
                message: 'Purchase date is required',
                minLength: 1,
            }),
        }),
        complaint_type: z.object({
            name: stringField(requirements, 'complaint_type.name', {
                message: 'Complaint type is required',
                minLength: 1,
            }),
            description: z.string().nullable().optional(),
            config: z.object({
                _id: z.string(),
                name: z.string(),
                type: z.string(),
            }),
        }),
        issue_details: z.object({
            description: stringField(requirements, 'issue_details.description', {
                message: 'Description must be at least 10 characters',
                minLength: 10,
            }),
            problem_start_date: stringField(requirements, 'issue_details.problem_start_date', {
                message: 'Problem start date is required',
                minLength: 1,
            }),
            occurred_before: enumField(requirements, 'issue_details.occurred_before', ['Yes', 'No'] as const, 'Please select an option'),
            replication_steps: preprocessOptionalString(),
        }),
        customer_impact: stringField(requirements, 'customer_impact', {
            message: 'Impact description must be at least 10 characters',
            minLength: 10,
        }),
        previous_contact: z.object({
            reported_before: enumField(requirements, 'previous_contact.reported_before', ['Yes', 'No'] as const, 'Please select an option'),
            reference_number: preprocessOptionalString(),
            contact_date: preprocessOptionalString(),
            person_contacted: preprocessOptionalString(),
        }),
        customer_actions: z.object({
            troubleshooting_done: enumField(requirements, 'customer_actions.troubleshooting_done', ['Yes', 'No'] as const, 'Please select an option'),
            troubleshooting_description: preprocessOptionalString(),
        }),
        preferred_resolution_method: z.object({
            name: stringField(requirements, 'preferred_resolution_method.name', {
                message: 'Preferred resolution method is required',
                minLength: 1,
            }),
            description: z.string().nullable().optional(),
            config: z.object({
                _id: z.string(),
                name: z.string(),
                type: z.string(),
            }),
        }),
        replacement_details: z
            .object({
                batch_number: preprocessOptionalString(),
                serial_number: preprocessOptionalString(),
                mfg_date: preprocessOptionalString(),
            })
            .optional(),
        attachments: arrayOfStringsField(requirements, 'attachments'),
    });
