import VList from "./DynamicVList"
import type { DynamicModalBaseProps } from "../../../utils/ModalBaseProps"

type RequestModalProps = DynamicModalBaseProps & {
    onClose: () => void,
    handleDeclineAll: () => Promise<void>
}

const RequestModal = ({cacheRef, listRef, renderer, data, onClose, handleDeclineAll} : RequestModalProps) => {
    return (
        <dialog id="request_modal" className="modal" onCancel={onClose}>
            <div className="modal-box">
                <form method="dialog">
                    {/* if there is a button in form, it will close the modal */}
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>✕</button>
                    <h3 className="font-bold text-lg">Incoming Requests</h3>
                    {data.length === 0 ?  <h3>There are no incoming requests.</h3> :
                    <div className='h-64'>
                        <VList cacheRef={cacheRef} listRef={listRef} data={data} renderer={renderer}/>
                    </div>
                    }
                </form>
                {data.length !== 0 &&
                <div className='mt-2 flex justify-end'>
                    <button className='btn bg-red-500' onClick={handleDeclineAll}>
                        Decline All
                    </button>
                </div>
                }
            </div>
        </dialog>
    )
}

export default RequestModal