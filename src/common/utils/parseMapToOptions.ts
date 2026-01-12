import type { Option } from "@/common/types/option";

export function parseMapToOptions<T extends Record<string, string>>(
  map: T,
  hasAllOption: boolean = false // null이 전체 조회인 경우 true
) {
  const options: Array<Option<string | null>> = Object.entries(map).map(
    ([key, value]) => ({
      label: value,
      value: key,
    })
  );

  if (hasAllOption) {
    options.unshift({
      label: "전체",
      value: null,
    });
  }
  return options;
}
