export declare const useBackupPolicies: () => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useCreateBackupPolicy: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    name: string;
    schedule: string;
    retentionDays?: number;
    targetType?: "LOCAL" | "NETWORK" | "S3";
    targetPath?: string;
    isEncrypted?: boolean;
}, unknown>;
export declare const useRunPolicy: () => import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare const useBackupJobs: (filters?: {
    status?: string;
    policyId?: string;
}) => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useVerifyBackupJob: () => import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare const useRestorePoints: () => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useTestRestore: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    jobId: string;
    note?: string;
}, unknown>;
