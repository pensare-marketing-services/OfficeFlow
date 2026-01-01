'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

export const useHorizontalScroll = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkForScrollPosition = useCallback(() => {
        const { current } = scrollRef;
        if (current) {
            const { scrollLeft, scrollWidth, clientWidth } = current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft !== scrollWidth - clientWidth);
        }
    }, []);

    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (scrollContainer) {
            checkForScrollPosition();
            scrollContainer.addEventListener('scroll', checkForScrollPosition);
            
            // Also check on resize
            const resizeObserver = new ResizeObserver(checkForScrollPosition);
            resizeObserver.observe(scrollContainer);

            return () => {
                scrollContainer.removeEventListener('scroll', checkForScrollPosition);
                resizeObserver.unobserve(scrollContainer);
            };
        }
    }, [checkForScrollPosition]);

    return { scrollRef, scrollLeft, scrollRight, canScrollLeft, canScrollRight };
};
