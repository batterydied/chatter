import { Navigate } from 'react-router-dom'
import { useAppContext } from '../../hooks/useAppContext'
import Spline from '@splinetool/react-spline';

const AuthPage = () => {
    const {user, logIn} = useAppContext()
    return (
        <div className='bg-black overflow-hidden flex justify-center items-center h-screen w-screen'>
            {user ? 
                <Navigate 
                    to='/home'
                />
                :
                <>  
                    <div className='absolute animate-fade-in'>
                        <div className='text-7xl font-bold hover:cursor-default'>
                            Chatter
                        </div>
                        <button onClick={logIn} className='border p-2 rounded-md border-transparent hover:border-accent hover:cursor-pointer'>
                            Sign in with Google
                        </button>
                    </div>
                    <div className='w-full h-full'>
                        <Spline scene="https://prod.spline.design/5DvbVl2fOfUp5M5R/scene.splinecode" />
                    </div>
                </>
                
            }
        </div>
    )
}

export default AuthPage