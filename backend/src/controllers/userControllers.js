import UserSchema from "../models/userModel.js"
import { db } from '../config/firebase.js'
import { collection, addDoc, getDocs, query, where, deleteDoc } from "firebase/firestore"

class UserController{
    async createUser(req, res){
        const user = {
            username: req.body.name,
            email: req.body.email,
            createdAt: new Date().toISOString()
        }
        console.log(user)
        try{
            UserSchema.parse(user);
            const collectionRef = collect(db, 'users')
            const docRef = await addDoc(collectionRef, user)
            const data = {
                id: docRef.id,
                ...user
            }
            res.status(201).json({status: 'Success', message: 'User created', user: data})
        }catch(e){
            res.status(400).json({status: 'Failed', message: `Failed to create user, error: ${e}`})
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
                    ...doc.data()
                }))[0]
                res.status(200).json({status: 'Success', user: data})
            }
        }catch(e){
            res.status(400).json({status: 'Failure', message: `Failed to retrieve user, error: ${e}`})
        }
    }

    async deleteUserByEmail(req, res){
        const queryRef = query(collection(db, 'users'), where('email', '==', req.params.email))
        try{
            const querySnapshot = await getDocs(queryRef)
            if(snapshot.empty){
                res.status(404).json({status: 'Failed', message: 'User not found'})
            }
            const data = [querySnapshot.docs[0]].map(doc => ({
                id: doc.id,
                ...doc.data()
            }))[0]

            await deleteDoc(querySnapshot.docs[0].ref)
            res.status(200).json({status: 'Success', message: 'User deleted', user: data})
        }catch(e){
            res.status(400).json({status: 'Failure', message: `Failed to delete user, error: ${e}`})
        }
    }
}

export default new UserController()