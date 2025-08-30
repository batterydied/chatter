import VList from "./DynamicVList"
import type { DynamicModalBaseProps } from "../../../utils/ModalBaseProps"
import CloseButton from "./CloseButton"
import Modal from "./Modal"

type RequestModalProps = DynamicModalBaseProps & {
    onClose: () => void,
    handleDeclineAll: () => Promise<void>
    isOpen: boolean
}

const RequestModal = ({isOpen, cacheRef, listRef, renderer, data, onClose, handleDeclineAll} : RequestModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className='w-full h-full'>
                <div className='w-full flex justify-end'>
                    <CloseButton onClick={onClose}/>
                </div>
                <p className="font-bold text-lg m-2">Incoming Requests</p>
                {data.length === 0 ?  
                <div className='p-30'>
                    <p>There are no incoming requests.</p>
                </div> 
                :
                <div className='h-62'>
                    <VList cacheRef={cacheRef} listRef={listRef} data={data} renderer={renderer}/>
                </div>
                }
                {data.length !== 0 &&
                <div className='h-17 flex justify-end items-end'>
                    <button className='btn bg-red-500' onClick={handleDeclineAll}>
                        Decline All
                    </button>
                </div>
                }
            </div>
        </Modal>
    )
}

export default RequestModal