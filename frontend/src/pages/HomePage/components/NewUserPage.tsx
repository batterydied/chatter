import { useState } from 'react'
import { createUser, type AppUser } from '../homePageHelpers'
import type { User } from 'firebase/auth'
import { truncateName } from '../../../utils/truncate'

type NewUserModalProps = {
    user: User,
    setIsNewUser: (state: boolean) => void,
    setAppUser: (appUser: AppUser) => void
    email: string

}
const NewUserModal = ({user, setIsNewUser, email, setAppUser}: NewUserModalProps) => {
    const [username, setUsername] = useState<string>('')

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const truncatedName = truncateName(event.target.value)
        setUsername(truncatedName)
    }

    const handleSubmit = async () => {
        await createUser(user.uid, email, username, setAppUser)
        setIsNewUser(false)
    }

    return (
        <>
            <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
                <legend className="fieldset-legend">Create Your Account</legend>

                <label className="label">Username</label>
                <input type="username" className="input" placeholder="Username" onChange={(e)=>handleChange(e)} value={username}/>

                <button className="btn btn-neutral mt-4" onClick={handleSubmit}>Create</button>
            </fieldset>
        </>
    )
}

export default NewUserModal