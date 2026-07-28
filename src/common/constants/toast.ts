/**
 * 토스트 규격 (웹 디자인시스템 v1.1 · 어드민 공통)
 * 우상단 top:72px right:24px · 좌측 3px 강조 보더 · 3초
 *
 * 기존 Tailwind 계열 상태색(#10b981 / #ef4444 / #3b82f6)은 v1.0 폐기와 함께 사용 금지.
 */
const BASE_STYLE = {
  background: "#fff",
  color: "var(--sz-n-900)",
  border: "1px solid var(--sz-n-200)",
  borderLeftWidth: "3px",
  borderRadius: "7px",
  boxShadow: "0 4px 16px rgba(26, 27, 31, 0.1)",
  padding: "11px 14px",
  minWidth: "260px",
  fontSize: "12px",
  fontWeight: "500",
};

/** Toaster containerStyle — 탑바(56px) 아래로 내려 겹치지 않게 한다 */
export const TOAST_CONTAINER_STYLE = {
  top: 72,
  right: 24,
};

export const TOAST_OPTIONS = {
  duration: 3000,
  style: {
    ...BASE_STYLE,
    borderLeftColor: "var(--sz-n-400)",
  },
  success: {
    duration: 3000,
    style: {
      ...BASE_STYLE,
      borderLeftColor: "var(--sz-success-text)",
    },
    iconTheme: {
      primary: "var(--sz-success-text)",
      secondary: "#fff",
    },
  },
  error: {
    duration: 4000,
    style: {
      ...BASE_STYLE,
      borderLeftColor: "var(--sz-danger-text)",
    },
    iconTheme: {
      primary: "var(--sz-danger-text)",
      secondary: "#fff",
    },
  },
  loading: {
    style: {
      ...BASE_STYLE,
      borderLeftColor: "var(--sz-accent-500)",
    },
    iconTheme: {
      primary: "var(--sz-accent-500)",
      secondary: "#fff",
    },
  },
};
