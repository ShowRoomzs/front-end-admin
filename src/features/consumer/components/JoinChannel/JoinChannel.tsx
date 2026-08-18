import {
  CONSUMER_PROVIDER_DOT_COLORS,
  CONSUMER_PROVIDER_LABELS,
} from "@/features/consumer/constants/params";
import type { ConsumerProvider } from "@/features/consumer/types/consumer";

interface JoinChannelProps {
  provider: ConsumerProvider;
}

/**
 * 가입 수단 표기 — 색점 + 사업자명. **배지가 아니다**(§25-3).
 *
 * 가입 수단은 상태가 아니라 속성이라 배지를 쓰면 상태색 체계를 침범한다. 이 컴포넌트를
 * `StatusBadge`로 바꾸지 말 것.
 *
 * 서버 enum이 늘어도 행이 비지 않도록, 매핑에 없는 값은 코드를 그대로 적고 중립 점을 쓴다.
 */
export default function JoinChannel(props: JoinChannelProps) {
  const { provider } = props;
  const label = CONSUMER_PROVIDER_LABELS[provider] ?? provider;
  const dotColor = CONSUMER_PROVIDER_DOT_COLORS[provider] ?? "#C7C9D1";

  return (
    <span className="inline-flex items-center gap-[5px] text-[12px] text-sz-n-700">
      <span
        aria-hidden
        className="size-[6px] shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      {label}
    </span>
  );
}
