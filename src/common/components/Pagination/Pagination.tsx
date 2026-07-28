import type { PageInfo } from "@/common/types/page";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

const INITIAL_DISPLAY_COUNT = 3;
const MIDDLE_DISPLAY_COUNT = 3;

const PAGE_ITEM_BASE =
  "flex min-w-[26px] h-[26px] items-center justify-center rounded-[6px] px-[6px] text-[12px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

// 현재 페이지는 hover 스타일을 주지 않는다 — :hover 특이성이 활성 배경색을 덮어쓰기 때문
const PAGE_ITEM_IDLE =
  "text-sz-n-600 hover:bg-sz-n-100 disabled:hover:bg-transparent";
const PAGE_ITEM_ACTIVE = "bg-sz-accent-500 font-medium text-white";

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
            PAGE_ITEM_BASE,
            isActive ? PAGE_ITEM_ACTIVE : PAGE_ITEM_IDLE
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
          <span key="ellipsis" className="px-2 text-sz-n-400">
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
          <span key="ellipsis-start" className="px-2 text-sz-n-400">
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
            <span key="ellipsis-end" className="px-2 text-sz-n-400">
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
    <div className="flex flex-row items-center gap-1">
      <button
        className={cn(PAGE_ITEM_BASE, PAGE_ITEM_IDLE)}
        onClick={handleClickPrevious}
        disabled={isPreviousDisabled}
        aria-label="이전 페이지"
      >
        ‹
      </button>

      {pageButtons}

      <button
        className={cn(PAGE_ITEM_BASE, PAGE_ITEM_IDLE)}
        onClick={handleClickNext}
        disabled={isNextDisabled}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </div>
  );
}
