import axios from 'axios'

export const fetchUserFromDB = async (email: string, setter: (isNewUser: boolean)=>void) => {
    try{
        const res = await axios.get(import.meta.env.VITE_BACKEND_API_URL + `user/${email}`)
        const data = res.data
        console.log(data.user)
        setter(false)
    }catch(e){
        if (axios.isAxiosError(e) && e.response?.status === 404) {
            setter(true);
        }else{
            console.log('Unknown error occurred')
        }
    }
}

export const createUser = async (email: string, username: string) => {
    try{
        const fields = {
            email,
            name: username
        }
        const res = await axios.post(import.meta.env.VITE_BACKEND_API_URL + `user`, fields)
        console.log(res.data)
    }catch(e){
        if (axios.isAxiosError(e)) {
            console.log(e.message)
        }else{
            console.log('Unknown error occurred')
        }
    }

}
