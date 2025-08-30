import { AutoSizer, List} from "react-virtualized"
import type { DynamicModalBaseProps } from "../../../utils/ModalBaseProps"
import Modal from "./Modal"
import CloseButton from "./CloseButton"

type OutgoingRequestModalProps = DynamicModalBaseProps & {
    onClose: () => void,
    isOpen: boolean
}

const OutgoingRequestModal = ({isOpen, cacheRef, listRef, renderer, data, onClose}: OutgoingRequestModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className='w-full h-full'>
                <div className='w-full flex justify-end'>
                    <CloseButton onClick={onClose}/>
                </div>
                <p className="font-bold text-lg m-2">Outgoing Requests</p>
                {data.length === 0 ?  
                <div className='p-30'>
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