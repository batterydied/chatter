import UserSchema from "../models/userModel.js"
import { db } from '../config/firebase.js'
import { collection, addDoc, getDocs, getDoc, query, where, deleteDoc, serverTimestamp } from "firebase/firestore"

class UserController{
    async createUser(req, res){
        const user = {
            username: req.body.name,
            email: req.body.email,
            createdAt: serverTimestamp()
        }
        try{
            UserSchema.parse(user);
            const collectionRef = collection(db, 'users')
            const docRef = await addDoc(collectionRef, user)

            const doc = await getDoc(docRef)
            const createdAt = doc.data().createdAt.toDate().toISOString()
            const data = {
                id: doc.id,
                ...doc.data(),
                createdAt
            }
            res.status(201).json({status: 'Success', message: 'User created', user: data})
        }catch(e){
            res.status(500).json({status: 'Failed', message: 'Failed to create user', error: e instanceof Error ? e.message : e})
        }
    }

    async retrieveUserByEmail(req, res){
        const queryRef = query(collection(db, 'users'), where('email', '==', req.params.email))
        try{
            const querySnapshot = await getDocs(queryRef)
            if(querySnapshot.empty){
                res.status(404).json({status: 'Failed', message: 'User not found'})
            }  
            else{ 
                const data = [querySnapshot.docs[0]].map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt.toDate().toISOString()
                }))[0]
                res.status(200).json({status: 'Success', user: data})
            }
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to retrieve user', error: e instanceof Error ? e.message : e})
        }
    }

    async deleteUserByEmail(req, res){
        const queryRef = query(collection(db, 'users'), where('email', '==', req.params.email))
        try{
            const querySnapshot = await getDocs(queryRef)
            if(querySnapshot.empty){
                res.status(404).json({status: 'Failed', message: 'User not found'})
                return
            }
            const data = [querySnapshot.docs[0]].map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate().toISOString()
            }))[0]

            const [toSnapshot, fromSnapshot] = await Promise.all([
                getDocs(query(collection(db, 'relations'), where('to', '==', data.id))),
                getDocs(query(collection(db, 'relations'), where('from', '==', data.id)))
            ]);

            const relationshipDocs = [...toSnapshot.docs, ...fromSnapshot.docs]

            await Promise.all(relationshipDocs.map((doc) => deleteDoc(doc.ref)))

            await deleteDoc(querySnapshot.docs[0].ref)
            res.status(200).json({status: 'Success', message: 'User deleted', user: data})
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to delete user', error: e instanceof Error ? e.message : e})
        }
    }
}

export default new UserController()