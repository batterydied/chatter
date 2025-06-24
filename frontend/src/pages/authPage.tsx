import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth';
import auth from '../config/firebase'

const AuthPage = () => {
    const [user, setUser] = useState<User| null>(null)
    auth.useDeviceLanguage()

    useEffect(()=>{
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user)
            } else {
                console.log('Not signed in')
            }
        });
        return unsubscribe
    }, [])
    
    const signIn = async () => {
        try{
            const provider = new GoogleAuthProvider()
            const result = await signInWithPopup(auth, provider)
            const user = result.user
            console.log(user)
        }catch(e){
            if(e instanceof Error){
                console.log(e.message)
            }else{
                console.log('An error occurred')
            }
        }
    }

    const logOut = async () => {
        await signOut(auth)
        setUser(null)
    }
    
    return (
        <>
            <div>
                {user ? 
                    <div>
                        <text>Welcome {user.email} </text>
                        <button onClick={logOut} >
                            Log out
                        </button>
                    </div>
                    :
                    <button onClick={signIn}>
                        Sign in with Google
                    </button>
                }
            </div>
        </>
    )

}

export default AuthPage