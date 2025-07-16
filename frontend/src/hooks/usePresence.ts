import { getDatabase, ref, onValue, onDisconnect, set, serverTimestamp } from "firebase/database";
import { getAuth } from "firebase/auth";
import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const usePresence = ()=>{
  const auth = getAuth();
  const db = getDatabase();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userId = user.uid;
    const sessionId = uuidv4(); // unique per tab/session
    const userStatusRef = ref(db, `status/${userId}/${sessionId}`);

    const isOffline = {
      state: 'offline',
      last_changed: serverTimestamp(),
    };

    const isOnline = {
      state: 'online',
      last_changed: serverTimestamp(),
    };

    const connectedRef = ref(db, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snapshot) => {
        if (snapshot.val() === false) {
            // Client is offline
            return;
        }

        onDisconnect(userStatusRef).set({
            state: 'offline',
            last_changed: serverTimestamp(),
        });

        set(userStatusRef, isOnline).catch(console.error);
    });

    // Cleanup on unmount: mark offline
    return () => {
        unsubscribe();
        set(userStatusRef, isOffline).catch(console.error);
    };
  }, [auth, db]);
}

export default usePresence