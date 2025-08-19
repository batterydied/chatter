import type { RefObject } from "react"
import { AutoSizer, CellMeasurerCache, List, type ListRowRenderer } from "react-virtualized"

type ScrollProps = {
    scrollTop: number;
    clientHeight: number;
    scrollHeight: number;
}
type ConversationDashboardProps = {
    cacheRef: RefObject<CellMeasurerCache>,
    listRef: RefObject<List | null>,
    renderer: ListRowRenderer,
    rowCount: number,
    className?: string,
    scrollToIndex?: number | undefined
    onScroll?: (props: ScrollProps) => Promise<void>
    rowKey?: (params: { index: number }) => string
}

const VList = ({cacheRef, listRef, renderer, rowCount, className, scrollToIndex, onScroll, rowKey}: ConversationDashboardProps) => {
    return (
        <AutoSizer>
            {({width, height})=>
                <List
                    width={width}
                    height={height}
                    rowHeight={cacheRef.current.rowHeight}
                    deferredMeasurementCache={cacheRef.current}
                    rowCount={rowCount}
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