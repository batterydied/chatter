import { Navigate } from 'react-router-dom'
import { useAppContext } from '../../hooks/useAppContext'


const AuthPage = () => {
    const {user, logIn} = useAppContext()
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