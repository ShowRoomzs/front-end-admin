import { useState, useRef, useEffect, type RefObject } from "react";

export default function useMouse<T extends Element>(
  enterDelay: number = 50
): [RefObject<T | null>, boolean, boolean] {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const ref = useRef<T | null>(null);
  const enterTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseEnter = () => {
      if (enterTimeoutRef.current !== null) {
        clearTimeout(enterTimeoutRef.current);
      }
      enterTimeoutRef.current = window.setTimeout(() => {
        setIsHovered(true);
      }, enterDelay);
    };
    const handleMouseLeave = () => {
      if (enterTimeoutRef.current !== null) {
        clearTimeout(enterTimeoutRef.current);
      }
      setIsHovered(false);
      setIsActive(false);
    };
    const handleMouseDown = () => {
      setIsActive(true);
    };
    const handleMouseUp = () => {
      setIsActive(false);
    };

    const node = ref.current;

    if (node) {
      node.addEventListener("pointerdown", handleMouseDown);
      node.addEventListener("pointerup", handleMouseUp);
      node.addEventListener("pointerover", handleMouseEnter);
      node.addEventListener("pointerleave", handleMouseLeave);
    }
    return () => {
      if (node) {
        node.removeEventListener("pointerdown", handleMouseDown);
        node.removeEventListener("pointerup", handleMouseUp);
        node.removeEventListener("pointerover", handleMouseEnter);
        node.removeEventListener("pointerleave", handleMouseLeave);
      }
      if (enterTimeoutRef.current !== null) {
        clearTimeout(enterTimeoutRef.current);
      }
    };
  }, [enterDelay]);

  return [ref, isHovered, isActive];
}
