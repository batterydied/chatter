import type { User } from 'firebase/auth'
import { Navigate } from 'react-router-dom'
import axios from 'axios'
import { useEffect } from 'react'

type HomeProps = {
    user: User | null
    logOut: () => void,
}


const HomePage = ({user, logOut} : HomeProps) => {
    const fetchUserFromDB = async (email: string) => {
        const res = await axios.get(import.meta.env.VITE_BACKEND_API_URL + `user/${email}`)
        const data = res.data
        if(data.status == 'Success'){
            console.log(data.user)
        }else{
            console.log('Failed to retrieve user')
        }
    }
    useEffect(()=>{
        if(user && user.email){
            fetchUserFromDB(user.email)
        }
    }, [user])
    return (
        <>
            {user ? 
                <div>
                    <p>
                        Welcome, {user.email}
                    </p>
                    <button onClick={logOut} >
                        Log out
                    </button>
                </div>
                :
                <Navigate to='/'/>
            }
        </>
    )
}

export default HomePage