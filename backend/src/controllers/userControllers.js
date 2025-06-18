import UserSchema from "../models/userModel.js"
import { db } from '../config/firebase.js'
import { collection, addDoc, getDocs, query, where, deleteDoc } from "firebase/firestore"

class UserController{
    async createUser(req, res){
        try{
            const user = {
                username: 'Benson',
                email: 'bensonzheng2003@gmail.com',
                createdAt: new Date().toISOString()
            }
            console.log(user)
            UserSchema.parse(user);
            const docRef = await addDoc(collection(db, 'users'), user)
            const data = {
                id: docRef.id,
                ...user
            }
            res.status(201).json({status: 'Success', message: 'User created', user: data})
        }catch(e){
            res.status(400).json({status: 'Failed', message: `Failed to create user, error: ${e}`})
        }
    }

    async retrieveUser(req, res){
        const q = query(collection(db, 'users'), where('username', '==', 'Benson'))
        try{
            const snapshot = await getDocs(q)
            if(snapshot.empty){
                res.status(200).json({status: 'Failed', message: 'User not found'})
            }  
            else{ 
                const data = [snapshot.docs[0]].map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))[0]
                res.status(200).json({status: 'Success', user: data})
            }
        }catch(e){
            res.status(400).json({status: 'Failure', message: `Failed to retrieve user, error: ${e}`})
        }
    }

    async deleteUser(req, res){
        const q = query(collection(db, 'users'), where('username', '==', 'Benson'))
        try{
            const snapshot = await getDocs(q)
            if(snapshot.empty){
                res.status(200).json({status: 'Failed', message: 'User not found'})
            }
            const data = [snapshot.docs[0]].map(doc => ({
                id: doc.id,
                ...doc.data()
            }))[0]

            await deleteDoc(snapshot.docs[0].ref)
            res.status(200).json({status: 'Success', message: 'User deleted', user: data})
        }catch(e){
            res.status(400).json({status: 'Failure', message: `Failed to delete user, error: ${e}`})
        }
    }
}

export default new UserController()