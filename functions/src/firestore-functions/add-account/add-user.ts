import * as functions from "firebase-functions";
import { firestoreDatabase } from "../../modules/firebase-admin-module";
import { setUserClaim } from "../../auth-functions/set-claim/set-user-claim";
import { addStripeCustomer } from "../../stripe-functions/add-stripe-customer/add-stripe-customer";
import { users } from "../../constants/collections";
import { User } from "../../models/user";

export async function addUser(
  data: any,
  context: functions.https.CallableContext
): Promise<void> {
  if (!context.auth) {
    const message = "The function must be called while authenticated.";
    throw new functions.https.HttpsError("failed-precondition", message);
  }

  const userId = context.auth.token.uid;
  const email = context.auth.token.email!;

  const userDocRef = firestoreDatabase().collection(users).doc(userId);
  const userDoc = await userDocRef.get();

  if (userDoc.exists) {
    const message = "User with given id already exists";
    throw new functions.https.HttpsError("already-exists", message);
  }

  await setUserClaim({ email });

  await addStripeCustomer({ userId: userId, userEmail: email });

  await userDocRef.set({
    email,
    favoriteEventIds: [],
    favoriteClubIds: [],
    attendance: new Map<string, number>(),
    username: "",
  } as User);
}
