import { AutoSizer, List } from "react-virtualized"
import type { ModalBaseProps } from "../../../utils/ModalBaseProps";

type ScrollProps = {
    scrollTop: number;
    clientHeight: number;
    scrollHeight: number;
}
type ConversationDashboardProps = ModalBaseProps & {
    scrollToIndex?: number | undefined
    onScroll?: (props: ScrollProps) => Promise<void>
    rowKey?: (params: { index: number }) => string
}

const VList = ({cacheRef, listRef, renderer, data, className, scrollToIndex, onScroll, rowKey}: ConversationDashboardProps) => {
    return (
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
                    className={className}
                    scrollToIndex={scrollToIndex}
                    onScroll={onScroll}
                    rowKey={rowKey}
                />
            }
        </AutoSizer>
    )
}

export default VList