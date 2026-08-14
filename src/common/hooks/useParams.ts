import type { BaseParams, SortOrder } from "@/common/types/page";
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface UseParams<P extends BaseParams> {
  localParams: P;
  params: P;
  updateParam: (key: keyof P, value: P[keyof P]) => void;
  /**
   * 여러 키를 한 번에 갱신한다.
   *
   * `updateParam`을 연달아 두 번 부르면 두 호출이 같은 `params` 클로저를 읽어
   * 앞의 갱신이 사라진다. "탭을 바꾸면서 페이지를 1로 되돌리는" 것처럼
   * 두 값이 함께 바뀌어야 하는 경우에는 이쪽을 쓴다.
   */
  updateParams: (updatedParams: Partial<P>) => void;
  updateLocalParam: (key: keyof P, value: P[keyof P]) => void;
  update: () => void;
  reset: () => void;
  handleSortChange: (sortKey: string, sortOrder: SortOrder) => void;
}

export function useParams<P extends BaseParams>(
  initialParams: P
): UseParams<P> {
  if (!initialParams) {
    throw new Error("initialParams is required");
  }

  const [params, setParams] = useState<P>(initialParams);
  const [localParams, setLocalParams] = useState<P>(initialParams);
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializedRef = useRef(false);

  const getInitialState = useCallback(() => {
    const result = { ...initialParams };

    Object.keys(initialParams).forEach((key) => {
      const initialValue = initialParams[key as keyof P];
      if (Array.isArray(initialValue)) {
        const urlValue = searchParams.getAll(key);
        if (urlValue.length > 0) {
          result[key as keyof P] = urlValue as P[keyof P];
        }
      } else {
        const urlValue = searchParams.get(key);
        if (urlValue !== null) {
          if (urlValue === "null") {
            result[key as keyof P] = null as P[keyof P];
          } else if (urlValue === "undefined") {
            result[key as keyof P] = undefined as P[keyof P];
          } else {
            result[key as keyof P] = urlValue as P[keyof P];
          }
        }
      }
    });

    return result;
  }, [initialParams, searchParams]);

  useEffect(() => {
    if (!isInitializedRef.current) {
      const initialState = getInitialState();
      setLocalParams(initialState);
      setParams(initialState);

      if (!searchParams.toString()) {
        const newSearchParams = paramsToSearchParams(initialParams);
        setSearchParams(newSearchParams, { replace: true });
      }

      isInitializedRef.current = true;
    }
  }, [getInitialState, initialParams, searchParams, setSearchParams]);

  const updateLocalParam = useCallback(
    (key: keyof P, value: P[keyof P]) => {
      setLocalParams((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [setLocalParams]
  );

  const updateParams = useCallback(
    (updatedParams: Partial<P>) => {
      const newParams = {
        ...params,
        ...updatedParams,
      };
      setParams(newParams);
      setLocalParams(newParams);
      setSearchParams(paramsToSearchParams(newParams));
    },
    [params, setSearchParams]
  );

  const updateParam = useCallback(
    (key: keyof P, value: P[keyof P]) => {
      const newParams = {
        ...params,
        [key]: value,
      };
      setParams(newParams);
      setLocalParams(newParams);
      setSearchParams(paramsToSearchParams(newParams));
    },
    [params, setSearchParams]
  );

  const update = useCallback(() => {
    const paramsWithResetPage = {
      ...localParams,
      page: 1,
    };
    const newSearchParams = paramsToSearchParams(paramsWithResetPage);
    setSearchParams(newSearchParams);
    setParams(paramsWithResetPage);
    setLocalParams(paramsWithResetPage);
  }, [localParams, setSearchParams]);

  const reset = useCallback(() => {
    setLocalParams(initialParams);
    setParams(initialParams);
    const newSearchParams = paramsToSearchParams(initialParams);
    setSearchParams(newSearchParams);
  }, [initialParams, setSearchParams]);

  const handleSortChange = useCallback(
    (sortKey: string, sortOrder: SortOrder) => {
      const newParams = {
        ...params,
        sortBy: sortKey,
        sortOrder: sortOrder,
      };
      updateParams(newParams);
    },
    [updateParams, params]
  );

  return {
    localParams,
    params,
    updateParam,
    updateParams,
    updateLocalParam,
    update,
    reset,
    handleSortChange,
  };
}
