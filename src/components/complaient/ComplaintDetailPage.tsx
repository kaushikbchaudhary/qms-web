import React, { useState, useEffect, useMemo } from 'react';
import {
    CheckCircle,
    Clock,
    XCircle,
    User,
    FileText,
    MessageSquare,
    Calendar,
    Phone,
    Mail,
    Package,
    AlertTriangle,
    Edit3,
    Building,
    Hash,
    UserCheck,
    Search,
    Users,
    Target,
    ShieldCheck,
    Info,
    PhoneCall,
    Paperclip,
    Loader2
} from 'lucide-react';

// Import shadcn components (assuming they're available)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {useAuthStore, UserData} from "@/stores/authStore";
import { roles, formatRoleLabel } from "@/config/roles";
import { resolveRoleKey } from "@/lib/auth/access";
import {
    useAssignInvestigators,
    useComplaintWithWorkflow,
    useMarkInvestigationAssignmentRead,
    useTransitionComplaintStatus,
    useUpdateReceivedInfo
} from "@/hooks/api/useComplaints";
import {Complaint, DeadlineSummary} from "@/lib/api/types/complaints";
import type { InvestigationFormData, ComplaintClosureFormData, CustomerCommunicationFormData } from '@/lib/validations/complaint';
import {Drawer, DrawerContent, DrawerHeader, DrawerTitle} from "@/components/ui/drawer";
import {InvestigationForm} from "@/components/forms/InvestigationForm";
import {formatDate, formatDateTime, formatWorkingDuration, showApiErrorToast} from "@/lib/utils";
import {CustomerCommunicationForm} from "@/components/forms/CustomerCommunicationForm";
import {ComplaintClosureForm} from "@/components/forms/ComplaintClosureForm";
import {complaintsApi} from "@/lib/api/endpoints/complaints";
import {toast} from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { useGetUsers } from '@/hooks/api/useUser';
import AttachmentViewer from "@/components/complaient/AttachmentViewer";
import { ComplaintForm } from "@/components/forms/complaint-form";
import { useRouter } from 'next/navigation';
import { can as buildCan } from "@/lib/auth/permissions";

const ROLE_VALUE_SET = new Set<string>(Object.values(roles));

const normalizeRole = (roleValue?: string | null): roles | null => {
    if (!roleValue) return null;
    const resolvedRole = resolveRoleKey(roleValue) ?? roleValue;
    return ROLE_VALUE_SET.has(resolvedRole) ? (resolvedRole as roles) : null;
};

const INVESTIGATOR_ASSIGN_ROLES: roles[] = [roles.QA, roles.SUPER_ADMIN, roles.SUPPORT];

interface Props {
    complaintId:any
}
const ComplaintDetailPage = (params:Props) => {
    const router = useRouter();
    // Complaint statuses from your schema
    const COMPLAINT_STATUS = {
        SUBMITTED: 'SUBMITTED',
        UNDER_INVESTIGATION: 'UNDER_INVESTIGATION',
        RESOLVED: 'RESOLVED',
        REJECTED: 'REJECTED',
        CLOSED: 'CLOSED'
    } as const satisfies Record<string, Complaint['status']>;

    const INVESTIGATION_LIMIT = 20;
    const CLOSURE_LIMIT = 30;

    type ComplaintStatus = Complaint['status'];
    type RolePermission = {
        canTransitionTo: Record<ComplaintStatus, ComplaintStatus[]>;
        canEdit: string[] | 'all';
        label: string;
    };

    const STAGE_CONFIG = {
        [COMPLAINT_STATUS.SUBMITTED]: {
            name: 'Submitted',
            variant: 'secondary',
            icon: FileText,
            description: 'Complaint has been submitted and awaiting review'
        },
        [COMPLAINT_STATUS.UNDER_INVESTIGATION]: {
            name: 'Under Investigation',
            variant: 'warning',
            icon: Clock,
            description: 'Complaint is being investigated by the team'
        },
        [COMPLAINT_STATUS.RESOLVED]: {
            name: 'Resolved',
            variant: 'success',
            icon: CheckCircle,
            description: 'Investigation complete and resolution provided'
        },
        [COMPLAINT_STATUS.REJECTED]: {
            name: 'Rejected',
            variant: 'destructive',
            icon: XCircle,
            description: 'Complaint has been rejected'
        },
        [COMPLAINT_STATUS.CLOSED]: {
            name: 'Closed',
            variant: 'outline',
            icon: XCircle,
            description: 'Complaint has been closed'
        }
    };
    const formatRoleList = (roleValue: any): string => {
        if (!roleValue) return '';
        const roleArray = Array.isArray(roleValue) ? roleValue : [roleValue];
        return roleArray
            .filter(Boolean)
            .map((role: string) => formatRoleLabel(role) || role)
            .join(', ');
    };

    const getChangedByInfo = (changedBy: any): { label: string; tooltip?: string } | null => {
        if (!changedBy) return null;

        if (typeof changedBy === 'string') {
            return { label: changedBy };
        }

        const name = [changedBy.firstName, changedBy.lastName]
            .filter(Boolean)
            .join(' ')
            .trim()
            || changedBy.emailId
            || changedBy._id
            || 'Unknown user';

        const roleLabel = formatRoleList(changedBy.role);
        const tooltipParts = [
            name,
            roleLabel ? `Role: ${roleLabel}` : '',
            changedBy.emailId && changedBy.emailId !== name ? `Email: ${changedBy.emailId}` : ''
        ].filter(Boolean);

        return {
            label: name,
            tooltip: tooltipParts.length ? tooltipParts.join(' • ') : undefined
        };
    };


    // Role-based permissions matching your user schema
    const ROLE_PERMISSIONS: Record<string, RolePermission> = {
        [roles.SUPPORT]: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION, COMPLAINT_STATUS.REJECTED],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED],
                [COMPLAINT_STATUS.RESOLVED]: [COMPLAINT_STATUS.CLOSED],
                [COMPLAINT_STATUS.REJECTED]: [],
                [COMPLAINT_STATUS.CLOSED]: []
            },
            canEdit: ['received_info', 'customer_communication', 'risk_management'],
            label: 'Support Team'
        },
        [roles.QA]: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED],
                [COMPLAINT_STATUS.RESOLVED]: [COMPLAINT_STATUS.CLOSED],
                [COMPLAINT_STATUS.REJECTED]: [],
                [COMPLAINT_STATUS.CLOSED]: []
            },
            canEdit: ['investigation', 'closure', 'risk_management','customer_communication'],
            label: 'Quality Assurance'
        },
        [roles.PRODUCTION]: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED],
                [COMPLAINT_STATUS.RESOLVED]: [],
                [COMPLAINT_STATUS.REJECTED]: [],
                [COMPLAINT_STATUS.CLOSED]: []
            },
            canEdit: ['investigation', 'customer_communication'],
            label: 'Production Team'
        },
        [roles.SOFTWARE]: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED],
                [COMPLAINT_STATUS.RESOLVED]: [],
                [COMPLAINT_STATUS.REJECTED]: [],
                [COMPLAINT_STATUS.CLOSED]: []
            },
            canEdit: ['investigation', 'customer_communication'],
            label: 'Software Team'
        },
        [roles.DESIGN_DEVELOPMENT]: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED],
                [COMPLAINT_STATUS.RESOLVED]: [],
                [COMPLAINT_STATUS.REJECTED]: [],
                [COMPLAINT_STATUS.CLOSED]: []
            },
            canEdit: ['investigation', 'customer_communication'],
            label: 'Design & Development Team'
        },
        [roles.DEVOPS]: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED],
                [COMPLAINT_STATUS.RESOLVED]: [],
                [COMPLAINT_STATUS.REJECTED]: [],
                [COMPLAINT_STATUS.CLOSED]: []
            },
            canEdit: ['investigation', 'customer_communication'],
            label: 'DevOps Team'
        },
        [roles.CLINICAL_RESEARCH]: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED],
                [COMPLAINT_STATUS.RESOLVED]: [],
                [COMPLAINT_STATUS.REJECTED]: [],
                [COMPLAINT_STATUS.CLOSED]: []
            },
            canEdit: ['investigation', 'customer_communication'],
            label: 'Clinical Research Team'
        },
        [roles.EMBEDDED_HARDWARE_FIRMWARE]: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED],
                [COMPLAINT_STATUS.RESOLVED]: [],
                [COMPLAINT_STATUS.REJECTED]: [],
                [COMPLAINT_STATUS.CLOSED]: []
            },
            canEdit: ['investigation', 'customer_communication'],
            label: 'Embedded Hardware & Firmware Team'
        },
        [roles.AI_ML_TEAM]: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED],
                [COMPLAINT_STATUS.RESOLVED]: [],
                [COMPLAINT_STATUS.REJECTED]: [],
                [COMPLAINT_STATUS.CLOSED]: []
            },
            canEdit: ['investigation', 'customer_communication'],
            label: 'AI/ML Team'
        },
        [roles.QC_TEAM]: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED],
                [COMPLAINT_STATUS.RESOLVED]: [],
                [COMPLAINT_STATUS.REJECTED]: [],
                [COMPLAINT_STATUS.CLOSED]: []
            },
            canEdit: ['investigation', 'customer_communication'],
            label: 'Quality Control Team'
        },
        [roles.SUPER_ADMIN]: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION, COMPLAINT_STATUS.REJECTED, COMPLAINT_STATUS.CLOSED],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED, COMPLAINT_STATUS.CLOSED],
                [COMPLAINT_STATUS.RESOLVED]: [COMPLAINT_STATUS.CLOSED],
                [COMPLAINT_STATUS.REJECTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.CLOSED]: []
            },
            canEdit: 'all',
            label: 'Super Administrator'
        }
    };

    // State management
    const [complaint, setComplaint] = useState<Complaint>();
    const currentUser = useAuthStore((state) => state.user);
    const [statusUpdateModal, setStatusUpdateModal] = useState<{
        show: boolean;
        targetStatus: Complaint['status'] | null;
        comments: string;
    }>({
        show: false,
        targetStatus: null,
        comments: ''
    });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeEditSection, setActiveEditSection] = useState<string | null>(null);
    const [downloadingReport, setDownloadingReport] = useState(false);
    const [investigatorDialogOpen, setInvestigatorDialogOpen] = useState(false);
    const [selectedInvestigators, setSelectedInvestigators] = useState<string[]>([]);
    const [investigatorNote, setInvestigatorNote] = useState('');
    const [hasMarkedInvestigatorRead, setHasMarkedInvestigatorRead] = useState(false);

    const {
        data: complaintData,
        isLoading,
        isError,
        isSuccess,
        refetch
    } = useComplaintWithWorkflow(params.complaintId);
    console.log('fetched complaint data>>:', complaintData);

    const { mutateAsync: assignInvestigators, isPending: isAssigningInvestigators } = useAssignInvestigators(params.complaintId);
    const { mutate: markInvestigationRead } = useMarkInvestigationAssignmentRead(params.complaintId);

    const userQueryPayload = useMemo(() => ({
        page_size: 100,
        page_index: 0,
        global_value: '',
        global_filter: [] as string[],
        sort_by: 'firstName',
        sort_order: 1,
        filters: [] as any[]
    }), []);

    const { data: assignableUsersData, isLoading: isLoadingUsers } = useGetUsers(userQueryPayload);
    const assignableUsers = useMemo(
        () => assignableUsersData?.data?.list ?? assignableUsersData?.list ?? [],
        [assignableUsersData]
    );
    const userOptions: MultiSelectOption[] = useMemo(
        () =>
            assignableUsers.map((user: any) => ({
                value: user._id,
                label: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.emailId || user._id
            })),
        [assignableUsers]
    );
    const investigatorOptions = userOptions;

    // API call to fetch complaint details
    const investigatorAssignments = useMemo(
        () => complaint?.investigation?.assignments ?? [],
        [complaint?.investigation?.assignments]
    );

    const activeInvestigationAssignments = useMemo(
        () =>
            investigatorAssignments.filter((assignment: any) => assignment?.status !== 'declined'),
        [investigatorAssignments]
    );

    const hasActiveInvestigationAssignments = useMemo(
        () => activeInvestigationAssignments.length > 0,
        [activeInvestigationAssignments]
    );

    const hasPendingInvestigationAcknowledgements = useMemo(
        () =>
            activeInvestigationAssignments.some((assignment: any) => !assignment?.read_at),
        [activeInvestigationAssignments]
    );

    const myInvestigationAssignment = useMemo(() => {
        const currentUserId = currentUser?._id;
        if (!currentUserId) return undefined;
        return investigatorAssignments.find((assignment) => {
            const assignmentUserId = typeof assignment.user === 'string'
                ? assignment.user
                : assignment.user?._id;
            return assignmentUserId === currentUserId;
        });
    }, [investigatorAssignments, currentUser?._id]);

    useEffect(() => {
        console.log('Complaint Data Effect:', complaintData, isSuccess);
        if (isSuccess && complaintData) {
            console.log('Fetched Complaint Data:', complaintData);
            setComplaint(complaintData);
        }
    }, [complaintData, isSuccess]);

    useEffect(() => {
        if (!investigatorDialogOpen) {
            setInvestigatorNote('');
            setSelectedInvestigators([]);
        }
    }, [investigatorDialogOpen]);

    useEffect(() => {
        if (!complaint || !currentUser?._id) return;

        if (myInvestigationAssignment && !myInvestigationAssignment.read_at && !hasMarkedInvestigatorRead) {
            markInvestigationRead();
            setHasMarkedInvestigatorRead(true);
        }
    }, [
        complaint,
        currentUser?._id,
        hasMarkedInvestigatorRead,
        markInvestigationRead,
        myInvestigationAssignment
    ]);

    useEffect(() => {
        if (!complaint) return;

        if (myInvestigationAssignment && !myInvestigationAssignment.read_at) {
            setHasMarkedInvestigatorRead(false);
        }
    }, [complaint, myInvestigationAssignment]);

    const permissionChecker = buildCan(currentUser);

    // Helper functions
    const getUserRole = (user: UserData | null | undefined): roles | null =>
        normalizeRole(user?.role?.[0]);
    const getRoleConfig = (role: roles | null) =>
        role ? ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] : undefined;
    const permissionKeyForStatus = (status: Complaint['status']) =>
        `complaint.transition.${status.toLowerCase()}`;
    const mapButtonVariant = (variant: string): 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' => {
        if (variant === 'destructive' || variant === 'outline' || variant === 'secondary' || variant === 'ghost' || variant === 'link') {
            return variant;
        }
        return 'default';
    };

    const mapBadgeVariant = (variant: string): React.ComponentProps<typeof Badge>['variant'] => {
        if (variant === 'destructive' || variant === 'outline' || variant === 'secondary') {
            return variant;
        }
        return 'default';
    };

    const getAvailableTransitions = (): Complaint['status'][] => {
        if (!complaint) return [];
        const userRole = getUserRole(currentUser);
        const roleConfig = getRoleConfig(userRole);
        console.log('User Role:', userRole,complaint.status);
        const allowedTransitions = roleConfig?.canTransitionTo[complaint.status] || [];
        const allStatuses = Object.values(COMPLAINT_STATUS) as Complaint['status'][];
        const permissionFiltered = allStatuses
            .filter((status) => status !== complaint.status) // do not offer current status (e.g., SUBMITTED when already there)
            .filter((status) =>
                permissionChecker(permissionKeyForStatus(status), () =>
                    (allowedTransitions as Complaint['status'][]).includes(status)
                )
            );
        console.log('Allowed Transitions:', permissionFiltered);
        return permissionFiltered;
    };

    const investigationFormDefaults = useMemo(() => {
        const investigation = complaint?.investigation;
        if (!investigation) return undefined;

        const rootCause = investigation.root_cause
            ? (
                investigation.root_cause.identified === 'Other'
                    ? {
                        identified: 'Other' as const,
                        description: investigation.root_cause.description ?? '',
                    }
                    : {
                        identified: investigation.root_cause.identified,
                        ...(investigation.root_cause.description
                            ? { description: investigation.root_cause.description }
                            : {}),
                    }
            ) as InvestigationFormData['root_cause']
            : undefined;

        const defaults: Partial<InvestigationFormData> & {
            completion_details?: {
                name: string;
                signature: string;
                date?: Date;
            };
        } = {
            investigation_date: investigation.investigation_date
                ? new Date(investigation.investigation_date)
                : undefined,
            root_cause: rootCause,
            capa: {
                initiated: Boolean(investigation.capa?.initiated),
                number: investigation.capa?.number ?? undefined,
            },
        };

        if (investigation.completion_details) {
            defaults.completion_details = {
                ...investigation.completion_details,
                date: investigation.completion_details.date
                    ? new Date(investigation.completion_details.date)
                    : undefined,
            };
        }

        return defaults;
    }, [complaint?.investigation]);

    const investigationFormProps = complaint
        ? {
            complaintId: complaint._id,
            defaultValues: investigationFormDefaults,
            onSuccess: async () => {
                await refetch();
            },
        }
        : null;

    const closureFormDefaults = useMemo(() => {
        const closure = complaint?.closure;
        if (!closure) return undefined;

        const defaults: Partial<ComplaintClosureFormData> = {
            final_disposition: closure.final_disposition,
            final_disposition_other: closure.final_disposition_other ?? '',
            reviewed_by: closure.reviewed_by,
        };

        if (closure.approved_by?.date) {
            defaults.approved_by = {
                qa_head_name: closure.approved_by.qa_head_name,
                signature: closure.approved_by.signature,
                date: new Date(closure.approved_by.date),
            };
        }

        return defaults;
    }, [complaint?.closure]);

    const resolveAssignmentUserId = (assignmentUser: any) => {
        if (!assignmentUser) return null;
        if (typeof assignmentUser === 'string') return assignmentUser;
        return assignmentUser?._id ?? assignmentUser?.id ?? null;
    };

    const extractId = (value: any): string | null => {
        if (!value) return null;
        if (typeof value === 'string') return value;
        const candidate = value?._id ?? value?.id ?? null;
        return typeof candidate === 'string' ? candidate : candidate?.toString?.() ?? null;
    };

    const normalizeId = (value: any): string | null => {
        if (!value) return null;
        if (typeof value === 'string') return value;
        return value?.toString?.() ?? null;
    };

    const isComplaintEditable = useMemo(() => {
        const currentUserId = normalizeId(currentUser?._id);
        if (!complaint || !currentUserId) return false;
        const createdById = extractId((complaint as any).created_by ?? (complaint as any).createdBy);
        if (!createdById) return false;
        return complaint.status === COMPLAINT_STATUS.SUBMITTED && normalizeId(createdById) === currentUserId;
    }, [complaint, currentUser?._id]);

    const complaintFormDefaults = useMemo(() => {
        if (!complaint) return undefined;
        const issueDetails = complaint.issue_details ?? {};
        const normalizedIssueDetails = {
            description: issueDetails.description ?? '',
            problem_start_date: issueDetails.problem_start_date ?? '',
            occurred_before: (issueDetails.occurred_before as 'Yes' | 'No' | undefined) ?? 'No',
            replication_steps:
                issueDetails.replication_steps === null || issueDetails.replication_steps === undefined
                    ? ''
                    : issueDetails.replication_steps,
        };
        const prevContact = complaint.previous_contact ?? {};
        const customerActions = complaint.customer_actions ?? {};
        return {
            customer: complaint.customer ?? {},
            product_details: {
                ...(complaint.product_details ?? {}),
                purchase_date: complaint.product_details?.purchase_date || ''
            },
            complaint_type: complaint.complaint_type ?? {
                name: '',
                description: '',
                config: {
                    _id: '',
                    name: '',
                    type: 'COMPLAINT_TYPE',
                },
            },
            issue_details: normalizedIssueDetails,
            customer_impact: complaint.customer_impact ?? '',
            previous_contact: {
                reported_before: (prevContact.reported_before as 'Yes' | 'No' | undefined) ?? 'No',
                reference_number: prevContact.reference_number ?? '',
                contact_date: prevContact.contact_date ?? '',
                person_contacted: prevContact.person_contacted ?? '',
            },
            customer_actions: {
                troubleshooting_done: (customerActions.troubleshooting_done as 'Yes' | 'No' | undefined) ?? 'No',
                troubleshooting_description: customerActions.troubleshooting_description ?? '',
            },
            preferred_resolution_method: complaint.preferred_resolution_method ?? {
                name: '',
                description: '',
                config: {
                    _id: '',
                    name: '',
                    type: 'RESOLUTION_METHOD',
                },
            },
            replacement_details: complaint.replacement_details ?? {},
            attachments: (complaint.attachments ?? []) as string[],
        };
    }, [complaint]);

    const initialAttachmentPaths = useMemo(() => (complaint?.attachments ?? []) as string[], [complaint?.attachments]);

    const isAssignedInvestigator = complaint?.investigation?.assignments?.some((assignment: any) => {
        const assignmentUserId = resolveAssignmentUserId(assignment?.user);
        const currentUserId = currentUser?._id;
        return assignmentUserId && currentUserId && assignmentUserId.toString() === currentUserId;
    }) ?? false;

    const [isUpdatingComplaint, setIsUpdatingComplaint] = useState(false);
    const [isDeletingComplaint, setIsDeletingComplaint] = useState(false);

    const canEditSection = (section:string) => {
        console.log('Checking edit permission for section:', section);

        const userRole = getUserRole(currentUser);
        const roleConfig = getRoleConfig(userRole);

        const legacyAllowed = () => {
            if (section === 'investigation') {
                if (!currentUser) return false;
                if (userRole === roles.QA) return true;
                return isAssignedInvestigator;
            }
            if (!roleConfig) return false;
            if (roleConfig.canEdit === 'all') return true;
            return Array.isArray(roleConfig.canEdit) ? roleConfig.canEdit.includes(section) : false;
        };

        return permissionChecker(`complaint.edit.${section}`, legacyAllowed);
    };

    const customerCommunicationFormDefaults = useMemo((): Partial<CustomerCommunicationFormData> => {
        if (!complaint) return {}

        const defaults: Partial<CustomerCommunicationFormData> = {
            summary: complaint.customer_communication?.summary ?? '',
            risk_management: {
                update_required: complaint.risk_management?.update_required ?? false,
                details: complaint.risk_management?.details ?? '',
            },
        }

        if (complaint.customer_communication?.response_date) {
            defaults.response_date = new Date(complaint.customer_communication.response_date)
        }

        if (complaint.customer_communication?.mode) {
            defaults.mode = complaint.customer_communication.mode as CustomerCommunicationFormData['mode']
        }

        return defaults
    }, [complaint])

    const preferredResolutionName = (
        complaint?.preferred_resolution_method?.config?.name || complaint?.preferred_resolution_method?.name || ''
    ).toLowerCase();
    const resolutionMatches = {
        replacement: preferredResolutionName.includes('replacement'),
        refund: preferredResolutionName.includes('refund'),
        technical: preferredResolutionName.includes('technical'),
        furtherInvestigation: preferredResolutionName.includes('further') || preferredResolutionName.includes('investigation'),
    };
    const resolutionOtherSelected =
        preferredResolutionName.includes('other') || (!Object.values(resolutionMatches).includes(true) && !!preferredResolutionName);
    const resolutionOtherDescription = complaint?.preferred_resolution_method?.description ?? '';
    const selectedResolutionOptions = useMemo(() => {
        const labels: string[] = [];
        if (resolutionMatches.replacement) labels.push('Replacement');
        if (resolutionMatches.refund) labels.push('Refund');
        if (resolutionMatches.technical) labels.push('Technical assistance');
        if (resolutionMatches.furtherInvestigation) labels.push('Further investigation');
        if (resolutionOtherSelected) labels.push(resolutionOtherDescription || 'Other');
        if (!labels.length && preferredResolutionName) {
            labels.push(complaint?.preferred_resolution_method?.name ?? preferredResolutionName);
        }
        return labels;
    }, [
        resolutionMatches.replacement,
        resolutionMatches.refund,
        resolutionMatches.technical,
        resolutionMatches.furtherInvestigation,
        resolutionOtherSelected,
        resolutionOtherDescription,
        preferredResolutionName,
        complaint?.preferred_resolution_method?.name,
    ]);

    const customerCommunicationFormProps = complaint
        ? {
            complaintId: complaint._id,
            defaultValues: customerCommunicationFormDefaults,
            canEditRiskManagement: canEditSection('risk_management'),
            onSuccess: async () => {
                await refetch();
            },
        }
        : null;

    const getUserDisplayName = (user: any) => {
        if (!user) return 'Unassigned';
        if (typeof user === 'string') {
            const matchedUser = assignableUsers.find((existingUser: any) => existingUser._id === user);
            if (matchedUser) {
                return `${matchedUser.firstName ?? ''} ${matchedUser.lastName ?? ''}`.trim() || matchedUser.emailId || matchedUser._id;
            }
            return user;
        }
        return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.emailId || user._id;
    };

    const currentUserRole = getUserRole(currentUser);
    const currentUserFirstName = currentUser?.firstName ?? '';
    const currentUserLastName = currentUser?.lastName ?? '';
    const currentUserDisplayName = currentUser
        ? `${currentUserFirstName} ${currentUserLastName}`.trim() || currentUser.emailId || 'Unknown user'
        : 'Unknown user';
    const currentUserRoleLabel = currentUserRole
        ? getRoleConfig(currentUserRole)?.label || formatRoleLabel(currentUserRole) || 'User'
        : 'User';

    const canAssignInvestigators = permissionChecker('complaint.assign.investigators', () =>
        currentUserRole ? INVESTIGATOR_ASSIGN_ROLES.includes(currentUserRole) : false
    );

    const handleAssignInvestigators = async () => {
        if (!selectedInvestigators.length) {
            toast.error('Select at least one investigator.');
            return;
        }

        try {
            await assignInvestigators({
                assignees: selectedInvestigators.map((userId) => ({ userId, note: investigatorNote }))
            });
            toast.success('Investigators assigned successfully');
            setInvestigatorDialogOpen(false);
            setSelectedInvestigators([]);
            setInvestigatorNote('');
            await refetch();
        } catch (error) {
            showApiErrorToast(error as Error);
        }
    };

    // API calls for status updates
    const {mutateAsync:reciverInfo, isPending:isUpdatingReceivedInfo} = useUpdateReceivedInfo(params.complaintId);
    const {mutateAsync: statusTransition, isPending:isStatusTransitionPending} = useTransitionComplaintStatus(params.complaintId);
    const isStatusUpdating = isUpdatingReceivedInfo || isStatusTransitionPending;

    const handleReportDownload = async () => {
        if (!complaint?._id) return;
        try {
            setDownloadingReport(true);
            const blob = await complaintsApi.downloadComplaintReport(complaint._id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `complaint-${complaint.complaint_number ?? complaint._id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download complaint report', error);
            toast.error('Failed to download complaint report. Please try again.');
        } finally {
            setDownloadingReport(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!statusUpdateModal.targetStatus || !complaint) return;

        const targetStatus = statusUpdateModal.targetStatus;
        const comments = statusUpdateModal.comments?.trim() || `Status updated to ${targetStatus}`;

        try {
            if (targetStatus === COMPLAINT_STATUS.UNDER_INVESTIGATION && currentUser) {
                await reciverInfo({
                    receiver_name: currentUserDisplayName,
                    receiver_role: currentUserRole ?? '',
                    received_date: new Date().toISOString()
                });
            } else {
                await statusTransition({
                    newStatus: targetStatus,
                    comments
                });
            }

            setStatusUpdateModal({ show: false, targetStatus: null, comments: '' });
            await refetch();
        } catch (error) {
            console.error('Failed to update complaint status', error);
            // toast.error('Failed to update status. Please try again.');
        }
    };

    const handleComplaintUpdate = async (payload: any) => {
        if (!complaint?._id) return;
        setIsUpdatingComplaint(true);
        try {
            await complaintsApi.updateComplaint(complaint._id, payload);
            toast.success('Complaint updated successfully.');
            setDrawerOpen(false);
            setActiveEditSection(null);
            await refetch();
        } catch (error) {
            console.error('Failed to update complaint', error);
            showApiErrorToast(error);
        } finally {
            setIsUpdatingComplaint(false);
        }
    };

    const handleComplaintDelete = async () => {
        if (!complaint?._id || currentUserRole !== roles.SUPER_ADMIN) return;
        const confirmed = typeof window !== 'undefined'
            ? window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')
            : false;
        if (!confirmed) return;

        setIsDeletingComplaint(true);
        try {
            await complaintsApi.deleteComplaint(complaint._id);
            toast.success('Complaint deleted successfully.');
            router.push('/dashboard/complaints');
        } catch (error) {
            console.error('Failed to delete complaint', error);
            showApiErrorToast(error);
        } finally {
            setIsDeletingComplaint(false);
        }
    };

    // Status update modal
    const StatusUpdateModal = () => {
        if (!statusUpdateModal.show || !statusUpdateModal.targetStatus || !complaint) return null;

        const targetConfig = STAGE_CONFIG[statusUpdateModal.targetStatus];
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md mx-4">
                    <CardHeader>
                        <CardTitle>Update Status to {targetConfig.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Complaint: {complaint.complaint_number}
                        </p>
                        {/*<Textarea*/}
                        {/*    value={statusUpdateModal.comments}*/}
                        {/*    onChange={(e) => setStatusUpdateModal(prev => ({ ...prev, comments: e.target.value }))}*/}
                        {/*    placeholder="Add comments about this status change..."*/}
                        {/*    rows={4}*/}
                        {/*/>*/}

                        <div className="flex space-x-3">
                            <Button
                                // onClick={() => updateComplaintStatus(statusUpdateModal.targetStatus, statusUpdateModal.comments)}
                                onClick={() => handleStatusUpdate()}
                                variant={mapButtonVariant(targetConfig.variant)}
                                disabled={isStatusUpdating}
                            >
                                {isStatusUpdating ? 'Updating...' : 'Update Status'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setStatusUpdateModal({ show: false, targetStatus: null, comments: '' })}
                            >
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    if (isLoading && !complaint) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    console.log('Complaint Data:', complaint,isError,isSuccess);
    if (!complaint && (isError || isSuccess)) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Complaint not found</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!complaint) {
        return null;
    }

    const safeText = (value?: unknown) => {
        if (value === null || value === undefined) return '—';
        const stringValue = String(value).trim();
        return stringValue.length > 0 ? stringValue : '—';
    };

    const formatDateSafe = (value?: string | null) => (value ? formatDate(value) : '—');
    const formatDateTimeSafe = (value?: string | null) => (value ? formatDateTime(value) : '—');

    const renderCheckboxLine = (label: string, checked: boolean, trailing?: React.ReactNode) => (
        <div className="flex items-start text-sm" key={label}>
            <span className="mr-2 text-base leading-5">{checked ? '☑' : '☐'}</span>
            <span className="text-sm">{label}{trailing}</span>
        </div>
    );

    const normalizeYesNo = (value: unknown): 'yes' | 'no' | null => {
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (["yes", "y", "true", "1"].includes(normalized)) return 'yes';
            if (["no", "n", "false", "0"].includes(normalized)) return 'no';
        }
        if (typeof value === 'boolean') {
            return value ? 'yes' : 'no';
        }
        return null;
    };

    const complaintTypeName = complaint?.complaint_type?.name?.toLowerCase?.() ?? '';
    const complaintTypeConfigName = complaint?.complaint_type?.config?.name?.toLowerCase?.() ?? '';
    const natureMatches = {
        performance: complaintTypeName.includes('performance'),
        faulty: complaintTypeName.includes('faulty'),
        installation: complaintTypeName.includes('installation') || complaintTypeName.includes('setup'),
        communication: complaintTypeName.includes('communication') || complaintTypeName.includes('connectivity'),
        ui: complaintTypeName.includes('interface') || complaintTypeName.includes('ui'),
    };
    const natureOtherSelected = complaintTypeConfigName === 'other' || (!Object.values(natureMatches).includes(true) && !!complaintTypeName);
    const natureOtherDescription = safeText(complaint?.complaint_type?.description);

    const issueOccurred = normalizeYesNo(complaint?.issue_details?.occurred_before);
    const reportedBefore = normalizeYesNo(complaint?.previous_contact?.reported_before);
    const troubleshootingAttempted = normalizeYesNo(complaint?.customer_actions?.troubleshooting_done);

    const attachments = Array.isArray(complaint?.attachments) ? complaint.attachments : [];
    const riskUpdateRequired = Boolean(complaint.risk_management?.update_required);
    const riskDetails = complaint.risk_management?.details ?? '';

    const handleEditClick = (section: string) => {
        setActiveEditSection(section);
        setDrawerOpen(true);
    };

    const renderDrawerContent = () => {
        if (!complaint) return null;
        switch (activeEditSection) {
            case "details":
                return (
                    <div className="container mx-auto flex-1 overflow-y-auto mb-2">
                        <ComplaintForm
                            mode="edit"
                            defaultValues={complaintFormDefaults}
                            initialAttachments={initialAttachmentPaths}
                            onSubmitOverride={handleComplaintUpdate}
                            submitLabel={isUpdatingComplaint ? 'Updating...' : 'Update Complaint'}
                            loading={isUpdatingComplaint}
                        />
                    </div>
                );
            case "investigation":
                return (
                    <div className="container mx-auto flex-1 overflow-y-auto mb-2">
                        {investigationFormProps && <InvestigationForm {...investigationFormProps} />}
                    </div>
                );
            case "customer_communication":
                return (
                    <div className="container mx-auto flex-1 overflow-y-auto mb-2">
                        {customerCommunicationFormProps && (
                            <CustomerCommunicationForm {...customerCommunicationFormProps} />
                        )}
                    </div>
                );
                // return <div className="p-4">Communication Form</div>;
            case "history":
                return <div className="p-4">History Notes Form</div>;
            case COMPLAINT_STATUS.CLOSED:
                return <div className="container mx-auto flex-1 overflow-y-auto mb-2">
                    <ComplaintClosureForm
                        complaintId={complaint._id}
                        defaultValues={closureFormDefaults}
                        investigators={complaint.investigation?.investigating_officers ?? []}
                        assignments={complaint.investigation?.assignments ?? []}
                        onSuccess={async () => {
                            try {
                                setDrawerOpen(false);
                                setActiveEditSection(null);
                                await statusTransition({
                                    newStatus: COMPLAINT_STATUS.CLOSED,
                                    comments: `Complaint closed by ${currentUserDisplayName}`.trim()
                                });
                                await refetch();
                            } catch (error) {
                                console.error('Failed to close complaint', error);
                                toast.error('Failed to update complaint status to closed.');
                            }
                        }}
                    />
                </div>;
            default:
                return null;
        }
    };

    const currentStageConfig = STAGE_CONFIG[complaint.status];
    const rawTransitions = getAvailableTransitions();
    const shouldBlockResolution = (!hasActiveInvestigationAssignments || hasPendingInvestigationAcknowledgements)
        && rawTransitions.includes(COMPLAINT_STATUS.RESOLVED);
    const availableTransitions = shouldBlockResolution
        ? rawTransitions.filter((status) => status !== COMPLAINT_STATUS.RESOLVED)
        : rawTransitions;
    const isResolutionBlockedByInvestigation = shouldBlockResolution;
    const resolutionBlockMessage = !hasActiveInvestigationAssignments
        ? 'Assign at least one investigation officer before resolving the complaint.'
        : 'Waiting for all investigation officers to acknowledge the complaint before resolving.';
    const isReportDownloadAvailable = (
        [
            COMPLAINT_STATUS.RESOLVED,
            COMPLAINT_STATUS.CLOSED
        ] as ComplaintStatus[]
    ).includes(complaint.status);

    const deadlines = complaint.deadlines;

    const formatDeadlineDate = (date?: string | null) => (date ? formatDate(date) : '—');

    const getDeadlineStatusMeta = (deadline?: DeadlineSummary) => {
        if (!deadline || !deadline.startDate) {
            return {
                label: 'Not Started',
                variant: 'outline' as const,
                message: 'Timeline will begin once work is assigned.',
                highlightClass: '',
            };
        }

        const remaining = deadline.workingDaysRemaining ?? 0;
        const remainingLabel = formatWorkingDuration(Math.max(remaining, 0));
        const overdueLabel = formatWorkingDuration(deadline.overdueBy ?? Math.abs(remaining));
        switch (deadline.status) {
            case 'overdue':
                return {
                    label: 'Overdue',
                    variant: 'destructive' as const,
                    message: `${overdueLabel} overdue.`,
                    highlightClass: 'text-destructive font-semibold',
                };
            case 'due_soon':
                return {
                    label: 'Due Soon',
                    variant: 'secondary' as const,
                    message: `${remainingLabel} left.`,
                    highlightClass: 'text-amber-600 font-medium',
                };
            case 'on_track':
                return {
                    label: 'On Track',
                    variant: 'secondary' as const,
                    message: `${remainingLabel} left.`,
                    highlightClass: '',
                };
            default:
                return {
                    label: 'Not Started',
                    variant: 'outline' as const,
                    message: 'Timeline will begin once work is assigned.',
                    highlightClass: '',
                };
        }
    };

    const renderDeadlineCard = (title: string, deadline?: DeadlineSummary, limit?: number) => {
        const meta = getDeadlineStatusMeta(deadline);
        const workingDaysUsed = Math.max(deadline?.workingDaysUsed ?? 0, 0);
        const workingDaysAllotted = deadline?.workingDaysAllotted ?? limit ?? 0;
        const remaining = deadline?.workingDaysRemaining ?? null;

        return (
            <Card>
                <CardHeader className="flex items-center justify-between pb-4">
                    <CardTitle className="text-base font-semibold">{title}</CardTitle>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Due Date</span>
                        <span className="font-medium">{formatDeadlineDate(deadline?.dueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Working Days Used</span>
                        <span>{workingDaysUsed} / {workingDaysAllotted}</span>
                    </div>
                    {remaining !== null && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Remaining</span>
                            <span className={meta.highlightClass}>
                                {remaining < 0
                                    ? `${formatWorkingDuration(Math.abs(remaining))} overdue`
                                    : `${formatWorkingDuration(remaining)} left`}
                            </span>
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground leading-5">{meta.message}</p>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                        <h1 className="text-2xl font-bold">{complaint.complaint_number}</h1>
                        <Badge variant={mapBadgeVariant(currentStageConfig.variant)}>
                            <currentStageConfig.icon className="h-3 w-3 mr-1" />
                            {currentStageConfig.name}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">{currentStageConfig.description}</p>
                </div>

                <div className="flex flex-col items-end space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{currentUserDisplayName}</span>
                        <Badge variant="outline">{currentUserRoleLabel}</Badge>
                    </div>
                    {currentUserRole === roles.SUPER_ADMIN && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleComplaintDelete}
                            disabled={isDeletingComplaint}
                        >
                            {isDeletingComplaint ? 'Deleting...' : 'Delete Complaint'}
                        </Button>
                    )}
                    {isComplaintEditable && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center"
                            onClick={() => handleEditClick("details")}
                        >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Complaint
                        </Button>
                    )}
                    {isReportDownloadAvailable && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReportDownload}
                            disabled={downloadingReport}
                            className="flex items-center"
                        >
                            {downloadingReport ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Preparing Report...
                                </>
                            ) : (
                                <>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Download Report
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {deadlines && (
                <Card className="bg-muted/40">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Timeline Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            {renderDeadlineCard('Investigation Deadline', deadlines.investigation, INVESTIGATION_LIMIT)}
                            {renderDeadlineCard('Closure Deadline', deadlines.closure, CLOSURE_LIMIT)}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Action Buttons */}
            {(availableTransitions.length > 0 || isResolutionBlockedByInvestigation) && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-medium">Available Actions:</span>
                            {availableTransitions.map(status => {
                                const config = STAGE_CONFIG[status];
                                return (
                                    <Button
                                        key={status}
                                        variant={mapButtonVariant(config.variant)}
                                        size="sm"
                                        onClick={() => status === COMPLAINT_STATUS.CLOSED ? handleEditClick(COMPLAINT_STATUS.CLOSED) : setStatusUpdateModal({ show: true, targetStatus: status, comments: '' })}
                                    >
                                        <config.icon className="h-4 w-4 mr-2" />
                                        Move to {config.name}
                                    </Button>
                                );
                            })}
                            {isResolutionBlockedByInvestigation && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    {resolutionBlockMessage}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Content */}
            {/*<Tabs defaultValue="details" className="space-y-4">*/}
            {/*    <TabsList className="grid w-full grid-cols-4">*/}
            {/*        <TabsTrigger value="details">Complaint Details</TabsTrigger>*/}
            {/*        <TabsTrigger value="investigation">Investigation</TabsTrigger>*/}
            {/*        <TabsTrigger value="communication">Communication</TabsTrigger>*/}
            {/*        <TabsTrigger value="history">History</TabsTrigger>*/}
            {/*    </TabsList>*/}

            {/*    /!* Complaint Details Tab *!/*/}
            {/*    <TabsContent value="details" className="space-y-6">*/}
            {/*        /!* Customer Information *!/*/}
            {/*        <Card>*/}
            {/*            <CardHeader className="flex flex-row items-center justify-between">*/}
            {/*                <CardTitle className="flex items-center">*/}
            {/*                    <User className="h-5 w-5 mr-2" />*/}
            {/*                    Customer Information*/}
            {/*                </CardTitle>*/}
            {/*                /!*{canEditSection('customer') && (*!/*/}
            {/*                /!*    <Button variant="ghost" size="sm">*!/*/}
            {/*                /!*        <Edit3 className="h-4 w-4" />*!/*/}
            {/*                /!*    </Button>*!/*/}
            {/*                /!*)}*!/*/}
            {/*            </CardHeader>*/}
            {/*            <CardContent className="grid md:grid-cols-2 gap-4">*/}
            {/*                <div className="space-y-2">*/}
            {/*                    <div className="flex items-center text-sm">*/}
            {/*                        <User className="h-4 w-4 mr-2 text-muted-foreground" />*/}
            {/*                        <span className="font-medium">Name:</span>*/}
            {/*                        <span className="ml-2">{complaint.customer.name}</span>*/}
            {/*                    </div>*/}
            {/*                    <div className="flex items-center text-sm">*/}
            {/*                        <Building className="h-4 w-4 mr-2 text-muted-foreground" />*/}
            {/*                        <span className="font-medium">Company:</span>*/}
            {/*                        <span className="ml-2">{complaint.customer.company}</span>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*                <div className="space-y-2">*/}
            {/*                    <div className="flex items-center text-sm">*/}
            {/*                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />*/}
            {/*                        <span className="font-medium">Contact:</span>*/}
            {/*                        <span className="ml-2">{complaint.customer.contact_number}</span>*/}
            {/*                    </div>*/}
            {/*                    <div className="flex items-center text-sm">*/}
            {/*                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />*/}
            {/*                        <span className="font-medium">Email:</span>*/}
            {/*                        <span className="ml-2">{complaint.customer.email}</span>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*            </CardContent>*/}
            {/*        </Card>*/}

            {/*        /!* Product Details *!/*/}
            {/*        <Card>*/}
            {/*            <CardHeader>*/}
            {/*                <CardTitle className="flex items-center">*/}
            {/*                    <Package className="h-5 w-5 mr-2" />*/}
            {/*                    Product Information*/}
            {/*                </CardTitle>*/}
            {/*            </CardHeader>*/}
            {/*            <CardContent className="grid md:grid-cols-2 gap-4">*/}
            {/*                <div className="space-y-2">*/}
            {/*                    <div className="text-sm">*/}
            {/*                        <span className="font-medium">Model:</span>*/}
            {/*                        <span className="ml-2">{complaint.product_details.model}</span>*/}
            {/*                    </div>*/}
            {/*                    <div className="text-sm">*/}
            {/*                        <span className="font-medium">Serial Number:</span>*/}
            {/*                        <span className="ml-2 font-mono">{complaint.product_details.serial_number}</span>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*                <div className="space-y-2">*/}
            {/*                    <div className="flex items-center text-sm">*/}
            {/*                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />*/}
            {/*                        <span className="font-medium">Purchase Date:</span>*/}
            {/*                        <span className="ml-2">{new Date(complaint.product_details.purchase_date).toLocaleDateString()}</span>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*            </CardContent>*/}
            {/*        </Card>*/}

            {/*        /!* Issue Details *!/*/}
            {/*        <Card>*/}
            {/*            <CardHeader>*/}
            {/*                <CardTitle className="flex items-center">*/}
            {/*                    <AlertTriangle className="h-5 w-5 mr-2" />*/}
            {/*                    Issue Details*/}
            {/*                </CardTitle>*/}
            {/*            </CardHeader>*/}
            {/*            <CardContent className="space-y-4">*/}
            {/*                <div>*/}
            {/*                    <span className="font-medium text-sm">Description:</span>*/}
            {/*                    <p className="mt-1 text-sm text-muted-foreground">{complaint.issue_details.description}</p>*/}
            {/*                </div>*/}
            {/*                <div className="grid md:grid-cols-2 gap-4">*/}
            {/*                    <div>*/}
            {/*                        <span className="font-medium text-sm">Problem Start Date:</span>*/}
            {/*                        <p className="text-sm text-muted-foreground">*/}
            {/*                            {new Date(complaint.issue_details.problem_start_date).toLocaleDateString()}*/}
            {/*                        </p>*/}
            {/*                    </div>*/}
            {/*                    <div>*/}
            {/*                        <span className="font-medium text-sm">Occurred Before:</span>*/}
            {/*                        <p className="text-sm text-muted-foreground">{complaint.issue_details.occurred_before}</p>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*                {complaint.issue_details.replication_steps && (*/}
            {/*                    <div>*/}
            {/*                        <span className="font-medium text-sm">Replication Steps:</span>*/}
            {/*                        <pre className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">*/}
            {/*        {complaint.issue_details.replication_steps}*/}
            {/*      </pre>*/}
            {/*                    </div>*/}
            {/*                )}*/}
            {/*            </CardContent>*/}
            {/*        </Card>*/}
            {/*    </TabsContent>*/}

            {/*    /!* Investigation Tab *!/*/}
            {/*    <TabsContent value="investigation">*/}
            {/*        <Card>*/}
            {/*            <CardHeader className="flex flex-row items-center justify-between">*/}
            {/*                <CardTitle>Investigation Details</CardTitle>*/}
            {/*                {canEditSection('investigation') && (*/}
            {/*                    <Button variant="ghost" size="sm" onClick={() => handleEditClick("investigation")}>*/}
            {/*                        <Edit3 className="h-4 w-4" />*/}
            {/*                    </Button>*/}
            {/*                )}*/}
            {/*            </CardHeader>*/}
            {/*            <CardContent>*/}
            {/*                {complaint.status === COMPLAINT_STATUS.SUBMITTED ? (*/}
            {/*                    <Alert>*/}
            {/*                        <Clock className="h-4 w-4" />*/}
            {/*                        <AlertDescription>*/}
            {/*                            Investigation will begin once complaint is moved to "Under Investigation" status.*/}
            {/*                        </AlertDescription>*/}
            {/*                    </Alert>*/}
            {/*                ) : (*/}
            {/*                    <div className="space-y-4">*/}
            {/*                        <div className="text-sm text-muted-foreground">*/}
            {/*                            Investigation details will be populated here based on the complaint status and user permissions.*/}
            {/*                        </div>*/}
            {/*                    </div>*/}
            {/*                )}*/}
            {/*            </CardContent>*/}
            {/*        </Card>*/}
            {/*    </TabsContent>*/}

            {/*    /!* Communication Tab *!/*/}
            {/*    <TabsContent value="communication">*/}
            {/*        <Card>*/}
            {/*            <CardHeader className="flex flex-row items-center justify-between">*/}
            {/*                <CardTitle>Customer Communication</CardTitle>*/}
            {/*                {canEditSection('customer_communication') && (*/}
            {/*                    <Button variant="ghost" size="sm" onClick={() => handleEditClick("customer_communication")}>*/}
            {/*                        <Edit3 className="h-4 w-4" />*/}
            {/*                    </Button>*/}
            {/*                )}*/}
            {/*            </CardHeader>*/}
            {/*            <CardContent>*/}
            {/*                <div className="text-sm text-muted-foreground">*/}
            {/*                    Customer communication history and details will be displayed here.*/}
            {/*                </div>*/}
            {/*            </CardContent>*/}
            {/*        </Card>*/}
            {/*    </TabsContent>*/}

            {/*    /!* History Tab *!/*/}
            {/*    <TabsContent value="history">*/}
            {/*        <Card>*/}
            {/*            <CardHeader>*/}
            {/*                <CardTitle className="flex items-center">*/}
            {/*                    <MessageSquare className="h-5 w-5 mr-2" />*/}
            {/*                    Status History*/}
            {/*                </CardTitle>*/}
            {/*            </CardHeader>*/}
            {/*            <CardContent>*/}
            {/*                <div className="space-y-4">*/}
            {/*                    {complaint.status_history.map((entry, index) => {*/}
            {/*                        const stageConfig = STAGE_CONFIG[entry.status];*/}
            {/*                        const StageIcon = stageConfig.icon;*/}
            {/*                        return (*/}
            {/*                            <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">*/}
            {/*                                <div className="flex-shrink-0">*/}
            {/*                                    <Badge variant={stageConfig.variant}>*/}
            {/*                                        <StageIcon className="h-3 w-3 mr-1" />*/}
            {/*                                        {stageConfig.name}*/}
            {/*                                    </Badge>*/}
            {/*                                </div>*/}
            {/*                                <div className="flex-1 space-y-1">*/}
            {/*                                    <div className="flex items-center text-sm text-muted-foreground">*/}
            {/*                                        <Calendar className="h-4 w-4 mr-1" />*/}
            {/*                                        {new Date(entry.changed_at).toLocaleDateString()} at {new Date(entry.changed_at).toLocaleTimeString()}*/}
            {/*                                    </div>*/}
            {/*                                    {entry.comments && (*/}
            {/*                                        <p className="text-sm">{entry.comments}</p>*/}
            {/*                                    )}*/}
            {/*                                </div>*/}
            {/*                            </div>*/}
            {/*                        );*/}
            {/*                    })}*/}
            {/*                </div>*/}
            {/*            </CardContent>*/}
            {/*        </Card>*/}
            {/*    </TabsContent>*/}
            {/*</Tabs>*/}
            <Tabs defaultValue="details" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">Complaint Details</TabsTrigger>
                    <TabsTrigger value="investigation">Investigation</TabsTrigger>
                    <TabsTrigger value="communication">Communication</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                {/* Complaint Details Tab */}
                <TabsContent value="details" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Complaint Form</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">Date of Complaint Submission:</span>
                                <span className="ml-2">{formatDateSafe(complaint.submission_date)}</span>
                            </div>
                            <div>
                                <span className="font-medium">Date:</span>
                                <span className="ml-2">{formatDateSafe(complaint.created_on || complaint.submission_date)}</span>
                            </div>
                            <div>
                                <span className="font-medium">Complaint No:</span>
                                <span className="ml-2">{safeText(complaint.complaint_number)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User className="h-5 w-5 mr-2" />
                                Customer Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                                <div>
                                    <span className="font-medium">Customer Name:</span>
                                    <span className="ml-2">{safeText(complaint.customer?.name)}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Company (if applicable):</span>
                                    <span className="ml-2">{safeText(complaint.customer?.company)}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <span className="font-medium">Contact Number:</span>
                                    <span className="ml-2">{safeText(complaint.customer?.contact_number)}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Email Address:</span>
                                    <span className="ml-2">{safeText(complaint.customer?.email)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Package className="h-5 w-5 mr-2" />
                                Product Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                                <div>
                                    <span className="font-medium">Product Name/Model:</span>
                                    <span className="ml-2">{safeText(complaint.product_details?.model)}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Product Unique identifier/Batch no.:</span>
                                    <span className="ml-2">{safeText(complaint.product_details?.batch_number)}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <span className="font-medium">Serial Number:</span>
                                    <span className="ml-2 font-mono">{safeText(complaint.product_details?.serial_number)}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Date of Purchase/Rental/Lease:</span>
                                    <span className="ml-2">{formatDateSafe(complaint.product_details?.purchase_date)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Nature of Complaint</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <span className="font-medium">Type of Complaint (Select one):</span>
                            <div className="grid md:grid-cols-2 gap-2">
                                {renderCheckboxLine('Performance issue', natureMatches.performance)}
                                {renderCheckboxLine('Faulty equipment', natureMatches.faulty)}
                                {renderCheckboxLine('Installation/Setup problem', natureMatches.installation)}
                                {renderCheckboxLine('Communication or connectivity issue', natureMatches.communication)}
                                {renderCheckboxLine('User interface issue', natureMatches.ui)}
                                {renderCheckboxLine(
                                    'Other (please specify):',
                                    natureOtherSelected,
                                    <span className="ml-1 text-muted-foreground">
                                        {natureOtherSelected ? natureOtherDescription : '[Enter description]'}
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Description of the Issue</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <span className="font-medium">Issue Description:</span>
                                <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{safeText(complaint.issue_details?.description)}</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <span className="font-medium">When did the problem start?</span>
                                    <p className="mt-1 text-muted-foreground">{formatDateSafe(complaint.issue_details?.problem_start_date)}</p>
                                </div>
                                <div>
                                    <span className="font-medium">Has the issue occurred before?</span>
                                    <div className="mt-1 flex gap-4">
                                        {renderCheckboxLine('Yes', issueOccurred === 'yes')}
                                        {renderCheckboxLine('No', issueOccurred === 'no')}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <span className="font-medium">Steps to replicate the issue (if applicable):</span>
                                <pre className="mt-1 text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">
                                    {safeText(complaint.issue_details?.replication_steps)}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Impact</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <span className="font-medium">How is this issue affecting you?</span>
                            <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{safeText(complaint.customer_impact)}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Previous Contact Regarding Issue</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Reported previously</span>
                                <Badge variant="outline" className="uppercase">
                                    {reportedBefore === 'yes' ? 'Yes' : 'No'}
                                </Badge>
                            </div>
                            {(reportedBefore === 'yes' ||
                                complaint.previous_contact?.reference_number ||
                                complaint.previous_contact?.contact_date) && (
                                <div>
                                    <span className="font-medium">Reference details</span>
                                    <div className="mt-1 text-muted-foreground">
                                        <div>Reference number: {safeText(complaint.previous_contact?.reference_number)}</div>
                                        <div>Date of contact: {formatDateSafe(complaint.previous_contact?.contact_date)}</div>
                                    </div>
                                </div>
                            )}
                            <div>
                                <span className="font-medium">Person contacted (if applicable):</span>
                                <p className="mt-1 text-muted-foreground">{safeText(complaint.previous_contact?.person_contacted)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Action Taken by Customer (if any)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Troubleshooting attempted</span>
                                <Badge variant="outline" className="uppercase">{troubleshootingAttempted === 'yes' ? 'Yes' : 'No'}</Badge>
                            </div>
                            {troubleshootingAttempted === 'yes' && (
                                <div>
                                    <span className="font-medium">Actions taken:</span>
                                    <pre className="mt-1 text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">
                                        {safeText(complaint.customer_actions?.troubleshooting_description)}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Preferred Method of Resolution</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <span className="font-medium">Requested resolution</span>
                            <div className="flex flex-wrap gap-2">
                                {selectedResolutionOptions.length ? (
                                    selectedResolutionOptions.map((opt, idx) => (
                                        <Badge key={`${opt}-${idx}`} variant="secondary" className="text-sm">
                                            {opt}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground">No preference specified.</span>
                                )}
                            </div>
                            {resolutionOtherSelected && resolutionOtherDescription && (
                                <div>
                                    <span className="font-medium">Additional details:</span>
                                    <p className="mt-1 text-muted-foreground">{safeText(resolutionOtherDescription)}</p>
                                </div>
                            )}
                            {resolutionMatches.replacement && (
                                <div>
                                    <span className="font-medium">Replacement details</span>
                                    <div className="mt-1 text-muted-foreground">
                                        <div>Batch no.: {safeText(complaint.replacement_details?.batch_number)}</div>
                                        <div>Serial Number: {safeText(complaint.replacement_details?.serial_number)}</div>
                                        <div>Mfg. Date: {formatDateSafe(complaint.replacement_details?.mfg_date)}</div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Paperclip className="h-5 w-5 mr-2" />
                                Attachments (if any)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <span className="font-medium">Attach supporting documents/images:</span>
                            <div className="mt-2">
                                {attachments.length > 0 ? (
                                    <AttachmentViewer attachments={attachments as (string | null)[]} />
                                ) : (
                                    <span className="text-muted-foreground">No attachments provided.</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {complaint.received_info && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <UserCheck className="h-5 w-5 mr-2" />
                                    Received Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                    <div>
                                        <span className="font-medium">Received By:</span>
                                        <span className="ml-2">{safeText(complaint.received_info.receiver_name)}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium">Position:</span>
                                        <span className="ml-2">{safeText(complaint.received_info.receiver_role)}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="font-medium">Date:</span>
                                    <span className="ml-2">{formatDateTimeSafe(complaint.received_info.received_date)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Investigation Tab */}
                <TabsContent value="investigation">
                    <div className="space-y-6">
                        {complaint.status === COMPLAINT_STATUS.SUBMITTED ? (
                            <Alert>
                                <Clock className="h-4 w-4" />
                                <AlertDescription>
                                    Investigation will begin once complaint is moved to "Under Investigation" status.
                                </AlertDescription>
                            </Alert>
                        ) : complaint.investigation ? (
                            <>
                                {/* Investigation Overview */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle className="flex items-center">
                                            <Search className="h-5 w-5 mr-2" />
                                            Investigation Overview
                                        </CardTitle>
                                        {canEditSection('investigation') && (
                                            <Button variant="ghost" size="sm" onClick={() => handleEditClick("investigation")}>
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {complaint.investigation.investigation_date && (
                                            <div className="flex items-center text-sm">
                                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span className="font-medium">Investigation Date:</span>
                                                <span className="ml-2">{formatDateTime(complaint.investigation.investigation_date)}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle className="flex items-center">
                                            <Users className="h-5 w-5 mr-2" />
                                            Investigation Assignments
                                        </CardTitle>
                                        {canAssignInvestigators && (
                                            <Button size="sm" variant="ghost" onClick={() => {
                                                setInvestigatorDialogOpen(true);
                                                setSelectedInvestigators(
                                                    investigatorAssignments
                                                        .map((assignment) => {
                                                            const assignmentUserId = typeof assignment.user === 'string'
                                                                ? assignment.user
                                                                : assignment.user?._id;
                                                            return assignmentUserId || '';
                                                        })
                                                        .filter(Boolean)
                                                );
                                            }}>
                                                Assign Investigators
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        {investigatorAssignments.length ? (
                                            <div className="space-y-3">
                                                {investigatorAssignments.map((assignment, idx) => {
                                                    const assignmentUserId = typeof assignment.user === 'string'
                                                        ? assignment.user
                                                        : assignment.user?._id;
                                                    const statusVariant = assignment.status === 'accepted'
                                                        ? 'default'
                                                        : assignment.status === 'declined'
                                                            ? 'destructive'
                                                            : 'secondary';
                                                    return (
                                                        <div key={`${assignmentUserId}-${idx}`} className="flex items-center justify-between rounded-lg border p-3">
                                                            <div>
                                                                <div className="text-sm font-medium">{getUserDisplayName(assignment.user)}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    Assigned {assignment.assigned_at ? formatDateTime(assignment.assigned_at) : '—'}
                                                                </div>
                                                                {assignment.note && (
                                                                    <div className="text-xs text-muted-foreground mt-1 italic">{assignment.note}</div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <Badge variant={statusVariant} className="w-fit">
                                                                    {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                                                                </Badge>
                                                                <span className={`text-xs ${assignment.read_at ? 'text-muted-foreground' : 'text-red-500'}`}>
                                                                    {assignment.read_at ? `Read ${formatDateTime(assignment.read_at)}` : 'Unread'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No investigators assigned yet.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Investigating Officers */}
                                {/* {complaint.investigation.investigating_officers && complaint.investigation.investigating_officers.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <Users className="h-5 w-5 mr-2" />
                                                Investigating Officers
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {complaint.investigation.investigating_officers.map((officer) => (
                                                    <div key={officer.sr_no} className="flex items-center justify-between p-3 border rounded-lg">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center text-sm">
                                                                <span className="font-medium mr-2">#{officer.sr_no}</span>
                                                                <span className="font-medium">{officer.name}</span>
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">{officer.designation}</div>
                                                        </div>
                                                        {officer.signature && (
                                                            <Badge variant="outline" className="text-xs">
                                                                <FileText className="h-3 w-3 mr-1" />
                                                                Signed
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )} */}

                                {/* Root Cause Analysis */}
                                {complaint.investigation.root_cause && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <Target className="h-5 w-5 mr-2" />
                                                Root Cause Analysis
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {complaint.investigation.root_cause.identified && (
                                                <div>
                                                    <span className="font-medium text-sm">Root Cause Identified:</span>
                                                    <Badge variant="secondary" className="ml-2">
                                                        {complaint.investigation.root_cause.identified}
                                                    </Badge>
                                                </div>
                                            )}
                                            {complaint.investigation.root_cause.description && (
                                                <div>
                                                    <span className="font-medium text-sm">Description:</span>
                                                    <p className="mt-1 text-sm text-muted-foreground">{complaint.investigation.root_cause.description}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* CAPA Details */}
                                {complaint.investigation.capa && complaint.investigation.capa.initiated && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <ShieldCheck className="h-5 w-5 mr-2" />
                                                CAPA (Corrective and Preventive Action)
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center">
                                                <Badge variant="default" className="mr-2">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    CAPA Initiated
                                                </Badge>
                                                {complaint.investigation.capa.number && (
                                                    <span className="text-sm font-mono">{complaint.investigation.capa.number}</span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Completion Details */}
                                {complaint.investigation.completion_details && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <CheckCircle className="h-5 w-5 mr-2" />
                                                Investigation Completion
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <div className="text-sm">
                                                    <span className="font-medium">Completed By:</span>
                                                    <span className="ml-2">{complaint.investigation.completion_details.name}</span>
                                                </div>
                                                {complaint.investigation.completion_details.signature && (
                                                    <Badge variant="outline" className="text-xs">
                                                        <FileText className="h-3 w-3 mr-1" />
                                                        Digitally Signed
                                                    </Badge>
                                                )}
                                            </div>
                                            {complaint.investigation.completion_details.date && (
                                                <div>
                                                    <div className="flex items-center text-sm">
                                                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                        <span className="font-medium">Completion Date:</span>
                                                        <span className="ml-2">{formatDateTime(complaint.investigation.completion_details.date)}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                            </>
                        ) : (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    No investigation details available yet.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </TabsContent>

                {/* Communication Tab */}
                <TabsContent value="communication">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center">
                                    <MessageSquare className="h-5 w-5 mr-2" />
                                    Customer Communication
                                </CardTitle>
                                {canEditSection('customer_communication') && (
                                    <Button variant="ghost" size="sm" onClick={() => handleEditClick("customer_communication")}>
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {complaint.customer_communication ? (
                                    <>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {complaint.customer_communication.response_date && (
                                                <div className="flex items-center text-sm">
                                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <span className="font-medium">Response Date:</span>
                                                    <span className="ml-2">{formatDateTime(complaint.customer_communication.response_date)}</span>
                                                </div>
                                            )}
                                            {complaint.customer_communication.mode && (
                                                <div className="flex items-center text-sm">
                                                    <PhoneCall className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <span className="font-medium">Communication Mode:</span>
                                                    <Badge variant="secondary" className="ml-2">
                                                        {complaint.customer_communication.mode}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        {complaint.customer_communication.summary && (
                                            <div>
                                                <span className="font-medium text-sm">Communication Summary:</span>
                                                <p className="mt-1 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                                    {complaint.customer_communication.summary}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertDescription>
                                            No customer communication records available yet.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                        <div className="flex items-center text-sm">
                                            <AlertTriangle className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span className="font-medium">Risk Management Report Update Required:</span>
                                        </div>
                                        <Badge variant={riskUpdateRequired ? "destructive" : "secondary"}>
                                            {riskUpdateRequired ? "Yes" : "No"}
                                        </Badge>
                                    </div>
                                    {riskUpdateRequired ? (
                                        riskDetails ? (
                                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                                {riskDetails}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Risk management update marked as required; details pending.
                                            </p>
                                        )
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            No risk management update is required for this complaint.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <MessageSquare className="h-5 w-5 mr-2" />
                                Status History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {complaint.status_history.map((entry, index) => {
                                    const stageConfig = STAGE_CONFIG[entry.status];
                                    const StageIcon = stageConfig.icon;
                                    const changedByInfo = getChangedByInfo(entry.changed_by);

                                    return (
                                        <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                                            <div className="flex-shrink-0">
                                                <Badge variant={mapBadgeVariant(stageConfig.variant)}>
                                                    <StageIcon className="h-3 w-3 mr-1" />
                                                    {stageConfig.name}
                                                </Badge>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    {formatDateTime(entry.changed_at)}
                                                </div>
                                                {entry.comments && (
                                                    <p className="text-sm">{entry.comments}</p>
                                                )}
                                                {changedByInfo && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Changed by:{' '}
                                                        <span
                                                            className="font-medium"
                                                            title={changedByInfo.tooltip ?? undefined}
                                                        >
                                                            {changedByInfo.label}
                                                        </span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
        </Tabs>

        <Dialog open={investigatorDialogOpen} onOpenChange={setInvestigatorDialogOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Assign Investigators</DialogTitle>
                    <DialogDescription>
                        Select one or more investigators to work on this complaint.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Investigators</Label>
                        <MultiSelect
                            options={investigatorOptions}
                            selected={selectedInvestigators}
                            onChange={(value) => setSelectedInvestigators(Array.isArray(value) ? value : [value])}
                            placeholder={isLoadingUsers ? 'Loading users…' : 'Select investigators'}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="investigator-note">Note (optional)</Label>
                        <Textarea
                            id="investigator-note"
                            value={investigatorNote}
                            onChange={(event) => setInvestigatorNote(event.target.value)}
                            placeholder="Add context for the investigation team"
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setInvestigatorDialogOpen(false)}
                        disabled={isAssigningInvestigators}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssignInvestigators}
                        disabled={isAssigningInvestigators || selectedInvestigators.length === 0}
                    >
                        {isAssigningInvestigators ? 'Assigning…' : 'Assign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Single drawer for all sections */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerContent className="!h-screen !max-h-screen flex flex-col">
                <DrawerHeader>
                    <DrawerTitle>Edit {activeEditSection}</DrawerTitle>
                </DrawerHeader>
                    {renderDrawerContent()}
                </DrawerContent>
            </Drawer>
            <StatusUpdateModal />
        </div>
    );
};

export default ComplaintDetailPage;
