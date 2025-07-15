import UserSchema from "../models/userModel.js"
import { db } from '../config/firebase.js'
import { collection, addDoc, getDocs, getDoc, query, where, deleteDoc, serverTimestamp, doc } from "firebase/firestore"

class UserController{
    async createUser(req, res){
        const user = {
            username: req.body.name,
            email: req.body.email,
            createdAt: serverTimestamp(),
            status: 'Online'
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
                createdAt: docSnap.data().createdAt.toDate().toISOString()
            };

            res.status(200).json({ status: 'Success', user: data });
        } catch (e) {
            res.status(500).json({ status: 'Failure', message: 'Failed to retrieve user', error: e instanceof Error ? e.message : e });
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
}

export default new UserController()