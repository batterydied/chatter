import { ref, onValue, onDisconnect, set, serverTimestamp } from "firebase/database";
import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { User } from 'firebase/auth'
import { rtdb } from "../config/firebase";

const usePresence = (user: User | null)=>{

  useEffect(() => {
    if (!user) return;

    const userId = user.uid;

    let sessionId = sessionStorage.getItem('firebaseSessionId');
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('firebaseSessionId', sessionId);
    }

    const userStatusRef = ref(rtdb, `status/${userId}/${sessionId}`);

    const isOffline = {
      state: 'offline',
      last_changed: serverTimestamp(),
    };

    const isOnline = {
      state: 'online',
      last_changed: serverTimestamp(),
    };

    const connectedRef = ref(rtdb, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snapshot) => {
        if (snapshot.val() === false) {
            // Client is offline
            return;
        }

        onDisconnect(userStatusRef).set(isOffline).catch(console.error)

        set(userStatusRef, isOnline).catch(console.error);
    });

    // Cleanup on unmount: mark offline
    return () => {
        unsubscribe();
        set(userStatusRef, isOffline).catch(console.error);
    };
  }, [user, rtdb]);
}

export default usePresence