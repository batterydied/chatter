import { AutoSizer, List } from "react-virtualized"
import type { StaticModalBaseProps } from "../../../utils/ModalBaseProps";

const VList = ({rowHeight, renderer, data, className }: StaticModalBaseProps) => {
    return (
        <AutoSizer>
            {({width, height})=>
                <List
                    width={width}
                    height={height}
                    rowHeight={rowHeight}
                    rowCount={data.length}
                    rowRenderer={renderer}
                    className={className}
                />
            }
        </AutoSizer>
    )
}

export default VList