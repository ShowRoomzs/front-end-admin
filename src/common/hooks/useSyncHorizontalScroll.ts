import { useEffect, useRef, type RefObject } from "react";

export function useSyncHorizontalScroll(): [
  RefObject<HTMLDivElement | null>,
  RefObject<HTMLDivElement | null>
] {
  const refA = useRef<HTMLDivElement>(null);
  const refB = useRef<HTMLDivElement>(null);

  const isSyncing = useRef(false);

  useEffect(() => {
    if (!refA.current || !refB.current) {
      return;
    }

    const elementA = refA.current;
    const elementB = refB.current;

    const createScrollHandler = (
      source: HTMLDivElement,
      target: HTMLDivElement
    ) => {
      return () => {
        if (!isSyncing.current && target) {
          isSyncing.current = true;
          target.scrollTo({
            left: source.scrollLeft,
          });
          requestAnimationFrame(() => {
            isSyncing.current = false;
          });
        }
      };
    };

    const handleScrollA = createScrollHandler(elementA, elementB);
    const handleScrollB = createScrollHandler(elementB, elementA);

    elementA.addEventListener("scroll", handleScrollA);
    elementB.addEventListener("scroll", handleScrollB);

    return () => {
      elementA.removeEventListener("scroll", handleScrollA);
      elementB.removeEventListener("scroll", handleScrollB);
    };
  }, []);

  return [refA, refB];
}
