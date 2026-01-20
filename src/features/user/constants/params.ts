export const SOCIAL_PROVIDER_TYPE = {
  KAKAO: "카카오",
  NAVER: "네이버",
  APPLE: "애플",
  GOOGLE: "구글",
} as const;

export const USER_STATUS_TYPE = {
  NORMAL: "정상",
  DORMANT: "휴면",
  WITHDRAWN: "탈퇴",
} as const;

export const DEVICE_TYPE = {
  ANDROID: "안드로이드",
  IPHONE: "아이폰",
  DESKTOP_CHROME: "데스크탑 크롬",
  DESKTOP_EDGE: "데스크탑 엣지",
} as const;

export const LOGIN_STATUS = {
  SUCCESS: "성공",
  ABNORMAL: "이상",
} as const;
