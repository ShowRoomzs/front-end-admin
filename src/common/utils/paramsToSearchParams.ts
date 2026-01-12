export function paramsToSearchParams<P extends object>(
  params: P
): URLSearchParams {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
    } else if (value !== "") {
      searchParams.set(key, String(value));
    }
  });

  return searchParams;
}
