import { useCallback, useEffect, useRef, useState } from "react"

const useAutoScroll = <T>(data: T[])=>{
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)

    const isUserNearBottom = useCallback((container: HTMLDivElement | null, threshold = 100): boolean => {
        if (!container) return false;
            const { scrollTop, scrollHeight, clientHeight } = container;
            return scrollHeight - (scrollTop + clientHeight) <= threshold;
    }, []);

    useEffect(() => {
        if (shouldScrollToBottom && data.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'auto' });
        }
      }, [shouldScrollToBottom, data]);
    
    
    return { shouldScrollToBottom, scrollContainerRef, setShouldScrollToBottom, isUserNearBottom, bottomRef }
}


export default useAutoScroll