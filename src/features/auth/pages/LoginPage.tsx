import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCookie } from "@/common/hooks/useCookie";
import { COOKIE_NAME } from "@/common/constants";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

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

    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    setErrors({
      email: emailError,
      password: passwordError,
    });

    if (!emailError && !passwordError) {
      // TODO: API 호출 구현 예정
      // const res = await authService.login({
      //   email: formData.email,
      //   password: formData.password,
      // })
      // const { accessToken, refreshToken } = res

      // 임시 토큰 설정 (개발 모드)
      setAccessToken("temp-access-token");
      setRefreshToken("temp-refresh-token");
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-8">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-wider mb-8">SHOWROOMZ</h1>
          <p className="text-gray-600 mb-2">
            쇼룸즈 관리자 전용 어드민 페이지입니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2 uppercase"
            >
              ID
            </label>
            <Input
              id="email"
              type="email"
              placeholder="이메일"
              value={formData.email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2 uppercase"
            >
              PASSWORD
            </label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호"
              value={formData.password}
              onChange={handlePasswordChange}
              onBlur={handlePasswordBlur}
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!isFormValid}
            className="w-full h-14 text-base bg-[#334155] hover:bg-[#1e293b] disabled:bg-gray-300"
          >
            로그인
          </Button>
        </form>

        <div className="mt-16 text-center text-sm text-gray-400">
          © 2025. SHOWROOMZ Corp., Inc. All rights reserved
        </div>
      </div>
    </div>
  );
}
