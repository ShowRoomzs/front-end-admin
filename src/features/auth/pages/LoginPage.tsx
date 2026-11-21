import { useState } from "react";
import { useCookie } from "@/common/hooks/useCookie";
import { COOKIE_NAME } from "@/common/constants";
import { BTN_LG_PRIMARY } from "@/common/constants/buttonStyle";
import { INPUT_LG_CLASS } from "@/common/constants/dsStyle";
import { authService } from "@/features/auth/services/authService";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

/** 오류 입력 — 위험색 테두리 · 포커스 링도 위험색 바탕(UnlistModal 상세 사유와 같은 값) */
const INPUT_ERROR_CLASS =
  "border-sz-danger-text focus:border-sz-danger-text focus:ring-sz-danger-bg";

export default function LoginPage() {
  const navigate = useNavigate();
  const [, setAccessToken] = useCookie<string>(COOKIE_NAME.ACCESS_TOKEN);
  const [, setRefreshToken] = useCookie<string>(COOKIE_NAME.REFRESH_TOKEN);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const validateEmail = (email: string) => {
    if (!email) {
      return "ID를 입력해주세요";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "올바른 이메일 형식이 아닙니다";
    }
    return "";
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return "PASSWORD를 입력해주세요";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    setErrors({
      email: "",
      password: passwordError,
    });

    if (!passwordError) {
      const res = await authService.login(formData.email, formData.password);
      const { accessToken, refreshToken } = res;

      setAccessToken(accessToken);
      setRefreshToken(refreshToken);

      toast.success("로그인 성공");
      navigate("/");
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData((prev) => ({ ...prev, email }));
    setErrors((prev) => ({ ...prev, email: "" }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData((prev) => ({ ...prev, password }));
    setErrors((prev) => ({ ...prev, password: "" }));
  };

  const handleEmailBlur = () => {
    if (formData.email.length > 0) {
      const emailError = validateEmail(formData.email);
      setErrors((prev) => ({ ...prev, email: emailError }));
    }
  };

  const handlePasswordBlur = () => {
    if (formData.password.length > 0) {
      const passwordError = validatePassword(formData.password);
      setErrors((prev) => ({ ...prev, password: passwordError }));
    }
  };

  const isFormValid = formData.email && formData.password;

  return (
    <div className="flex min-h-screen items-center justify-center bg-sz-n-50 px-4">
      <div className="w-full max-w-[360px]">
        {/* 세 앱 합의(11-21) — 카드 r-md · 제목 DS h1 20px/600 · 입력 · 버튼 38px */}
        <div className="rounded-[8px] border border-sz-n-200 bg-white p-7">
          <div className="mb-6 text-center">
            <h1 className="text-[20px] font-semibold text-sz-n-900">
              SHOWROOMZ
            </h1>
            <p className="mt-1 text-[12px] text-sz-n-500">
              쇼룸즈 관리자 전용 어드민 페이지입니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-[12px] font-medium text-sz-n-600"
              >
                ID
              </label>
              <input
                id="email"
                placeholder="이메일"
                value={formData.email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                className={cn(
                  INPUT_LG_CLASS,
                  errors.email && INPUT_ERROR_CLASS
                )}
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-sz-danger-text">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-[12px] font-medium text-sz-n-600"
              >
                PASSWORD
              </label>
              <input
                id="password"
                type="password"
                placeholder="비밀번호"
                value={formData.password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                className={cn(
                  INPUT_LG_CLASS,
                  errors.password && INPUT_ERROR_CLASS
                )}
              />
              {errors.password && (
                <p className="mt-1 text-[11px] text-sz-danger-text">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isFormValid}
              className={cn(BTN_LG_PRIMARY, "mt-2 w-full")}
            >
              로그인
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-[11px] text-sz-n-400">
          © 2025. SHOWROOMZ Corp., Inc. All rights reserved
        </div>
      </div>
    </div>
  );
}
