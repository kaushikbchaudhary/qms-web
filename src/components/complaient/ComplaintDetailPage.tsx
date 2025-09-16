import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    Lock,
    User,
    FileText,
    Eye,
    MessageSquare,
    Calendar,
    Phone,
    Mail,
    Package,
    AlertTriangle,
    Edit3,
    Save,
    X,
    ChevronRight,
    Building,
    Hash,
    Settings,
    UserCheck,
    Search,
    Users,
    Target,
    ClipboardList,
    ShieldCheck,
    Info, PhoneCall, Paperclip
} from 'lucide-react';

// Import shadcn components (assuming they're available)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {useAuthStore, UserData} from "@/stores/authStore";
import {roles} from "@/config/roles";
import {useComplaintWithWorkflow, useTransitionComplaintStatus, useUpdateReceivedInfo} from "@/hooks/api/useComplaints";
import {Complaint} from "@/lib/api/types/complaints";
import {Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle} from "@/components/ui/drawer";
import {InvestigationForm} from "@/components/forms/InvestigationForm";
import {formatDate, formatDateTime} from "@/lib/utils";
import {CustomerCommunicationForm} from "@/components/forms/CustomerCommunicationForm";
import {ComplaintClosureForm} from "@/components/forms/ComplaintClosureForm";
interface Props {
    complaintId:any
}
const ComplaintDetailPage = (params:Props) => {
    // Complaint statuses from your schema
    const COMPLAINT_STATUS = {
        SUBMITTED: 'SUBMITTED',
        UNDER_INVESTIGATION: 'UNDER_INVESTIGATION',
        RESOLVED: 'RESOLVED',
        REJECTED: 'REJECTED',
        CLOSED: 'CLOSED'
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

    // Role-based permissions matching your user schema
    const ROLE_PERMISSIONS = {
        support: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION, COMPLAINT_STATUS.REJECTED],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED],
                [COMPLAINT_STATUS.RESOLVED]: [COMPLAINT_STATUS.CLOSED, COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.REJECTED]: [],
                [COMPLAINT_STATUS.CLOSED]: []
            },
            canEdit: ['received_info', 'customer_communication'],
            label: 'Support Team'
        },
        qa: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED],
                [COMPLAINT_STATUS.RESOLVED]: [COMPLAINT_STATUS.CLOSED],
                [COMPLAINT_STATUS.REJECTED]: [],
                [COMPLAINT_STATUS.CLOSED]: []
            },
            canEdit: ['investigation', 'closure', 'risk_management'],
            label: 'Quality Assurance'
        },
        production: {
            canTransitionTo: {
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED],
            },
            canEdit: ['investigation'],
            label: 'Production Team'
        },
        [roles.SUPER_ADMIN]: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION, COMPLAINT_STATUS.REJECTED, COMPLAINT_STATUS.CLOSED],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED, COMPLAINT_STATUS.CLOSED],
                [COMPLAINT_STATUS.RESOLVED]: [COMPLAINT_STATUS.CLOSED, COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.REJECTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.CLOSED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION]
            },
            canEdit: 'all',
            label: 'Super Administrator'
        }
    };

    // State management
    const [complaint, setComplaint] = useState<Complaint>();
    const currentUser: UserData = useAuthStore.getState().user;
    const [statusUpdateModal, setStatusUpdateModal] = useState({
        show: false,
        targetStatus: null,
        comments: ''
    });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeEditSection, setActiveEditSection] = useState<string | null>(null);

    const { data: complaintData, isLoading:loading,refetch } = useComplaintWithWorkflow(params.complaintId);

    // API call to fetch complaint details
    useEffect(() => {
        // This would be your actual API call
        // fetchComplaintById(complaintId)
        // eslint-disable-next-line react-hooks/rules-of-hooks
        // refetch();
        if (complaintData?.data ) {
            setComplaint(complaintData.data);
        } else {
            setComplaint(null);
        }

        // setTimeout(() => {
        //     setComplaint({
        //         _id: '507f1f77bcf86cd799439011',
        //         complaint_number: 'CPL-2024-001',
        //         submission_date: new Date('2024-01-15'),
        //         customer: {
        //             name: 'John Doe',
        //             company: 'ABC Corporation Ltd.',
        //             contact_number: '+1 (555) 123-4567',
        //             email: 'john.doe@abccorp.com'
        //         },
        //         product_details: {
        //             model: 'XYZ-100 Pro',
        //             serial_number: 'SN123456789',
        //             purchase_date: new Date('2023-12-01'),
        //             config: { warranty: '2 years', color: 'Black' }
        //         },
        //         complaint_type: {
        //             name: 'Hardware Malfunction',
        //             description: 'Device hardware issue affecting normal operation'
        //         },
        //         issue_details: {
        //             description: 'Device stops working after 2 hours of continuous use. The screen goes blank and device becomes unresponsive.',
        //             problem_start_date: new Date('2024-01-10'),
        //             occurred_before: 'No',
        //             replication_steps: '1. Turn on device\n2. Use continuously for 2 hours\n3. Observe device shutdown\n4. Device becomes unresponsive'
        //         },
        //         customer_impact: 'High - Unable to use device for daily work operations',
        //         preferred_resolution_method: {
        //             name: 'Replacement',
        //             description: 'Customer prefers device replacement over repair'
        //         },
        //         status: COMPLAINT_STATUS.SUBMITTED,
        //         status_history: [
        //             {
        //                 status: COMPLAINT_STATUS.SUBMITTED,
        //                 changed_by: '507f1f77bcf86cd799439012',
        //                 changed_at: new Date('2024-01-15T10:30:00'),
        //                 comments: 'Initial complaint submission via web portal'
        //             }
        //         ],
        //         received_info: {
        //             receiver_name: '',
        //             receiver_role: '',
        //             received_date: null
        //         },
        //         investigation: {
        //             investigation_date: null,
        //             investigating_officers: [],
        //             root_cause: { identified: '', description: '' },
        //             corrective_action: '',
        //             action_taken: ''
        //         },
        //         customer_communication: {
        //             response_date: null,
        //             mode: '',
        //             summary: '',
        //             attachments: []
        //         },
        //         closure: {
        //             final_disposition: '',
        //             closure_comments: ''
        //         }
        //     });
        //     setLoading(false);
        // }, 1000);
    }, [complaintData]);

    // Helper functions
    const getUserRole = (user:UserData) => user.role?.[0];

    const getAvailableTransitions = () => {
        if (!complaint) return [];
        const userRole = getUserRole(currentUser);
        const roleConfig = ROLE_PERMISSIONS[userRole];
        const allowedTransitions = roleConfig?.canTransitionTo[complaint.status] || [];
        return allowedTransitions;
    };

    const props = {
        complaintId: complaint?._id,
        defaultValues: complaint?.investigation, // Fetch or set default values as needed
        onSuccess: () => {
            // Handle success, e.g., redirect or show a success message
        },
    };

    const canEditSection = (section:string) => {
        const userRole = getUserRole(currentUser);
        const roleConfig = ROLE_PERMISSIONS[userRole];
        if (roleConfig?.canEdit === 'all') return true;

        return roleConfig?.canEdit?.includes(section);
    };

    // API calls for status updates
    const {mutateAsync:reciverInfo} = useUpdateReceivedInfo(params.complaintId);
    const {mutateAsync: statusTransition} = useTransitionComplaintStatus(params.complaintId);

    const handleStatusUpdate =async () => {
        if (!statusUpdateModal.targetStatus) return;
        // Call API to update status
        if(statusUpdateModal.targetStatus === COMPLAINT_STATUS.UNDER_INVESTIGATION && currentUser) {
                await reciverInfo({
                    receiver_name: currentUser.firstName + ' ' + currentUser.lastName,
                    receiver_role: getUserRole(currentUser),
                    received_date: new Date().toISOString()
                })
            setStatusUpdateModal({ show: false, targetStatus: null, comments: '' });
        }
        if(statusUpdateModal.targetStatus === COMPLAINT_STATUS.RESOLVED) {
            // If status is RESOLVED, open the investigation form
            // handleEditClick('kk');
            console.log(statusUpdateModal.targetStatus);
            // setStatusUpdateModal({ show: false, targetStatus: null, comments: '' });

            return;
        }
        if(statusUpdateModal.targetStatus === COMPLAINT_STATUS.REJECTED || statusUpdateModal.targetStatus === COMPLAINT_STATUS.CLOSED) {
            await statusTransition({
                newStatus: statusUpdateModal.targetStatus,
                comments: `Transforming ${complaint?.status} to ${statusUpdateModal.targetStatus}` //statusUpdateModal.comments
            })
            setStatusUpdateModal({ show: false, targetStatus: null, comments: '' });
        }
    }

    // Status update modal
    const StatusUpdateModal = () => {
        if (!statusUpdateModal.show) return null;

        const targetConfig = STAGE_CONFIG[statusUpdateModal.targetStatus];

        if(targetConfig.targetStatus === COMPLAINT_STATUS.CLOSED){
            handleEditClick(COMPLAINT_STATUS.CLOSED);
            return null;
        }
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
                                variant={targetConfig.variant}
                            >
                                Update Status
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

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Complaint not found</AlertDescription>
                </Alert>
            </div>
        );
    }

    const handleEditClick = (section: string) => {
        setActiveEditSection(section);
        setDrawerOpen(true);
    };

    const renderDrawerContent = () => {
        switch (activeEditSection) {
            case "details":
                return <div className="p-4">Complaint Details Form</div>;
            case "investigation":
                return <div className="container mx-auto flex-1 overflow-y-auto mb-2">
                    <InvestigationForm {...props}/>
                </div>;
            case "customer_communication":
                return <div className={"container mx-auto flex-1 overflow-y-auto mb-2"}>
                    <CustomerCommunicationForm complaintId={complaint._id} />
                </div>;
                // return <div className="p-4">Communication Form</div>;
            case "history":
                return <div className="p-4">History Notes Form</div>;
            case COMPLAINT_STATUS.CLOSED:
                return <div className="container mx-auto flex-1 overflow-y-auto mb-2">
                    <ComplaintClosureForm complaintId={complaint._id}/>
                </div>;
            default:
                return null;
        }
    };

    const currentStageConfig = STAGE_CONFIG[complaint.status];
    const availableTransitions = getAvailableTransitions();

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                        <h1 className="text-2xl font-bold">{complaint.complaint_number}</h1>
                        <Badge variant={currentStageConfig.variant}>
                            <currentStageConfig.icon className="h-3 w-3 mr-1" />
                            {currentStageConfig.name}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">{currentStageConfig.description}</p>
                </div>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{currentUser.firstName} {currentUser.lastName}</span>
                    <Badge variant="outline">{ROLE_PERMISSIONS[getUserRole(currentUser)]?.label}</Badge>
                </div>
            </div>

            {/* Action Buttons */}
            {availableTransitions.length > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium">Available Actions:</span>
                            {availableTransitions.map(status => {
                                const config = STAGE_CONFIG[status];
                                return (
                                    <Button
                                        key={status}
                                        variant={config.variant}
                                        size="sm"
                                        onClick={() => status === COMPLAINT_STATUS.CLOSED ? handleEditClick(COMPLAINT_STATUS.CLOSED) : setStatusUpdateModal({ show: true, targetStatus: status, comments: '' })}
                                    >
                                        <config.icon className="h-4 w-4 mr-2" />
                                        Move to {config.name}
                                    </Button>
                                );
                            })}
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
                    {/* Customer Information */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center">
                                <User className="h-5 w-5 mr-2" />
                                Customer Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center text-sm">
                                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span className="font-medium">Name:</span>
                                    <span className="ml-2">{complaint.customer.name}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span className="font-medium">Company:</span>
                                    <span className="ml-2">{complaint.customer.company}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center text-sm">
                                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span className="font-medium">Contact:</span>
                                    <span className="ml-2">{complaint.customer.contact_number}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span className="font-medium">Email:</span>
                                    <span className="ml-2">{complaint.customer.email}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Product Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Package className="h-5 w-5 mr-2" />
                                Product Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="text-sm">
                                    <span className="font-medium">Model:</span>
                                    <span className="ml-2">{complaint.product_details.model}</span>
                                </div>
                                <div className="text-sm">
                                    <span className="font-medium">Serial Number:</span>
                                    <span className="ml-2 font-mono">{complaint.product_details.serial_number}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center text-sm">
                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span className="font-medium">Purchase Date:</span>
                                    <span className="ml-2">{formatDate(complaint.product_details.purchase_date)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Issue Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <AlertTriangle className="h-5 w-5 mr-2" />
                                Issue Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="font-medium text-sm">Description:</span>
                                <p className="mt-1 text-sm text-muted-foreground">{complaint.issue_details.description}</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <span className="font-medium text-sm">Problem Start Date:</span>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDate(complaint.issue_details.problem_start_date)}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-sm">Occurred Before:</span>
                                    <p className="text-sm text-muted-foreground">{complaint.issue_details.occurred_before}</p>
                                </div>
                            </div>
                            {complaint.issue_details.replication_steps && (
                                <div>
                                    <span className="font-medium text-sm">Replication Steps:</span>
                                    <pre className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {complaint.issue_details.replication_steps}
                  </pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Received Information */}
                    {complaint.received_info && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <UserCheck className="h-5 w-5 mr-2" />
                                    Received Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="text-sm">
                                        <span className="font-medium">Received By:</span>
                                        <span className="ml-2">{complaint.received_info.receiver_name}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-medium">Role:</span>
                                        <span className="ml-2">{complaint.received_info.receiver_role}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center text-sm">
                                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                        <span className="font-medium">Received Date:</span>
                                        <span className="ml-2">{formatDateTime(complaint.received_info.received_date)}</span>
                                    </div>
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

                                {/* Investigating Officers */}
                                {complaint.investigation.investigating_officers && complaint.investigation.investigating_officers.length > 0 && (
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
                                )}

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

                                {/* Corrective Actions */}
                                {complaint.investigation.corrective_action && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <ClipboardList className="h-5 w-5 mr-2" />
                                                Corrective Actions
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <span className="font-medium text-sm">Action Taken:</span>
                                                <p className="mt-1 text-sm text-muted-foreground">{complaint.investigation.corrective_action}</p>
                                            </div>
                                            {complaint.investigation.action_taken && (
                                                <div>
                                                    <span className="font-medium text-sm">Implementation Details:</span>
                                                    <p className="mt-1 text-sm text-muted-foreground">{complaint.investigation.action_taken}</p>
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
                                            {complaint.investigation.capa.details && (
                                                <div>
                                                    <span className="font-medium text-sm">CAPA Details:</span>
                                                    <p className="mt-1 text-sm text-muted-foreground">{complaint.investigation.capa.details}</p>
                                                </div>
                                            )}
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

                                {/* Risk Management */}
                                {complaint.risk_management && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <AlertTriangle className="h-5 w-5 mr-2" />
                                                Risk Management
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center">
                                                <span className="font-medium text-sm mr-2">Risk Assessment Update Required:</span>
                                                <Badge variant={complaint.risk_management.update_required ? "destructive" : "secondary"}>
                                                    {complaint.risk_management.update_required ? "Yes" : "No"}
                                                </Badge>
                                            </div>
                                            {complaint.risk_management.details && (
                                                <div>
                                                    <span className="font-medium text-sm">Details:</span>
                                                    <p className="mt-1 text-sm text-muted-foreground">{complaint.risk_management.details}</p>
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
                        {complaint.customer_communication ? (
                            <>
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
                                    <CardContent className="space-y-4">
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

                                        {complaint.customer_communication.attachments && complaint.customer_communication.attachments.length > 0 && (
                                            <div>
                                                <span className="font-medium text-sm mb-2 block">Attachments:</span>
                                                <div className="space-y-2">
                                                    {complaint.customer_communication.attachments.map((attachment, index) => (
                                                        <div key={index} className="flex items-center text-sm p-2 border rounded-md">
                                                            <Paperclip className="h-4 w-4 mr-2 text-muted-foreground" />
                                                            <span>{attachment}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    No customer communication records available yet.
                                </AlertDescription>
                            </Alert>
                        )}
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
                                    return (
                                        <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                                            <div className="flex-shrink-0">
                                                <Badge variant={stageConfig.variant}>
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
                                                {entry.changed_by && (
                                                    <p className="text-xs text-muted-foreground">Changed by: {entry.changed_by}</p>
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