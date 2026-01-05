export const TOAST_OPTIONS = {
  // 기본 스타일
  duration: 3000,
  style: {
    background: "#fff",
    color: "#363636",
    padding: "16px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    fontSize: "14px",
    fontWeight: "500",
  },
  // success 스타일
  success: {
    duration: 3000,
    style: {
      background: "#10b981",
      color: "#fff",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#10b981",
    },
  },
  // error 스타일
  error: {
    duration: 4000,
    style: {
      background: "#ef4444",
      color: "#fff",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#ef4444",
    },
  },
  // loading 스타일
  loading: {
    style: {
      background: "#3b82f6",
      color: "#fff",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#3b82f6",
    },
  },
};
