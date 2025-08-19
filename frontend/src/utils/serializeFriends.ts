import { doc, getDoc, type QueryDocumentSnapshot } from "firebase/firestore"
import { db } from "../config/firebase"

const serializeFriends = async (docSnapshots: QueryDocumentSnapshot[]) => {
    return (await Promise.all(docSnapshots.map(async (snapshot)=>{
        const data = snapshot.data()
        const userDocRef = doc(db, 'users', data.from)
        const userDocSnapshot = await getDoc(userDocRef)
        if(!userDocSnapshot.exists()) return null
        const userData = userDocSnapshot.data()
        return {
            relationshipId: snapshot.id,
            friendId: data.from,
            username: userData.username,
            isOnline: userData.isOnline,
            pfpFilePath: userData.pfpFilePath
        }
    }))).filter((f)=>f !== null)
}

export default serializeFriends