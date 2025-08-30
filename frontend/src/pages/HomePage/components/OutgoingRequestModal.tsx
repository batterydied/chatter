import { AutoSizer, List} from "react-virtualized"
import type { DynamicModalBaseProps } from "../../../utils/ModalBaseProps"
import Modal from "./Modal"

type OutgoingRequestModalProps = DynamicModalBaseProps & {
    onClose: () => void,
    isOpen: boolean
}

const OutgoingRequestModal = ({isOpen, cacheRef, listRef, renderer, data, onClose}: OutgoingRequestModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className='w-full h-full'>
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>✕</button>
                <h3 className="font-bold text-lg mt-4">Outgoing Requests</h3>
                {data.length === 0 ?  
                <div className='p-35'>
                    <h3>There are no outgoing requests.</h3> 
                </div>
                :
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
            </div>
        </Modal>
    )
}

export default OutgoingRequestModal