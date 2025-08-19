import type { RefObject } from "react"
import { AutoSizer, CellMeasurerCache, List, type ListRowRenderer } from "react-virtualized"
import type { FriendRequest } from "../homePageHelpers"

type RequestModalProps = {
    cacheRef: RefObject<CellMeasurerCache>,
    listRef: RefObject<List | null>,
    renderer: ListRowRenderer,
    data: FriendRequest[],
    setModalOpen: (open: boolean) => void,
    handleDeclineAll: () => Promise<void>
}
const RequestModal = ({cacheRef, listRef, renderer, data, setModalOpen, handleDeclineAll} : RequestModalProps) => {
    return (
        <dialog id="request_modal" className="modal" onCancel={()=>setModalOpen(false)}>
            <div className="modal-box">
                <form method="dialog">
                    {/* if there is a button in form, it will close the modal */}
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={()=>setModalOpen(false)}>✕</button>
                    <h3 className="font-bold text-lg">Incoming Requests</h3>
                    {data.length === 0 ?  <h3>There are no incoming requests.</h3> :
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