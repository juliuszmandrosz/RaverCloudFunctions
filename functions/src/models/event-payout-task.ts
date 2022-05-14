export interface EventPayoutTask {
    /// Event id
    id: string;
    payoutTaskId: string;
    isCanceled: boolean;
    isPaidOut: boolean;
}
