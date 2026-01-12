import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ScrollBar from "../ScrollBar/ScrollBar";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownItem {
  label: string;
  value: string;
}

interface DropdownProps {
  items: Array<DropdownItem>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function Dropdown(props: DropdownProps) {
  const {
    items,
    onChange,
    value,
    placeholder,
    className = "",
    disabled = false,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    placement: "down",
  });
  const [isMenuMounted, setIsMenuMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const handleDropdownMenuRef = useCallback((node: HTMLDivElement | null) => {
    dropdownMenuRef.current = node;
    setIsMenuMounted(!!node);
  }, []);

  const getDefaultWrapperClassName = () => {
    return cn(
      "rounded-[3px] border-[1px] pl-[12px] pr-[5px] py-[5.5px] bg-white flex flex-row items-center justify-between cursor-pointer w-full",
      disabled && "cursor-not-allowed"
    );
  };

  const label = useMemo(() => {
    const item = items.find((item) => item.value === value);
    if (item) {
      return item.label;
    }
    return placeholder;
  }, [items, placeholder, value]);

  const getDefaultTextClassName = () => {
    return "text-[12px] font-normal";
  };
  const getTextClassName = () => {
    if (isOpen || value) {
      return "text-[#333333]";
    }
    return "text-[#B3B3B3]";
  };

  const handleToggle = () => {
    if (disabled) {
      return;
    }
    if (!isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const isBelowHalf = rect.top > viewportHeight / 2; // 👈 화면 절반보다 아래인가?

      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
        placement: isBelowHalf ? "up" : "down",
      });
    }
    setIsOpen(!isOpen);
  };

  const handleItemClick = (itemValue: string) => {
    if (disabled) {
      return;
    }
    onChange(itemValue);
    setIsOpen(false);
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const target = document.getElementById(value);
    if (target) {
      target.scrollIntoView({ block: "center" });
    }
  }, [isOpen, value]);

  return (
    <>
      <div
        ref={wrapperRef}
        className={cn(getDefaultWrapperClassName(), className)}
        onClick={handleToggle}
      >
        <span className={cn(getDefaultTextClassName(), getTextClassName())}>
          {label}
        </span>
        <ChevronDown
          className={cn(
            "transition-transform duration-200 w-4 h-4",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={containerRef}
            className="dropdown-menu absolute bg-white border-[1px] rounded-[3px] shadow-lg z-[9999]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
              transform:
                position.placement === "up"
                  ? `translateY(calc(-100% - ${position.height + 2}px))`
                  : "translateY(0)",
            }}
          >
            <div className="relative">
              <div
                ref={handleDropdownMenuRef}
                className="max-h-[200px] overflow-y-auto scrollbar-hidden"
              >
                {items.map((item) => {
                  const isActive = item.value === value;
                  return (
                    <div
                      id={item.value}
                      key={item.value}
                      className={cn(
                        "px-[10px] py-[8px] cursor-pointer hover:bg-[#2C365C] hover:text-white text-[12px]",
                        isActive && "text-[#FFFFFF] bg-[#2C365C]",
                        !isActive && "text-[#666666]"
                      )}
                      onClick={() => handleItemClick(item.value)}
                    >
                      {item.label}
                    </div>
                  );
                })}
              </div>
              {isMenuMounted && dropdownMenuRef.current && (
                <div
                  className="absolute top-0 right-0"
                  style={{
                    height: `${Math.min(
                      dropdownMenuRef.current.clientHeight,
                      200
                    )}px`,
                  }}
                >
                  <ScrollBar direction="vertical" scrollRef={dropdownMenuRef} />
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
