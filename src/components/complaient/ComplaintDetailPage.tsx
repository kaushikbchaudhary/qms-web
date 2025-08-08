import React, { useState, useEffect } from 'react';
import {
    CheckCircle, Clock, AlertCircle, XCircle, Lock, User, FileText,
    Eye, MessageSquare, Calendar, Phone, Mail, Package, AlertTriangle,
    Edit3, Save, X, ChevronRight, Building, Hash, Settings
} from 'lucide-react';

// Import shadcn components (assuming they're available)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {useAuthStore} from "@/stores/authStore";
import {roles} from "@/config/roles";
import {useComplaintWithWorkflow, useTransitionComplaintStatus, useUpdateReceivedInfo} from "@/hooks/api/useComplaints";
import {Complaint} from "@/lib/api/types/complaints";
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
    // const [loading, setLoading] = useState(true);
    const currentUser = useAuthStore.getState().user;
    console.log('User Data:', currentUser);
    // const [currentUser, setCurrentUser] = useState({
    //     _id: '507f1f77bcf86cd799439014',
    //     role: ['support'],
    //     firstName: 'Support',
    //     lastName: 'User'
    // });
    const [statusUpdateModal, setStatusUpdateModal] = useState({
        show: false,
        targetStatus: null,
        comments: ''
    });
    const [editingSection, setEditingSection] = useState(null);
    const [editData, setEditData] = useState({});
    console.log('Complaint ID:', params.complaintId);

    const { data: complaintData, isLoading:loading,refetch } = useComplaintWithWorkflow(params.complaintId);
    console.log('complaintData:', complaintData?.data);

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
    const getUserRole = (user) => user.role?.[0] || 'support';

    const getAvailableTransitions = () => {
        if (!complaint) return [];
        const userRole = getUserRole(currentUser);
        const roleConfig = ROLE_PERMISSIONS[userRole];
        const allowedTransitions = roleConfig?.canTransitionTo[complaint.status] || [];
        return allowedTransitions;
    };

    const canEditSection = (section) => {
        const userRole = getUserRole(currentUser);
        const roleConfig = ROLE_PERMISSIONS[userRole];
        console.log('++++++++++++++++++++++++++++++');
        if (roleConfig?.canEdit === 'all') return true;
        console.log('___________________________');
        return roleConfig?.canEdit?.includes(section) || false;
    };

    // API simulation functions (replace with actual API calls)
    const updateComplaintStatus = async (newStatus, comments) => {
        const historyEntry = {
            status: newStatus,
            changed_by: currentUser._id,
            changed_at: new Date(),
            // comments
        };

        setComplaint(prev => ({
            ...prev,
            status: newStatus,
            status_history: [...prev.status_history, historyEntry]
        }));

        setStatusUpdateModal({ show: false, targetStatus: null, comments: '' });
    };

    const updateComplaintSection = async (section, data) => {
        setComplaint(prev => ({
            ...prev,
            [section]: { ...prev[section], ...data }
        }));
        setEditingSection(null);
        setEditData({});
    };
    const {mutateAsync:reciverInfo} = useUpdateReceivedInfo(params.complaintId);
    const {mutateAsync: statusTransition} = useTransitionComplaintStatus(params.complaintId);

    const handleStatusUpdate =async () => {
        if (!statusUpdateModal.targetStatus) return;
        // Call API to update status
        console.log('Updating status to:', statusUpdateModal.targetStatus, 'with comments:', statusUpdateModal.comments);
        // API call
        if(statusUpdateModal.targetStatus === COMPLAINT_STATUS.UNDER_INVESTIGATION && currentUser && !complaint?.received_info?.receiver_name && !complaint?.received_info?.receiver_role && !complaint?.received_info?.received_date) {

                const apiResponse = await reciverInfo({
                    receiver_name: currentUser.firstName + ' ' + currentUser.lastName,
                    receiver_role: getUserRole(currentUser),
                    received_date: new Date().toISOString()
                })
                console.log('API Response:', apiResponse);
            // updateComplaintStatus(statusUpdateModal.targetStatus, statusUpdateModal.comments) it wil be handled by the api complaint api fetch on thi sapi call by using qusequery invalidateQueries

        }
        if(statusUpdateModal.targetStatus === COMPLAINT_STATUS.REJECTED || statusUpdateModal.targetStatus === COMPLAINT_STATUS.CLOSED) {
            const apiResponse = await statusTransition({
                newStatus: statusUpdateModal.targetStatus,
                comments: `Transforming ${complaint?.status} to ${statusUpdateModal.targetStatus}` //statusUpdateModal.comments
            })
            console.log('API Response:___REJECTED', apiResponse);
            // updateComplaintStatus(statusUpdateModal.targetStatus, statusUpdateModal.comments) it wil be handled by the api complaint api fetch on thi sapi call by using qusequery invalidateQueries
        }

        // setStatusUpdateModal({
        //     show: true,
        //     targetStatus: status,
        //     comments: ''
        // });
    }

    // Status update modal
    const StatusUpdateModal = () => {
        if (!statusUpdateModal.show) return null;

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
                                        onClick={() => setStatusUpdateModal({ show: true, targetStatus: status, comments: '' })}
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
                            {/*{canEditSection('customer') && (*/}
                            {/*    <Button variant="ghost" size="sm">*/}
                            {/*        <Edit3 className="h-4 w-4" />*/}
                            {/*    </Button>*/}
                            {/*)}*/}
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
                                    <span className="ml-2">{new Date(complaint.product_details.purchase_date).toLocaleDateString()}</span>
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
                                        {new Date(complaint.issue_details.problem_start_date).toLocaleDateString()}
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
                </TabsContent>

                {/* Investigation Tab */}
                <TabsContent value="investigation">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Investigation Details</CardTitle>
                            {canEditSection('investigation') && (
                                <Button variant="ghost" size="sm">
                                    <Edit3 className="h-4 w-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {complaint.status === COMPLAINT_STATUS.SUBMITTED ? (
                                <Alert>
                                    <Clock className="h-4 w-4" />
                                    <AlertDescription>
                                        Investigation will begin once complaint is moved to "Under Investigation" status.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-sm text-muted-foreground">
                                        Investigation details will be populated here based on the complaint status and user permissions.
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Communication Tab */}
                <TabsContent value="communication">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Customer Communication</CardTitle>
                            {canEditSection('customer_communication') && (
                                <Button variant="ghost" size="sm">
                                    <Edit3 className="h-4 w-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">
                                Customer communication history and details will be displayed here.
                            </div>
                        </CardContent>
                    </Card>
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
                                                    {new Date(entry.changed_at).toLocaleDateString()} at {new Date(entry.changed_at).toLocaleTimeString()}
                                                </div>
                                                {entry.comments && (
                                                    <p className="text-sm">{entry.comments}</p>
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

            <StatusUpdateModal />
        </div>
    );
};

export default ComplaintDetailPage;