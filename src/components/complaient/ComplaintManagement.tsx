import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle, Lock, User, FileText, Eye, MessageSquare } from 'lucide-react';

const ComplaintWorkflowSystem = () => {
    // Define complaint stages based on your schema
    const COMPLAINT_STATUS = {
        SUBMITTED: 'SUBMITTED',
        UNDER_INVESTIGATION: 'UNDER_INVESTIGATION',
        RESOLVED: 'RESOLVED',
        REJECTED: 'REJECTED',
        CLOSED: 'CLOSED'
    };

    const STAGE_CONFIG = {
        [COMPLAINT_STATUS.SUBMITTED]: {
            id: 1, name: 'Submitted', color: 'blue', icon: FileText,
            description: 'Complaint has been submitted and awaiting review'
        },
        [COMPLAINT_STATUS.UNDER_INVESTIGATION]: {
            id: 2, name: 'Under Investigation', color: 'yellow', icon: Clock,
            description: 'Complaint is being investigated by the team'
        },
        [COMPLAINT_STATUS.RESOLVED]: {
            id: 3, name: 'Resolved', color: 'green', icon: CheckCircle,
            description: 'Investigation complete and resolution provided'
        },
        [COMPLAINT_STATUS.REJECTED]: {
            id: 3, name: 'Rejected', color: 'red', icon: XCircle,
            description: 'Complaint has been rejected'
        },
        [COMPLAINT_STATUS.CLOSED]: {
            id: 4, name: 'Closed', color: 'gray', icon: XCircle,
            description: 'Complaint has been closed'
        }
    };

    // Role-based workflow permissions based on your user roles
    const ROLE_WORKFLOW = {
        support: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION, COMPLAINT_STATUS.REJECTED],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED],
                [COMPLAINT_STATUS.RESOLVED]: [COMPLAINT_STATUS.CLOSED, COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.REJECTED]: [],
                [COMPLAINT_STATUS.CLOSED]: []
            },
            canView: 'all',
            canEdit: ['received_info', 'customer_communication'],
            description: 'Can manage complaint lifecycle and customer communication'
        },
        qa: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED],
                [COMPLAINT_STATUS.RESOLVED]: [COMPLAINT_STATUS.CLOSED],
                [COMPLAINT_STATUS.REJECTED]: [],
                [COMPLAINT_STATUS.CLOSED]: []
            },
            canView: 'all',
            canEdit: ['investigation', 'closure', 'risk_management'],
            description: 'Can investigate complaints and approve closures'
        },
        production: {
            canTransitionTo: {
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED],
            },
            canView: 'assigned_only',
            canEdit: ['investigation'],
            description: 'Can investigate and resolve production-related issues'
        },
        super_admin: {
            canTransitionTo: {
                [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION, COMPLAINT_STATUS.REJECTED, COMPLAINT_STATUS.CLOSED],
                [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED, COMPLAINT_STATUS.CLOSED],
                [COMPLAINT_STATUS.RESOLVED]: [COMPLAINT_STATUS.CLOSED, COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.REJECTED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION],
                [COMPLAINT_STATUS.CLOSED]: [COMPLAINT_STATUS.UNDER_INVESTIGATION]
            },
            canView: 'all',
            canEdit: 'all',
            description: 'Full access to all complaint operations'
        }
    };

    // Sample complaint data matching your schema
    const [complaints, setComplaints] = useState([
        {
            _id: '507f1f77bcf86cd799439011',
            complaint_number: 'CPL-2024-001',
            customer: {
                name: 'John Doe',
                company: 'ABC Corp',
                contact_number: '+1234567890',
                email: 'john@example.com'
            },
            product_details: {
                model: 'XYZ-100',
                serial_number: 'SN123456',
                purchase_date: new Date('2023-12-01')
            },
            complaint_type: {
                name: 'Hardware Malfunction',
                description: 'Device not working properly'
            },
            issue_details: {
                description: 'Device stops working after 2 hours of use',
                problem_start_date: new Date('2024-01-10'),
                occurred_before: 'No',
                replication_steps: 'Turn on device, use for 2 hours, observe shutdown'
            },
            status: COMPLAINT_STATUS.SUBMITTED,
            status_history: [
                {
                    status: COMPLAINT_STATUS.SUBMITTED,
                    changed_by: '507f1f77bcf86cd799439012',
                    changed_at: new Date('2024-01-15'),
                    comments: 'Initial complaint submission'
                }
            ],
            created_on: new Date('2024-01-15'),
            investigation: {},
            customer_communication: {},
            closure: {}
        },
        {
            _id: '507f1f77bcf86cd799439013',
            complaint_number: 'CPL-2024-002',
            customer: {
                name: 'Jane Smith',
                company: 'DEF Ltd',
                contact_number: '+1234567891',
                email: 'jane@example.com'
            },
            product_details: {
                model: 'XYZ-200',
                serial_number: 'SN789012',
                purchase_date: new Date('2023-11-15')
            },
            complaint_type: {
                name: 'Software Issue',
                description: 'Application crashes frequently'
            },
            issue_details: {
                description: 'App crashes when processing large files',
                problem_start_date: new Date('2024-01-12'),
                occurred_before: 'Yes',
                replication_steps: 'Load file >100MB, click process, app crashes'
            },
            status: COMPLAINT_STATUS.UNDER_INVESTIGATION,
            status_history: [
                {
                    status: COMPLAINT_STATUS.SUBMITTED,
                    changed_by: '507f1f77bcf86cd799439012',
                    changed_at: new Date('2024-01-14'),
                    comments: 'Initial complaint submission'
                },
                {
                    status: COMPLAINT_STATUS.UNDER_INVESTIGATION,
                    changed_by: '507f1f77bcf86cd799439014',
                    changed_at: new Date('2024-01-15'),
                    comments: 'Assigned to technical team for investigation'
                }
            ],
            created_on: new Date('2024-01-14'),
            investigation: {
                investigation_date: new Date('2024-01-15'),
                investigating_officers: [
                    { sr_no: 1, name: 'Tech Lead', designation: 'Senior Engineer' }
                ]
            },
            customer_communication: {},
            closure: {}
        }
    ]);

    const [currentUser, setCurrentUser] = useState({
        _id: '507f1f77bcf86cd799439014',
        role: ['support'],
        firstName: 'Support',
        lastName: 'User'
    });
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [statusUpdateModal, setStatusUpdateModal] = useState({ show: false, complaint: null, targetStatus: null });

    // Get user's primary role
    const getUserRole = (user) => {
        return user.role && user.role.length > 0 ? user.role[0] : 'support';
    };

    // Check if user can transition complaint to target status
    const canTransitionToStatus = (complaint, targetStatus) => {
        const userRole = getUserRole(currentUser);
        const roleConfig = ROLE_WORKFLOW[userRole];

        if (!roleConfig) return false;

        const allowedTransitions = roleConfig.canTransitionTo[complaint.status] || [];
        return allowedTransitions.includes(targetStatus);
    };

    // Get available status transitions for current user
    const getAvailableTransitions = (complaint) => {
        const userRole = getUserRole(currentUser);
        const roleConfig = ROLE_WORKFLOW[userRole];

        if (!roleConfig) return [];

        const allowedTransitions = roleConfig.canTransitionTo[complaint.status] || [];
        return allowedTransitions.map(status => ({
            status,
            config: STAGE_CONFIG[status]
        }));
    };

    // Update complaint status
    const updateComplaintStatus = (complaintId, newStatus, comments = '') => {
        setComplaints(prev => prev.map(complaint => {
            if (complaint._id === complaintId) {
                const newHistoryEntry = {
                    status: newStatus,
                    changed_by: currentUser._id,
                    changed_at: new Date(),
                    comments: comments
                };

                return {
                    ...complaint,
                    status: newStatus,
                    status_history: [...complaint.status_history, newHistoryEntry]
                };
            }
            return complaint;
        }));

        setStatusUpdateModal({ show: false, complaint: null, targetStatus: null });
    };

    // Check if user can view complaint
    const canViewComplaint = (complaint) => {
        const userRole = getUserRole(currentUser);
        const roleConfig = ROLE_WORKFLOW[userRole];

        if (!roleConfig) return false;
        if (roleConfig.canView === 'all') return true;
        if (roleConfig.canView === 'assigned_only') {
            // Check if complaint is assigned to current user or their team
            return true; // Simplified - implement actual assignment logic
        }
        return false;
    };

    // Status update modal component
    const StatusUpdateModal = () => {
        const [comments, setComments] = useState('');

        if (!statusUpdateModal.show) return null;

        const { complaint, targetStatus } = statusUpdateModal;
        const targetConfig = STAGE_CONFIG[targetStatus];

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4">
                        Update Status to {targetConfig.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Complaint: {complaint.complaint_number}
                    </p>
                    <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add comments about this status change..."
                        className="w-full p-3 border border-gray-300 rounded-md resize-none"
                        rows={4}
                    />
                    <div className="flex space-x-3 mt-4">
                        <button
                            onClick={() => updateComplaintStatus(complaint._id, targetStatus, comments)}
                            className={`px-4 py-2 bg-${targetConfig.color}-500 hover:bg-${targetConfig.color}-600 text-white rounded-md`}
                        >
                            Update Status
                        </button>
                        <button
                            onClick={() => setStatusUpdateModal({ show: false, complaint: null, targetStatus: null })}
                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Workflow progress component
    const WorkflowProgress = ({ complaint }) => {
        const currentStageId = STAGE_CONFIG[complaint.status]?.id || 1;

        return (
            <div className="flex items-center space-x-2 mb-4">
                {Object.entries(STAGE_CONFIG).filter(([status]) => status !== COMPLAINT_STATUS.REJECTED).map(([status, config], index) => {
                    const isCompleted = currentStageId > config.id;
                    const isCurrent = complaint.status === status;
                    const isRejected = complaint.status === COMPLAINT_STATUS.REJECTED;

                    const StageIcon = config.icon;

                    return (
                        <div key={status} className="flex items-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                                isRejected && status === COMPLAINT_STATUS.REJECTED
                                    ? 'bg-red-500 border-red-500 text-white'
                                    : isCompleted
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : isCurrent
                                            ? `bg-${config.color}-500 border-${config.color}-500 text-white`
                                            : 'bg-gray-200 border-gray-300 text-gray-400'
                            }`}>
                                <StageIcon size={14} />
                            </div>
                            {index < Object.entries(STAGE_CONFIG).filter(([s]) => s !== COMPLAINT_STATUS.REJECTED).length - 1 && (
                                <div className={`w-6 h-0.5 mx-2 ${
                                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                }`} />
                            )}
                        </div>
                    );
                })}

                {complaint.status === COMPLAINT_STATUS.REJECTED && (
                    <div className="ml-4 flex items-center">
                        <div className="bg-red-500 border-red-500 text-white flex items-center justify-center w-8 h-8 rounded-full border-2">
                            <XCircle size={14} />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Complaint Workflow Management</h1>
                    <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                        <User size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
              {currentUser.firstName} {currentUser.lastName} ({getUserRole(currentUser)})
            </span>
                    </div>
                </div>

                {/* Role Switcher for Demo */}
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800 mb-2">Demo: Switch User Role</p>
                    <div className="flex space-x-2">
                        {Object.keys(ROLE_WORKFLOW).map(role => (
                            <button
                                key={role}
                                onClick={() => setCurrentUser({
                                    ...currentUser,
                                    role: [role],
                                    firstName: role.charAt(0).toUpperCase() + role.slice(1),
                                    lastName: 'User'
                                })}
                                className={`px-3 py-1 rounded text-sm ${
                                    getUserRole(currentUser) === role
                                        ? 'bg-yellow-500 text-white'
                                        : 'bg-white border border-yellow-300 text-yellow-700'
                                }`}
                            >
                                {role.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-yellow-600 mt-2">
                        {ROLE_WORKFLOW[getUserRole(currentUser)]?.description}
                    </p>
                </div>

                {/* Complaints Grid */}
                <div className="grid gap-6">
                    {complaints.filter(canViewComplaint).map(complaint => {
                        const currentStageConfig = STAGE_CONFIG[complaint.status];
                        const availableTransitions = getAvailableTransitions(complaint);

                        return (
                            <div key={complaint._id} className="border border-gray-200 rounded-lg p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {complaint.complaint_number}
                                            </h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${currentStageConfig.color}-100 text-${currentStageConfig.color}-800`}>
                        {currentStageConfig.name}
                      </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">
                                            <strong>Customer:</strong> {complaint.customer.name} ({complaint.customer.company})
                                        </p>
                                        <p className="text-sm text-gray-600 mb-1">
                                            <strong>Product:</strong> {complaint.product_details.model} - {complaint.product_details.serial_number}
                                        </p>
                                        <p className="text-sm text-gray-600 mb-3">
                                            <strong>Issue:</strong> {complaint.issue_details.description}
                                        </p>
                                    </div>
                                </div>

                                <WorkflowProgress complaint={complaint} />

                                {/* Actions */}
                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex space-x-2">
                                        {availableTransitions.length > 0 ? (
                                            availableTransitions.map(({ status, config }) => (
                                                <button
                                                    key={status}
                                                    onClick={() => setStatusUpdateModal({
                                                        show: true,
                                                        complaint,
                                                        targetStatus: status
                                                    })}
                                                    className={`px-3 py-1 rounded-md text-sm font-medium bg-${config.color}-500 hover:bg-${config.color}-600 text-white transition-colors`}
                                                >
                                                    Move to {config.name}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Lock size={16} className="mr-2" />
                                                No actions available
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setSelectedComplaint(selectedComplaint === complaint._id ? null : complaint._id)}
                                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                    >
                                        <Eye size={16} className="mr-1" />
                                        {selectedComplaint === complaint._id ? 'Hide' : 'Show'} History
                                    </button>
                                </div>

                                {/* Status History */}
                                {selectedComplaint === complaint._id && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                                            <MessageSquare size={16} className="mr-2" />
                                            Status History
                                        </h4>
                                        <div className="space-y-3">
                                            {complaint.status_history.map((entry, index) => {
                                                const stageConfig = STAGE_CONFIG[entry.status];
                                                return (
                                                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                                        <div className={`w-3 h-3 rounded-full bg-${stageConfig.color}-400 mt-1`} />
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-2 text-sm">
                                                                <span className="font-medium">{stageConfig.name}</span>
                                                                <span className="text-gray-500">•</span>
                                                                <span className="text-gray-600">
                                  {entry.changed_at.toLocaleDateString()} {entry.changed_at.toLocaleTimeString()}
                                </span>
                                                            </div>
                                                            {entry.comments && (
                                                                <p className="text-sm text-gray-600 mt-1">{entry.comments}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Current Role Permissions */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-3">
                        Current Role Permissions ({getUserRole(currentUser)})
                    </h3>
                    <div className="text-sm text-gray-600 space-y-2">
                        {Object.entries(ROLE_WORKFLOW[getUserRole(currentUser)]?.canTransitionTo || {}).map(([fromStatus, toStatuses]) => (
                            <div key={fromStatus}>
                                <strong>From {STAGE_CONFIG[fromStatus]?.name}:</strong> Can move to{' '}
                                {toStatuses.length > 0
                                    ? toStatuses.map(status => STAGE_CONFIG[status]?.name).join(', ')
                                    : 'No transitions allowed'
                                }
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <StatusUpdateModal />
        </div>
    );
};

export default ComplaintWorkflowSystem;