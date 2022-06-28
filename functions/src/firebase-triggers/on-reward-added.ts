import * as functions from 'firebase-functions';
import { firebaseMessaging } from '../modules/firebase-admin-module';
import { User } from '../models/user';
import { Reward } from '../models/reward';
import { Club } from '../models/club';
import { tryGetClubData } from '../firestore-functions/get-data/get-club-data';
import { getClubFollowers } from '../cloud-messages/get-club-followers';

export async function onRewardAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    context: functions.EventContext
) {
    const reward = snapshot.data() as Reward;
    const clubId = context.params.clubId;
    const club = await tryGetClubData(clubId);
    await sendCloudMessageToClubFollowers(reward, club);
}

async function sendCloudMessageToClubFollowers(reward: Reward, club: Club) {
    const clubFollowers = await getClubFollowers(club.id);

    for (const follower of clubFollowers.docs) {
        const user = follower.data() as User;
        const userTokens = user.pushNotificationTokens;
        if (!userTokens || userTokens?.length === 0) continue;
        const title = getCloudMessageTitle(user.locale, club.clubName);
        await firebaseMessaging().sendToDevice(
            userTokens,
            {
                notification: {
                    title,
                    body: reward.description,
                },
                data: {
                    clubId: club.id,
                },
            },
            {
                priority: 'high',
                contentAvailable: true,
            }
        );
    }
}

function getCloudMessageTitle(locale: string, clubName: string) {
    return locale === 'pl'
        ? `Nowa nagroda w klubie ${clubName}!`
        : `New reward at the ${clubName} club!`;
}
