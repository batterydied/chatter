import { db } from '../config/firebase.js'
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, getDoc } from "firebase/firestore"
import RelationSchema from '../models/relationModel.js'

class RelationController{
    async getSentPendingRequests(req, res){
        const queryRef = query(collection(db, 'relations'), 
            where('from', '==', req.params.id), 
            where('status', '==', 'pending')
        )
        try{
            const querySnapshot = await getDocs(queryRef)
            const requests = querySnapshot.docs.map(request => ({
                id: request.id,
                data: request.data()
            }))
            res.status(200).json({status: "Success", requests})
        }catch(e){
            res.status(400).json({status: "Failure", message: `Failed to get pending requests from user id: ${id}, error message: ${e}`})
        }
    }

    async getReceivedPendingRequests(req, res){
        const queryRef = query(collection(db, 'relation'), 
        where('to', '==', req.params.id),
        where('status', '==', 'pending'))
        try{
            const querySnapshot = await getDocs(queryRef)
            const requests = querySnapshot.docs.map(request => ({
                id: request.id,
                data: request.data()
            }))
            res.status(200).json({status: "Success", requests})
        }catch(e){
            res.status(400).json({status: "Failure", message: `Failed to get pending requests to user id: ${id}, error message: ${e}`})
        }
    }

    async getBlockedUsers(req, res){
        const queryRef = query(collection(db, 'relation'), 
        where('to', '==', req.params.id),
        where('status', '==', 'blocked'))
        try{
            const querySnapshot = await getDocs(queryRef)
            const requests = querySnapshot.docs.map(request => ({
                id: request.id,
                data: request.data()
            }))
            res.status(200).json({status: "Success", requests})
        }catch(e){
            res.status(400).json({status: "Failure", message: `Failed to get blocked users, error message: ${e}`})
        }
    }

    async getFriends(req, res){
        const queryRef = query(collection(db, 'relation'), 
        where('to', '==', req.params.id),
        where('status', '==', 'friend'))
        try{
            const querySnapshot = await getDocs(queryRef)
            const requests = querySnapshot.docs.map(request => ({
                id: request.id,
                data: request.data()
            }))
            res.status(200).json({status: "Success", requests})
        }catch(e){
            json.status(400).json({status: "Failure", message: `Failed to get friended users, error message: ${e}`})
        }
    }

    async sendFriendRequest(req, res){
        const from = req.body.from
        const to = req.body.to
        const request = {
            from,
            to,
            status: 'pending',
            createdAt: new Date().toISOString()
        }
        try{
            RelationSchema.parse(request)
            const docRef = await addDoc(collection(db, 'relations'), request)
            const data = {
                id: docRef.id,
                ...request
            }
            res.status(201).json({status: 'Success', message: 'Friend request sent', request: data})
        }catch(e){
            res.status(400).json({status: 'Failure', message: `Failed to send friend request to user: ${to}, error message: ${e}`})
        }
    }

    async confirmFriendRequest(req, res){
        const docId = req.params.docId
        const docRef = doc(db, 'relations', docId)
        try{
            const docSnapshot = await getDoc(docRef)
            if(!docSnapshot.exists()){
                res.status(404).json({status: 'Failure', message: `Failed to find friend request ${docId}`})
            }
            else{
                const data = docSnapshot.data()
                await deleteDoc(docRef)
                const collectionRef = collection(db, 'relations')

                await Promise.all([
                    addDoc(collectionRef, {
                        from: data.from,
                        to: data.to,
                        status: 'friend',
                        createdAt: new Date().toISOString(),
                    }),
                    addDoc(collectionRef, {
                        from: data.to,
                        to: data.from,
                        status: 'friend',
                        createdAt: new Date().toISOString(),
                    })
                ])

                res.status(200).json({status: 'Success', data: {
                    user1Id: data.from,
                    user2Id: data.to,
                    status: 'friend'
                }})
            }
        }catch(e){
            res.status(400).json({status: 'Failure', message: `Failed to confirm friend request, error: ${e}`})
        }
    }

    async denyFriendRequest(req, res){
        const docId = req.params.docId
        const docRef = doc(db, 'relations', docId)
        try{
            const docSnapshot = await getDoc(docRef)
            if(!docSnapshot.exists()){
                res.status(404).json({status: 'Failure', message: `Failed to find friend request ${docId}`})
            }
            else{
                await deleteDoc(docRef)
                res.status(200).json({status: 'Success'})
            }
        }
        catch(e){
            res.status(400).json({status: 'Failure', message: `Failed to deny friend request, error: ${e}`})
        }
    }

    async deleteFriend(req, res){
        const body = req.body
        const collectionRef = collection(db, 'relations')
        const queryRef1 = query(collectionRef, 
            where('from', '==', body.from), 
            where('to', '==', body.to),
            where('status', '==', 'friend')
        )
        const queryRef2 = query(collectionRef, 
            where('from', '==', body.to), 
            where('to', '==', body.from),
            where('status', '==', 'friend')
        )
        try{
            const docSnapshot1 = await getDocs(queryRef1)
            const docSnapshot2 = await getDocs(queryRef2)

            if(docSnapshot1.empty || docSnapshot2.empty){
                res.status(404).json({status: 'Failure', message: 'Friends not found'})
            }
            else{
                await Promise.all([
                    deleteDoc(docSnapshot1.docs[0].ref),
                    deleteDoc(docSnapshot2.docs[0].ref)
                ])
                res.status(200).json({status: 'Success', message: 'Friends deleted'})
            }
        }catch(e){
            res.status(400).json({status: 'Failure', message: `Failed to delete friend, error: ${e}`})
        }
    }
}

export default new RelationController()