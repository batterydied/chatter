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
        try{
            const res = await axios.get(import.meta.env.VITE_BACKEND_API_URL + `user/${email}`)
            const data = res.data
            console.log(data.user)
        }catch(e){
            if(e instanceof Error){
                console.log(e.message)
            }else{
                console.log('Unknown error occurred')
            }

            const body = {
                name: email,
                email
            }
            try{
                const res = await axios.post(import.meta.env.VITE_BACKEND_API_URL + `user/`, body)
                const data = res.data
                console.log(data)
            }catch(e){
                if(e instanceof Error){
                    console.log(e.message)
                }else{
                    console.log('Unknown error occurred')
                }
            }
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
                <div className='flex flex-row w-full h-full'>
                    <div className='list w-1/3 h-5/6 overflow-y-auto'>
                        <text className='list-row'> hi</text>
                        <text className='list-row'> hi</text>
                        <text className='list-row'> hi</text>
                        <text className='list-row'> hi</text>
                        <text className='list-row'> hi</text>
                        <text className='list-row'> hi</text>
                        <text className='list-row'> hi</text>
                        <text className='list-row'> hi</text>
                        <text className='list-row'> hi</text>
                        <text className='list-row'> hi</text>
                        <text className='list-row'> hi</text>
                        <text className='list-row'> hi</text>
                        <text className='list-row'> hi</text>
                        <text className='list-row'> hi</text>
                        <text className='list-row'> hi</text>
                    </div>
                    <div className='w-2/3'>
                        <p>
                        Welcome, {user.email}
                        </p>
                        <button onClick={logOut} >
                            Log out
                        </button>
                    </div>
                </div>
                :
                <Navigate to='/'/>
            }
        </>
    )
}

export default HomePage