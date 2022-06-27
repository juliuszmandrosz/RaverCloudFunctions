export interface User {
    email: string;
    username: string;
    favoriteEventIds: string[];
    favoriteClubIds: string[];
    /// key - clubId, value - number of entries
    attendance: { [key: string]: number };
    pushNotificationTokens: string[];
    locale: string;
}
