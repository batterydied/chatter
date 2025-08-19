import { useState } from "react"
import { LogOutIcon } from "../../../assets/icons"
import { getPfpByFilePath, type AppUser } from "../homePageHelpers"
import truncateName from "../../../utils/truncateName"

type SettingModalProps = {
    logOut: () => void,
    user: AppUser
}


const SettingModal = ({logOut, user}: SettingModalProps) => {
    const [originalUsername, setOriginalUsername] = useState(user.username)
    const [originalPfpFilePath, setOriginalPfpFilePath] = useState(user.pfpFilePath)
    const [username, setUsername] = useState(user.username)
    const [pfpFilePath, setPfpFilePath] = useState(user.pfpFilePath)

    const isEdited = () => {
        return (originalUsername != username || originalPfpFilePath != pfpFilePath)
    }

    return (
        <dialog id="setting_modal" className="modal">
            <div className="modal-box">
                <form method="dialog">
                    {/* if there is a button in form, it will close the modal */}
                    <div className='w-full flex justify-end'>
                        <LogOutIcon className='hover:cursor-pointer text-red-800 hover:text-red-600' onClick={logOut}/>
                    </div>
                    <div className='flex flex-col justify-center items-center'>
                        <div className='avatar'>
                            <div className='w-30 rounded-full'>
                                <img src={getPfpByFilePath(user.pfpFilePath)} />
                            </div>
                        </div>

                        <input onChange={(e)=>setUsername(truncateName(e.target.value))} value={username} className='input m-5'/>
                        {isEdited() && <button className='btn'>Save Changes</button>}
                        <div className='mt-4 text-sm'>Press (esc) to exit out of setting</div>
                    </div>

                </form>
            </div>
        </dialog>
    )
}

export default SettingModal