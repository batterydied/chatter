import { AutoSizer, List} from "react-virtualized"
import type { DynamicModalBaseProps } from "../../../utils/ModalBaseProps"

type OutgoingRequestModalProps = DynamicModalBaseProps & {
    setModalOpen: (open: boolean) => void
}

const OutgoingRequestModal = ({cacheRef, listRef, renderer, data, setModalOpen}: OutgoingRequestModalProps) => {
    return (
        <dialog id="outgoing_request_modal" className="modal" onCancel={()=>setModalOpen(false)}>
            <div className="modal-box">
                <form method="dialog">
                    {/* if there is a button in form, it will close the modal */}
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={()=>setModalOpen(false)}>✕</button>
                    <h3 className="font-bold text-lg">Outgoing Requests</h3>
                    {data.length === 0 ?  <h3>There are no outgoing requests.</h3> :
                    <div className='h-64'>
                        <AutoSizer>
                            {({width, height})=>
                            <List
                                width={width}
                                height={height}
                                rowHeight={cacheRef.current.rowHeight}
                                deferredMeasurementCache={cacheRef.current}
                                rowCount={data.length}
                                rowRenderer={renderer}
                                ref={listRef}
                            />
                            }           
                        </AutoSizer>
                    </div>
                    }
                </form>
            </div>
        </dialog>
    )
}

export default OutgoingRequestModal