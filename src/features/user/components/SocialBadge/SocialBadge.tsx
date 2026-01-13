import type { ProviderType } from "@/features/user/services/commonUserService";
import kakaoIcon from "@/common/assets/kakao.png";
import naverIcon from "@/common/assets/naver.png";
import appleIcon from "@/common/assets/apple.png";
import googleIcon from "@/common/assets/google.png";
import { SOCIAL_PROVIDER_TYPE } from "@/features/user/constants/params";

interface SocialBadgeProps {
  social: Exclude<ProviderType, null>;
}

export default function SocialBadge(props: SocialBadgeProps) {
  const { social } = props;

  const getIcon = (social: Exclude<ProviderType, null>) => {
    switch (social) {
      case "KAKAO":
        return <img src={kakaoIcon} alt="kakao" className="w-4 h-4" />;
      case "NAVER":
        return <img src={naverIcon} alt="naver" className="w-4 h-4" />;
      case "APPLE":
        return <img src={appleIcon} alt="apple" className="w-4 h-4" />;
      case "GOOGLE":
        return <img src={googleIcon} alt="google" className="w-4 h-4" />;
      default:
        return "-";
    }
  };
  return (
    <div className="flex flex-row gap-2 items-center">
      {getIcon(social)}
      <span>{SOCIAL_PROVIDER_TYPE[social]}</span>
    </div>
  );
}
