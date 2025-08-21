import { Timestamp } from "firebase/firestore";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toDateSafe(ts: any): Date {
  if (ts instanceof Timestamp) {
    return ts.toDate();
  }
  if (ts && typeof ts.seconds === "number" && typeof ts.nanoseconds === "number") {
    return new Timestamp(ts.seconds, ts.nanoseconds).toDate();
  }
  if (typeof ts === "string") {
    return new Date(ts);
  }
  return new Date(0); // fallback
}