import { Navigate } from 'react-router-dom'
import type { User } from 'firebase/auth'

type AuthProps = {
    user: User | null,
    logIn: ()=>void
}

const AuthPage = ({user, logIn} : AuthProps) => {
    
    return (
        <>
            <div>
                {user ? 
                    <Navigate 
                        to='/home'
                    />
                    :
                    <button onClick={logIn}>
                        Sign in with Google
                    </button>
                }
            </div>
        </>
    )
}

export default AuthPage