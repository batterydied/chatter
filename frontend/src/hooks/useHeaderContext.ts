import { createContext, useContext } from "react";
import type { HeaderData } from "../pages/HomePage/homePageHelpers";

export const HeaderContext = createContext<HeaderData | null>(null)

export const useHeaderContext = () => {
    const headerData = useContext(HeaderContext)
    return headerData
}