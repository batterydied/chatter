import { db } from '../config/firebase.js'
import { collection, addDoc, getDocs, query, where, deleteDoc } from "firebase/firestore"

class RelationController{
    async getMyPendingRequests(req, res){
        const q = query(collection(db, 'relations'), 
            where('from', '==', 'userId'), 
            where('status', '==', 'pending')
        )
        try{
            const snapshot = await getDocs(q)
            const requests = snapshot.docs.map(request => ({
                id: request.id,
                data: request.data()
            }))
            res.status(200).json({requests})
        }catch(e){
            res.status(400).json({error: `Failed to get pending requests from user id: ${id}, error message: ${e}`})
        }

    }

    async getPendingRequestsToMe(req, res){
        const q = query(collection(db, 'relation'), 
        where('to', '==', 'userId'),
        where('status', '==', 'pending'))
        try{
            const snapshot = await getDocs(q)
            const requests = snapshot.docs.map(request => ({
                id: request.id,
                data: request.data()
            }))
            res.status(200).json({requests})
        }catch(e){
            res.status(400).json({error: `Failed to get pending requests to user id: ${id}, error message: ${e}`})
        }
    }

    async getBlockedUsers(req, res){
        const q = query(collection(db, 'relation'), 
        where('to', '==', 'userId'),
        where('status', '==', 'blocked'))
        try{
            const snapshot = await getDocs(q)
            const requests = snapshot.docs.map(request => ({
                id: request.id,
                data: request.data()
            }))
            res.status(200).json({requests})
        }catch(e){
            res.status(400).json({error: `Failed to get blocked users, error message: ${e}`})
        }
    }

    async getFriends(req, res){
        const q = query(collection(db, 'relation'), 
        where('to', '==', 'userId'),
        where('status', '==', 'friend'))
        try{
            const snapshot = await getDocs(q)
            const requests = snapshot.docs.map(request => ({
                id: request.id,
                data: request.data()
            }))
            res.status(200).json({requests})
        }catch(e){
            json.status(400).json({error: `Failed to get friended users, error message: ${e}`})
        }
    }

    async sendFriendRequest(req, res){
        const request = {
            from,
            to,
            status: 'pending'
        }
        try{
            RelationSchema.parse(request)
            
        }catch(e){
            res.status(400).json({error: `Failed to send friend request to user: ${to}, error message: ${e}`})
        }
    }

}

export default new RelationController()