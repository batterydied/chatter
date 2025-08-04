import { ref, onValue, off } from "firebase/database";
import { useEffect } from "react";
import type { User } from 'firebase/auth'
import { rtdb } from "../config/firebase";
import type { DataSnapshot } from "firebase/database";
import axios from "axios";

type Status = {
    state: string,
    last_changed: number
}

const useSummaryStatus = (user: User | null)=>{

  useEffect(() => {
    if (!user) return;

    const userId = user.uid;

    const userStatusRef = ref(rtdb, `status/${userId}`);

    const handleStatus = async (snapshot: DataSnapshot) => {
      const sessions: Record<string, Status> = snapshot.val() || {};
      const isOnline = Object.values(sessions).some((s) => s.state === "online");

      try {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_API_URL}/user/${isOnline ? "online" : "offline"}`,
          { uid: userId }
        );
      } catch (error) {
        console.error("Failed to update user online status", error);
      }
    };

    onValue(userStatusRef, handleStatus)

    // Cleanup on unmount: mark offline
    return () => {
        off(userStatusRef, 'value', handleStatus);
    };
  }, [user]);
}

export default useSummaryStatus