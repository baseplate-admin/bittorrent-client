import { useEffect, useRef, useState } from "react";

interface IntersectionObserverArgs {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
}

export function useIntersectionObserver<T extends Element>({
    root = null,
    rootMargin = "0px",
    threshold = 0.1,
}: IntersectionObserverArgs = {}) {
    const ref = useRef<T | null>(null);
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsIntersecting(entry.isIntersecting);
            },
            { root, rootMargin, threshold },
        );

        observer.observe(node);

        return () => {
            observer.unobserve(node);
        };
    }, [ref.current, root, rootMargin, threshold]);

    return { ref, isIntersecting };
}
