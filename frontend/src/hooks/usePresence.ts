import { ref, onValue, onDisconnect, set, serverTimestamp, off } from "firebase/database";
import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { User } from 'firebase/auth'
import { rtdb } from "../config/firebase";
import type { DataSnapshot } from "firebase/database";

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

    const handleConnectionChange = (snapshot: DataSnapshot) => {
      if (snapshot.val() === false) {
        return;
      }

      onDisconnect(userStatusRef).set(isOffline).catch(console.error);
      set(userStatusRef, isOnline).catch(console.error);
    };

    onValue(connectedRef, handleConnectionChange)

    // Cleanup on unmount: mark offline
    return () => {
        off(connectedRef, 'value', handleConnectionChange);
        set(userStatusRef, isOffline).catch(console.error);
    };
  }, [user]);
}

export default usePresence