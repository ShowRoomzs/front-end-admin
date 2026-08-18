import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { Columns } from "@/common/components/Table/types";
import { formatDateOnly } from "@/common/utils/formatDate";
import JoinChannel from "@/features/consumer/components/JoinChannel/JoinChannel";
import type { ConsumerListItem } from "@/features/consumer/types/consumer";
import { getConsumerStatusBadge } from "@/features/consumer/utils/statusBadge";

/**
 * 시안 컬럼 폭 — 회원번호 140 / 닉네임 auto / 이름 110 / 휴대폰 160 / 가입 수단 130 /
 * 가입일 140 / 누적 주문 130 / 상태 140. `fitWidth`가 비례 배분하므로 합이 1000이다.
 * 4번째 열부터 가운데 정렬인 것도 시안 규칙이다(`.tb-cst td:nth-child(n+4)`).
 *
 * **정지일·탈퇴일 열은 일부러 없다.** 배지 아래 날짜를 붙이면 그 행만 2줄이 되어 50px
 * 균일 행이 깨지고, 균일 행이 훑어보기의 전제다. 필요해지면 배지 아래가 아니라 별도
 * 열로 넣는다(§25-3). 정지 사유도 목록에 두지 않고 상세에서 본다.
 */
export const CONSUMER_COLUMNS: Columns<ConsumerListItem> = [
  {
    key: "memberNo",
    label: "회원번호",
    width: 120,
    /*
      첫 열에 등폭 숫자로 둔다 — 회원번호가 상세 URL에만 있어 CS 대응 시 목록에서 찾을 수
      없던 문제를 푸는 열이라, 문의받은 번호를 눈으로 대조할 수 있어야 한다(§25-3).
    */
    render: (value) => (
      <span className="text-[13px] font-medium tabular-nums text-sz-n-900">
        {value as string}
      </span>
    ),
  },
  {
    key: "nickname",
    label: "닉네임",
    width: 175,
    render: (value) => (
      <span className="block truncate text-[12px] text-sz-n-900">
        {value as string}
      </span>
    ),
  },
  {
    key: "maskedName",
    label: "이름",
    width: 95,
    // 서버가 이미 가린 값이다 — 여기서 다시 가공하지 말 것(§25-1)
    render: (value) => (
      <span className="text-[12px] tracking-[0.02em] text-sz-n-900">
        {value as string}
      </span>
    ),
  },
  {
    key: "maskedPhone",
    label: "휴대폰",
    width: 140,
    align: "center",
    render: (value) => (
      <span className="text-[12px] tabular-nums tracking-[0.02em] text-sz-n-900">
        {value as string}
      </span>
    ),
  },
  {
    key: "providerType",
    label: "가입 수단",
    width: 115,
    align: "center",
    render: (_value, record) => <JoinChannel provider={record.providerType} />,
  },
  {
    key: "joinedAt",
    label: "가입일",
    width: 120,
    align: "center",
    render: (value) => (
      <span className="text-[11px] tabular-nums text-sz-n-500">
        {formatDateOnly(value as string)}
      </span>
    ),
  },
  {
    key: "orderCount",
    label: "누적 주문",
    width: 115,
    align: "center",
    // 0건은 회색으로 강등한다 — 주문 이력 있는 회원이 먼저 눈에 들어오게(§25-3)
    render: (value) => {
      const count = value as number;
      return (
        <span
          className={`text-[12px] tabular-nums ${
            count > 0 ? "font-semibold text-sz-n-900" : "text-sz-n-400"
          }`}
        >
          {count.toLocaleString()}건
        </span>
      );
    },
  },
  {
    key: "status",
    label: "상태",
    width: 120,
    align: "center",
    render: (value) => {
      const { variant, label } = getConsumerStatusBadge(
        value as ConsumerListItem["status"]
      );
      return <StatusBadge variant={variant}>{label}</StatusBadge>;
    },
  },
];
