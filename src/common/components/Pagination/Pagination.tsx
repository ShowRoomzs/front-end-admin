import type { PageInfo } from "@/common/types/page";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

const INITIAL_DISPLAY_COUNT = 3;
const MIDDLE_DISPLAY_COUNT = 3;

export interface PaginationProps extends Omit<PageInfo, "content"> {
  onPageChange?: (page: number) => void;
}

export default function Pagination(props: PaginationProps) {
  const { currentPage, totalPages, onPageChange } = props;
  const [displayPage, setDisplayPage] = useState(currentPage);

  useEffect(() => {
    setDisplayPage(currentPage);
  }, [currentPage]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setDisplayPage(newPage);
      onPageChange?.(newPage);
    },
    [onPageChange]
  );

  const pageButtons = useMemo(() => {
    const renderPageButton = (page: number, isActive = false) => {
      return (
        <button
          key={`page-${page}`}
          className={cn(
            "min-w-[30px] min-h-[30px] rounded-[4px] text-[14px] px-[5px] font-medium transition-colors",
            isActive
              ? "bg-[#5468CD] text-white"
              : "bg-white text-[#666666] hover:bg-gray-50 border border-[#E0E0E0]"
          )}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </button>
      );
    };

    const buttons = [];

    if (displayPage <= INITIAL_DISPLAY_COUNT) {
      for (let i = 1; i <= INITIAL_DISPLAY_COUNT && i <= totalPages; i++) {
        buttons.push(renderPageButton(i, displayPage === i));
      }

      if (totalPages > INITIAL_DISPLAY_COUNT) {
        buttons.push(
          <span key="ellipsis" className="text-[#999999] px-2">
            ...
          </span>
        );
        buttons.push(renderPageButton(totalPages, displayPage === totalPages));
      }
    } else {
      const sideCount = Math.floor((MIDDLE_DISPLAY_COUNT - 1) / 2);
      const leftmostPage = Math.max(displayPage - sideCount, 2);
      const rightmostPage = Math.min(displayPage + sideCount, totalPages);

      buttons.push(renderPageButton(1, displayPage === 1));

      if (leftmostPage > 2) {
        buttons.push(
          <span key="ellipsis-start" className="text-[#999999] px-2">
            ...
          </span>
        );
      }

      for (let page = leftmostPage; page <= rightmostPage; page++) {
        if (page > 1 && page < totalPages) {
          buttons.push(renderPageButton(page, page === displayPage));
        }
      }

      if (rightmostPage < totalPages) {
        if (rightmostPage < totalPages - 1) {
          buttons.push(
            <span key="ellipsis-end" className="text-[#999999] px-2">
              ...
            </span>
          );
        }

        buttons.push(renderPageButton(totalPages, displayPage === totalPages));
      }
    }

    return buttons;
  }, [displayPage, totalPages, handlePageChange]);

  const isPreviousDisabled = displayPage <= 1;
  const isNextDisabled = displayPage >= totalPages;

  const handleClickPrevious = useCallback(() => {
    if (!isPreviousDisabled) {
      handlePageChange(displayPage - 1);
    }
  }, [isPreviousDisabled, handlePageChange, displayPage]);

  const handleClickNext = useCallback(() => {
    if (!isNextDisabled) {
      handlePageChange(displayPage + 1);
    }
  }, [isNextDisabled, handlePageChange, displayPage]);

  if (!totalPages || totalPages === 0) {
    return null;
  }

  return (
    <div className="flex flex-row items-center gap-[8px]">
      <button
        className={cn(
          "w-[30px] h-[30px] rounded-[4px] bg-white border border-[#E0E0E0] flex items-center justify-center transition-colors",
          isPreviousDisabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-50"
        )}
        onClick={handleClickPrevious}
        disabled={isPreviousDisabled}
      >
        <svg
          width="8"
          height="12"
          viewBox="0 0 8 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 10L2 6L6 2"
            stroke="#666666"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {pageButtons}

      <button
        className={cn(
          "w-[30px] h-[30px] rounded-[4px] bg-white border border-[#E0E0E0] flex items-center justify-center transition-colors",
          isNextDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
        )}
        onClick={handleClickNext}
        disabled={isNextDisabled}
      >
        <svg
          width="8"
          height="12"
          viewBox="0 0 8 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 2L6 6L2 10"
            stroke="#666666"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
