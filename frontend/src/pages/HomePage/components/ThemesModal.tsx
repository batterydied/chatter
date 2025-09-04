import { useEffect, useState } from "react"
import CloseButton from "./CloseButton"
import Modal from "./Modal"
import { useHomePageContext } from "../../../hooks/useHomePageContext"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../../../config/firebase"

type ThemesModalProps = {
    isOpen: boolean,
    onClose: ()=>void
}

const ThemesModal = ({isOpen, onClose}: ThemesModalProps) => {
    const AppUser = useHomePageContext()
    const [theme, setTheme] = useState(AppUser?.theme || 'dim')

    useEffect(()=>{
        const root = document.documentElement
        root.setAttribute('data-theme', theme)
        const userRef = doc(db, 'users', AppUser.id)
        updateDoc(userRef, {theme})
    },
    [AppUser.id, theme])
    
    const themes = ['dim', 'silk', 'synthwave', 'retro', 'cyberpunk', 'valentine', 'forest', 'caramellatte', 'abyss', 'night']
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className='flex flex-col w-full h-full'>
                <div className='w-full'>
                    <div className='w-full flex justify-end'>
                        <CloseButton onClick={onClose}/>
                    </div>
                    <p className='font-bold text-lg m-2'>Themes</p>
                </div>
                <div className='p-22'>
                        <div className='grid grid-cols-5 gap-2'>
                            {themes.map((t)=>
                                <button key={t} data-theme={t} className={`btn bg-neutral text-neutral-content`} onClick={()=>setTheme(t)}>
                                    {t}
                                </button>
                            )}
                        </div>
                </div>
            </div>
        </Modal>
    )
}

export default ThemesModal