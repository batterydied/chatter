import type { RefObject } from "react"
import { AutoSizer, CellMeasurerCache, List, type ListRowRenderer } from "react-virtualized"

type ConversationDashboardProps = {
    cacheRef: RefObject<CellMeasurerCache>,
    listRef: RefObject<List | null>,
    renderer: ListRowRenderer,
    rowCount: number,
    className?: string
}

const VList = ({cacheRef, listRef, renderer, rowCount, className}: ConversationDashboardProps) => {
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
                />
            }
        </AutoSizer>
    )
}

export default VList