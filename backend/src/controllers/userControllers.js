import UserSchema from "../models/userModel.js"
import { db } from '../config/firebase.js'
import { collection, addDoc, getDocs, getDoc, query, where, deleteDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore"

class UserController{
    async createUser(req, res){
        const user = {
            username: req.body.username,
            uid: req.body.uid,
            email: req.body.email,
            createdAt: serverTimestamp(),
            isOnline: true,
            pfpFilePath: '',
        }
        try{
            UserSchema.parse(user);
            const collectionRef = collection(db, 'users')
            const docRef = await addDoc(collectionRef, user)

            const doc = await getDoc(docRef)
            const createdAt = doc.data().createdAt
            const data = {
                id: doc.id,
                ...doc.data(),
                createdAt,
                lastSeenRequest: createdAt
            }
            res.status(201).json({status: 'Success', message: 'User created', user: data})
        }catch(e){
            res.status(500).json({status: 'Failed', message: 'Failed to create user', error: e instanceof Error ? e.message : e})
        }
    }

    async retrieveUserById(req, res) {
        try {
            const docRef = doc(db, 'users', req.params.id);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                return res.status(404).json({ status: 'Failed', message: 'User not found' });
            }

            const data = {
                id: docSnap.id,
                ...docSnap.data(),
                createdAt: docSnap.data().createdAt
            };

            res.status(200).json({ status: 'Success', user: data });
        } catch (e) {
            res.status(500).json({ status: 'Failure', message: 'Failed to retrieve user', error: e instanceof Error ? e.message : e });
        }
    }

    async retrieveUserByEmail(req, res){
        const queryRef = query(collection(db, 'users'), where('email', '==', req.params.email))
        try{
            const querySnapshot = await getDocs(queryRef)
            if(querySnapshot.empty){
                res.status(404).json({status: 'Failed', message: 'User not found'})
            }else{ 
                const data = [querySnapshot.docs[0]].map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt
                }))[0]
                res.status(200).json({status: 'Success', user: data})
            }
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to retrieve user', error: e instanceof Error ? e.message : e})
        }
    }

    async deleteUserById(req, res){
        try{
            const docRef = doc(db, 'users', req.params.id)
            const docSnap = await getDoc(docRef)

            if(!docSnap.exists()){
                res.status(404).json({status: 'Failed', message: 'User not found'})
                return
            }

            const [toSnapshot, fromSnapshot] = await Promise.all([
                getDocs(query(collection(db, 'relations'), where('to', '==', req.params.id))),
                getDocs(query(collection(db, 'relations'), where('from', '==', req.params.id)))
            ]);

            const relationshipDocs = [...toSnapshot.docs, ...fromSnapshot.docs]

            await Promise.all(relationshipDocs.map((doc) => deleteDoc(doc.ref)))

            await deleteDoc(docRef)
            res.status(200).json({status: 'Success', message: 'User deleted'})
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to delete user', error: e instanceof Error ? e.message : e})
        }
    }

    async updateUserById(req, res){
        const updatedFields = {
            isOnline: req.body.isOnline,
            username: req.body.username
        }
        const docRef = doc(db, 'users', req.params.id)
        try{
            const docSnap = await getDoc(docRef)
            if(!docSnap.exists()){
                res.status(404).json({status: 'Failed', message: 'User not found'})
                return
            }

            const data = docSnap.data()

            await updateDoc(docRef, {
                isOnline: updatedFields.isOnline,
                username: updatedFields.username || data.username,
                updatedAt: serverTimestamp()
            })
            res.status(200).json({status: 'Success', message: 'User updated'})
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to update user', error: e instanceof Error ? e.message : e})
        }
    }

    async updateStatusOffline(req, res){
        const { uid } = req.body

        const queryRef = query(collection(db, 'users'), where('uid', '==', uid))

        try{
            const querySnap = await getDocs(queryRef)

            if(querySnap.empty){
                res.status(404).json({status: 'Failed', message: 'User not found'})
                return
            }
            
            const firstSnap = querySnap.docs[0]
            const docRef = firstSnap.ref

            await updateDoc(docRef, {
                isOnline: false,
                updatedAt: serverTimestamp()
            })
            res.status(200).json({status: 'Success', message: 'User updated'})
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to update user', error: e instanceof Error ? e.message : e})
        }
    }

     async updateStatusOnline(req, res){
        const { uid } = req.body

        const queryRef = query(collection(db, 'users'), where('uid', '==', uid))

        try{
            const querySnap = await getDocs(queryRef)

            if(querySnap.empty){
                res.status(404).json({status: 'Failed', message: 'User not found'})
                return
            }
            
            const firstSnap = querySnap.docs[0]
            const docRef = firstSnap.ref

            await updateDoc(docRef, {
                isOnline: true,
                updatedAt: serverTimestamp()
            })
            res.status(200).json({status: 'Success', message: 'User updated'})
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to update user', error: e instanceof Error ? e.message : e})
        }
    }
}

export default new UserController()