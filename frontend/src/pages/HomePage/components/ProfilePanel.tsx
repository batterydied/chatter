import { GearsIcon } from "../../../assets/icons"
import { type AppUser } from "../homePageHelpers"
import { getPfpByFilePath } from "../../../utils/getPfp"

type ProfilePanelProps = {
    appUser: AppUser | null,
    handleOpenSetting: ()=>void
}

const ProfilePanel = ({appUser, handleOpenSetting}: ProfilePanelProps) => {
    return (
        <div className='flex items-end h-1/6 w-full z-50'>
            <div className='flex w-full h-[100px] justify-between items-center bg-base-300 p-5 rounded-2xl outline-1 outline-base-100'>
                <div className='flex flex-row items-center'>
                    <div className="avatar avatar-online avatar-placeholder">
                        <div className="bg-neutral text-base-content w-16 rounded-full">
                            <img src={getPfpByFilePath(appUser!.pfpFilePath)} />
                        </div>
                    </div>
                    <div className='pl-2'>
                        <p className='text-sm text-left'>{appUser?.username}</p>
                        <p className='text-sm'>ID: {appUser?.id}</p>
                    </div>
                </div>
                <div className='hover:bg-neutral rounded-md p-1'>
                    <GearsIcon onClick={handleOpenSetting} className='text-gray-400 hover:text-neutral-content hover:cursor-pointer hover:animate-spin-once' size={32}/>
                </div>
            </div>
        </div>
    )

}

export default ProfilePanel