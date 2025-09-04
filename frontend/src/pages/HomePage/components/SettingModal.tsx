import { useRef, useState } from "react"
import { CameraIcon, EditIcon, LogOutIcon} from "../../../assets/icons"
import { getPfpByFilePath } from "../../../utils/getPfp"
import { truncateName } from "../../../utils/truncate"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../../../config/firebase"
import { toast } from "sonner"
import AvatarEditorModal from "./AvatarEditorModal"
import { supabase } from "../../../config/supabase"
import { useHomePageContext } from "../../../hooks/useHomePageContext"
import Modal from "./Modal"
import CloseButton from "./CloseButton"


type SettingModalProps = {
    logOut: () => void,
    isOpen: boolean,
    onClose: () => void
}

const SettingModal = ({isOpen, onClose, logOut}: SettingModalProps) => {
    const user = useHomePageContext()
    const [username, setUsername] = useState(user.username)
    const [previewUrl, setPreviewUrl] = useState('')
    const [scale, setScale] = useState(1)
    const [imgBlob, setImgBlob] = useState<Blob | null>(null)
    const [shouldOpenAvatarEditor, setShouldOpenAvatarEditor] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)

    const handleUpdateUser = async () => {
        const userRef = doc(db, 'users', user.id)
        try{
            if(imgBlob){
                const fileName = `${user.id}/${Date.now().toString()}.png`
                const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, imgBlob, { upsert: true });

                if(uploadError){
                    console.error('Failed to upload to storage: ', uploadError)
                    return
                }
                
                if(user.pfpFilePath){
                    const { error: deleteError } = await supabase.storage
                    .from('avatars')
                    .remove([user.pfpFilePath])

                    if(deleteError) console.error('No previous avatar found')
                }

                await updateDoc(userRef, {username, pfpFilePath: fileName})
                setImgBlob(null)
                setPreviewUrl('')
            }else{
                await updateDoc(userRef, {username})
            }
            toast.success('Profile updated successfully!')
        }catch(e){
            console.error(e)
            toast.error('Failed to update profile')
        }
    }

    const isEdited = () => {
        return (user.username != username || (previewUrl && (user.pfpFilePath != previewUrl)))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setPreviewUrl(URL.createObjectURL(file))
        setShouldOpenAvatarEditor(true)
        e.target.value = '';
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className='flex flex-col w-full h-full'>
                <div className='w-full flex items-center justify-end'>
                    <CloseButton onClick={onClose}/>
                </div>
                <div className='flex flex-col justify-center items-center py-8'>
                    {shouldOpenAvatarEditor ? 
                    <AvatarEditorModal setShouldOpenAvatarEditor={setShouldOpenAvatarEditor} scale={scale} setScale={setScale} img={previewUrl} setPreviewUrl={setPreviewUrl} setImgBlob={setImgBlob}/>
                    :
                    (
                    <>
                        <div className='relative'>
                            <div className='avatar'>
                                <div className='w-30 rounded-full'>
                                    <img src={previewUrl || getPfpByFilePath(user.pfpFilePath)} />
                                </div>
                            </div>
                            <div className='absolute bottom-0 left-0 rounded-full p-2 hover:cursor-pointer bg-base-content' onClick={()=>inputRef.current?.click()}>
                                <CameraIcon className='text-base-100'/>
                            </div>
                        </div>
                        <input type="file" accept="image/*" className='hidden' ref={inputRef} onChange={handleFileChange}/>

                        <div className='flex justify-center items-center m-5 border-2 p-2 rounded-md  border-base-content focus-within:border-accent'>
                            <input onChange={(e)=>setUsername(truncateName(e.target.value))} value={username} className='focus:outline-none'/>
                            <EditIcon className='text-base-content'/>
                        </div>
                        <div className={`w-full ${(!isEdited() || username == '') && 'invisible'}`}>
                            <button className='btn' onClick={handleUpdateUser}>Save Changes</button>
                        </div>
                    </>
                    )}
                </div>
                {!shouldOpenAvatarEditor &&
                <div className='flex justify-end flex-grow items-end p-4'>
                    <div className='tooltip tooltip-secondary' data-tip="Logout">
                        <LogOutIcon className='text-red-700 hover:text-red-600 hover:cursor-pointer' onClick={logOut}/>
                    </div>
                </div>
                }
            </div>
        </Modal>
    )
}

export default SettingModal