import { supabase } from "../config/supabase"

export const getPfpByFilePath = (filePath: string) => {
    if(!filePath){
        return supabase.storage.from('avatars').getPublicUrl('default/default_user.png').data.publicUrl
    }
    return supabase.storage.from('avatars').getPublicUrl(filePath).data.publicUrl
}
