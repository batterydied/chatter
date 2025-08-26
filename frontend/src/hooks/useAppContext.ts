import type { User } from "firebase/auth"
import { createContext, useContext } from "react"

type AppContextProps = {
    user: User | null,
    logIn: ()=>void,
    logOut: ()=>void
}

export const AppContext = createContext<AppContextProps | null>(null)

export const useAppContext = () => {
    const context = useContext(AppContext)
    if(!context) throw new Error('useAppContext must be wrap in AppContext')
    return context
}