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
            <>
                <div className='w-full flex justify-end'>
                    <CloseButton onClick={onClose}/>
                </div>
                <h3 className="font-bold text-lg">Incoming Requests</h3>
                {data.length === 0 ?  <h3>There are no incoming requests.</h3> :
                <div className='h-64'>
                    <VList cacheRef={cacheRef} listRef={listRef} data={data} renderer={renderer}/>
                </div>
                }
                {data.length !== 0 &&
                <div className='h-19 flex justify-end items-end'>
                    <button className='btn bg-red-500' onClick={handleDeclineAll}>
                        Decline All
                    </button>
                </div>
                }
            </>
        </Modal>
    )
}

export default RequestModal