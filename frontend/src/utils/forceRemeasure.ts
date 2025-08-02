import type { CellMeasurerCache } from 'react-virtualized';
import type { List } from 'react-virtualized';

const forceRemeasure = (cache: React.RefObject<CellMeasurerCache>, ref: React.RefObject<List | null>)=>{
    const cacheInstance = cache.current;
    const listInstance = ref.current;
    
    if (!cacheInstance || !listInstance) return;
    requestAnimationFrame(()=>{
        cacheInstance.clearAll();
        listInstance.recomputeRowHeights();
        listInstance.forceUpdateGrid();
    })
}

export default forceRemeasure