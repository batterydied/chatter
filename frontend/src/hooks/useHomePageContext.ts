import { type AppUser } from "../pages/HomePage/homePageHelpers";
import { createContext, useContext } from "react";

export const HomePageContext = createContext<AppUser | null>(null)

export const useHomePageContext = () => {
    const appUser = useContext(HomePageContext)
    if(!appUser){
        throw new Error('useHomePageContext must be wrap inside HomePageContext')
    }
    return appUser
}