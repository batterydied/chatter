import { useRef, useState } from "react"
import { CameraIcon, EditIcon, LogOutIcon } from "../../../assets/icons"
import { getPfpByFilePath } from "../homePageHelpers"
import truncateName from "../../../utils/truncateName"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../../../config/firebase"
import { toast } from "sonner"
import AvatarEditorModal from "./AvatarEditorModal"
import { supabase } from "../../../config/supabase"
import { useHomePageContext } from "../../../hooks/useHomePageContext"


type SettingModalProps = {
    logOut: () => void,
}


const SettingModal = ({logOut}: SettingModalProps) => {
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
        <dialog id="setting_modal" className="modal" onClose={()=>setUsername(user.username)}>
            <div className="modal-box">
                <form method="dialog" onSubmit={(e) => e.preventDefault()}>
                    {/* if there is a button in form, it will close the modal */}
                    <div className='w-full flex justify-end'>
                        <LogOutIcon className='hover:cursor-pointer text-red-800 hover:text-red-600' onClick={logOut}/>
                    </div>
                    <div className='flex flex-col justify-center items-center'>
                        {shouldOpenAvatarEditor ? 
                        <AvatarEditorModal setShouldOpenAvatarEditor={setShouldOpenAvatarEditor} scale={scale} setScale={setScale} img={previewUrl} setPreviewUrl={setPreviewUrl} setImgBlob={setImgBlob}/>
                        :
                        (<div className='relative'>
                            <div className='avatar'>
                                <div className='w-30 rounded-full'>
                                    <img src={previewUrl || getPfpByFilePath(user.pfpFilePath)} />
                                </div>
                            </div>
                            <div className='group absolute bottom-0 left-0 bg-gray-500 rounded-full p-2 hover:cursor-pointer hover:bg-gray-400' onClick={()=>inputRef.current?.click()}>
                                <CameraIcon className='group-hover:text-gray-200 text-gray-300'/>
                            </div>
                        </div>)}

                        <input type="file" accept="image/*" className='hidden' ref={inputRef} onChange={handleFileChange}/>

                        <div className='flex justify-center items-center m-5 border-2 p-2 rounded-md  border-gray-500 focus-within:border-accent'>
                            <input onChange={(e)=>setUsername(truncateName(e.target.value))} value={username} className='focus:outline-none'/>
                            <EditIcon className='text-gray-500'/>
                        </div>
                    </div>
                </form>
                {isEdited() && username != '' && <button className='btn' onClick={handleUpdateUser}>Save Changes</button>}
                <div className='mt-4 text-sm'>Press (esc) to exit out of setting</div>
            </div>
        </dialog>
    )
}

export default SettingModal