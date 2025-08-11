import { db } from '../config/firebase.js'
import { collection, addDoc, getDocs, query, where, deleteDoc, getDoc, doc, serverTimestamp } from "firebase/firestore"
import RelationSchema from '../models/relationModel.js'

class RelationController{
    async getSentPendingRequests(req, res){
        const { id } = req.params
        const queryRef = query(collection(db, 'relations'), 
            where('from', '==', id), 
            where('status', '==', 'pending')
        )
        try{
            const querySnapshot = await getDocs(queryRef)
            const requests = querySnapshot.docs.map(request => ({
                id: request.id,
                data: request.data(),
                createdAt: request.data().createdAt.toDate().toISOString()
            }))
            res.status(200).json({status: "Success", requests})
        }catch(e){
            res.status(500).json({status: "Failure", message: 'Failed to get pending requests from user id: ${id}', error: e instanceof Error ? e.message : e})
        }
    }

    async getReceivedPendingRequests(req, res){
        const { id } = req.params
        const queryRef = query(collection(db, 'relations'), 
        where('to', '==', id),
        where('status', '==', 'pending'))
        try{
            const querySnapshot = await getDocs(queryRef)
            const requests = querySnapshot.docs.map(request => ({
                id: request.id,
                data: request.data(),
                createdAt: request.data().createdAt.toDate().toISOString()
            }))
            res.status(200).json({status: "Success", requests})
        }catch(e){
            res.status(500).json({status: "Failure", message: 'Failed to get pending requests to user id: ${id}', error: e instanceof Error ? e.message : e})
        }
    }

    async getBlockedUsers(req, res){
        const { id } = req.params
        const queryRef = query(collection(db, 'relations'), 
        where('to', '==', id),
        where('status', '==', 'blocked'))
        try{
            const querySnapshot = await getDocs(queryRef)
            const requests = querySnapshot.docs.map(request => ({
                id: request.id,
                data: request.data(),
                createdAt: request.data().createdAt.toDate().toISOString()
            }))
            res.status(200).json({status: "Success", requests})
        }catch(e){
            res.status(500).json({status: "Failure", message: 'Failed to get blocked users', error: e instanceof Error ? e.message : e})
        }
    }

    async getFriends(req, res){
        const { id } = req.params
        const queryRef = query(collection(db, 'relations'), 
        where('to', '==', id),
        where('status', '==', 'friend'))
        try{
            const querySnapshot = await getDocs(queryRef)
            const friends = querySnapshot.docs.map(friend => ({
                id: friend.id,
                data: friend.data(),
                createdAt: friend.data().createdAt.toDate().toISOString()
            }))
            res.status(200).json({status: "Success", friends})
        }catch(e){
            json.status(500).json({status: "Failure", message: 'Failed to get friended users', error: e instanceof Error ? e.message : e})
        }
    }

    async sendFriendRequest(req, res){
        const { from, to } = req.body
        const request = {
            from,
            to,
            status: 'pending',
            createdAt: serverTimestamp()
        }
        try{
            RelationSchema.parse(request)
            const docRef = await addDoc(collection(db, 'relations'), request)
            const doc = await getDoc(docRef)
            const data = {
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate().toISOString()
            }
            res.status(201).json({status: 'Success', message: 'Friend request sent', request: data})
        }catch(e){
            res.status(500).json({status: 'Failure', message: `Failed to send friend request to user: ${to}`, error: e instanceof Error ? e.message : e})
        }
    }

    async confirmFriendRequest(req, res){
        const { docId } = req.params
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
                        createdAt: serverTimestamp(),
                    }),
                    addDoc(collectionRef, {
                        from: data.to,
                        to: data.from,
                        status: 'friend',
                        createdAt: serverTimestamp(),
                    })
                ])

                res.status(200).json({status: 'Success', data: {
                    user1Id: data.from,
                    user2Id: data.to,
                    status: 'friend'
                }})
            }
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to confirm friend request', error: e instanceof Error ? e.message : e})
        }
    }

    async declineFriendRequest(req, res){
        const { docId } = req.params
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
            res.status(500).json({status: 'Failure', message: 'Failed to decline friend request', error: e instanceof Error ? e.message : e})
        }
    }

    async deleteFriend(req, res){
        const { from, to } = req.body
        const collectionRef = collection(db, 'relations')
        const queryRef1 = query(collectionRef, 
            where('from', '==', from), 
            where('to', '==', to),
            where('status', '==', 'friend')
        )
        const queryRef2 = query(collectionRef, 
            where('from', '==', to), 
            where('to', '==', from),
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
            res.status(500).json({status: 'Failure', message: 'Failed to delete friend', error: e instanceof Error ? e.message : e})
        }
    }

    async blockUser(req, res){
        const { from, to } = req.body
        const collectionRef = collection(db, 'relations')
        const queryRef = query(collectionRef, 
            where('from', '==', from), 
            where('to', '==', to),
        )
        const reverseQuery = query(collectionRef, 
            where('from', '==', to), 
            where('to', '==', from)
        );
        try{
            const snapshot = await getDocs(queryRef)
            if(!snapshot.empty){
                await Promise.all(snapshot.docs.map((doc)=>deleteDoc(doc.ref)))
            }
            const reverseSnapshot = await getDocs(reverseQuery);
            if(!reverseSnapshot.empty){
                await Promise.all(reverseSnapshot.docs.map((doc)=>deleteDoc(doc.ref)))
            }
            const data = {
                from,
                to,
                status: 'blocked',
                createdAt: serverTimestamp()
            }
            RelationSchema.parse(data)

            await addDoc(collectionRef, data)
            res.status(200).json({status: 'Success', message: 'User blocked successfully'})
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to block user', error: e instanceof Error ? e.message : e})
        }
    }

    async unblockUser(req, res){
        const { from, to } = req.body
        const collectionRef = collection(db, 'relations')
        const queryRef = query(collectionRef, 
            where('from', '==', from),
            where('to', '==', to),
            where('status', '==', 'blocked')
        )
        try{
            const snapshot = await getDocs(queryRef)
            if(!snapshot.empty){
                await Promise.all(snapshot.docs.map((doc)=>deleteDoc(doc.ref)))
            }
            res.status(200).json({status: 'Success', message: `Successfully unblocked user ${to}`})
        }catch(e){
            res.status(500).json({status: 'Failure', message: `Failed to unblock user ${to}`, error: e instanceof Error ? e.message : e})
        }
    }
}

export default new RelationController()