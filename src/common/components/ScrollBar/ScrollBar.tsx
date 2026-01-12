import { cn } from "@/lib/utils";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

interface ScrollBarProps {
  direction: "horizontal" | "vertical";
  scrollRef: RefObject<HTMLDivElement | null>;
}

export default function ScrollBar(props: ScrollBarProps) {
  const { direction, scrollRef } = props;
  const [scrollPosition, setScrollPosition] = useState(0);
  const [thumbSize, setThumbSize] = useState(0);
  const [trackSize, setTrackSize] = useState(0);
  const [clientSize, setClientSize] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef(0);

  const getWrapperClassName = () => {
    if (direction === "horizontal") {
      return "w-full h-[6px]";
    }
    return "h-full w-[6px]";
  };

  const getThumbClassName = () => {
    const defaultCalss =
      "bg-[#D8D8D8] cursor-pointer hover:bg-[#999999] transition-colors";
    if (direction === "horizontal") {
      return cn(defaultCalss, "h-full", isDragging ? "bg-[#999999]" : "");
    }
    return cn(defaultCalss, "w-full", isDragging ? "bg-[#999999]" : "");
  };

  const updateScrollBar = useCallback(() => {
    if (!scrollRef.current) {
      return;
    }

    const scrollElement = scrollRef.current;

    if (direction === "horizontal") {
      setTrackSize(scrollElement.scrollWidth);
      const scrollWidth = scrollElement.scrollWidth;
      const clientWidth = scrollElement.clientWidth;
      setClientSize(clientWidth);
      const scrollLeft = scrollElement.scrollLeft;

      const thumbSizeRatio = clientWidth / scrollWidth;
      const newThumbSize = Math.max(thumbSizeRatio * clientWidth, 30);
      const maxScroll = scrollWidth - clientWidth;
      const scrollRatio = maxScroll > 0 ? scrollLeft / maxScroll : 0;
      const maxThumbPosition = clientWidth - newThumbSize;
      const newScrollPosition = scrollRatio * maxThumbPosition;

      setThumbSize(newThumbSize);
      setScrollPosition(newScrollPosition);
    } else {
      setTrackSize(scrollElement.scrollHeight);
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = scrollElement.clientHeight;
      setClientSize(clientHeight);
      const scrollTop = scrollElement.scrollTop;

      const thumbSizeRatio = clientHeight / scrollHeight;
      const newThumbSize = Math.max(thumbSizeRatio * clientHeight, 30);
      const maxScroll = scrollHeight - clientHeight;
      const scrollRatio = maxScroll > 0 ? scrollTop / maxScroll : 0;
      const maxThumbPosition = clientHeight - newThumbSize;
      const newScrollPosition = scrollRatio * maxThumbPosition;

      setThumbSize(newThumbSize);
      setScrollPosition(newScrollPosition);
    }
  }, [direction, scrollRef]);

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!thumbRef.current) {
      return;
    }
    const thumbRect = thumbRef.current.getBoundingClientRect();

    if (direction === "horizontal") {
      dragOffsetRef.current = e.clientX - thumbRect.left;
    } else {
      dragOffsetRef.current = e.clientY - thumbRect.top;
    }

    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !scrollRef.current || !trackRef.current) {
        return;
      }
      const trackRect = trackRef.current.getBoundingClientRect();
      const scrollBoxRect = scrollRef.current.getBoundingClientRect();
      const scrollElement = scrollRef.current;

      if (direction === "horizontal") {
        const thumbPosition =
          e.clientX - trackRect.left - dragOffsetRef.current;
        const trackWidth = trackRect.width;
        const maxThumbPosition = trackWidth - thumbSize;

        const clampedThumbPosition = Math.max(
          0,
          Math.min(thumbPosition, maxThumbPosition)
        );
        const scrollRatio =
          maxThumbPosition > 0 ? clampedThumbPosition / maxThumbPosition : 0;
        const maxScroll = scrollElement.scrollWidth - scrollElement.clientWidth;
        scrollElement.scrollLeft = scrollRatio * maxScroll;
      } else {
        const thumbPosition = e.clientY - trackRect.top - dragOffsetRef.current;
        const scrollBoxHeight = scrollBoxRect.height;
        const maxThumbPosition = scrollBoxHeight - thumbSize;

        const clampedThumbPosition = Math.max(
          0,
          Math.min(thumbPosition, maxThumbPosition)
        );
        const scrollRatio =
          maxThumbPosition > 0 ? clampedThumbPosition / maxThumbPosition : 0;
        const maxScroll =
          scrollElement.scrollHeight - scrollElement.clientHeight;
        scrollElement.scrollTop = scrollRatio * maxScroll;
      }
    },
    [isDragging, direction, scrollRef, thumbSize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) {
      return;
    }

    const updateAfterRender = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updateScrollBar();
        });
      });
    };

    updateAfterRender();
    scrollElement.addEventListener("scroll", updateScrollBar);

    const resizeObserver = new ResizeObserver(() => {
      updateScrollBar();
    });
    resizeObserver.observe(scrollElement);

    const mutationObserver = new MutationObserver(() => {
      updateScrollBar();
    });
    mutationObserver.observe(scrollElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => {
      scrollElement.removeEventListener("scroll", updateScrollBar);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [updateScrollBar, scrollRef]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (thumbSize === 0 || thumbSize === trackSize) {
    return null;
  }

  return (
    <div
      ref={trackRef}
      className={cn("bg-[#F4F4F4] relative", getWrapperClassName())}
      style={{
        [direction === "horizontal" ? "width" : "height"]:
          direction === "horizontal"
            ? `${clientSize > 0 ? clientSize : trackSize}px`
            : `${clientSize > 0 ? clientSize : trackSize}px`,
      }}
    >
      <div
        ref={thumbRef}
        className={getThumbClassName()}
        style={{
          [direction === "horizontal" ? "width" : "height"]: `${thumbSize}px`,
          transform:
            direction === "horizontal"
              ? `translateX(${scrollPosition}px)`
              : `translateY(${scrollPosition}px)`,
        }}
        onMouseDown={handleThumbMouseDown}
      />
    </div>
  );
}
