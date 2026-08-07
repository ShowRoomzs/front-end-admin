import { PurgedValue } from "@/common/components/DetailCard/DetailCard";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { Columns } from "@/common/components/Table/types";
import { formatDateOnly } from "@/common/utils/formatDate";
import type { CreatorApplicationInfo } from "@/features/creator/services/creatorService";
import { markDummy } from "@/features/creator/utils/dummyField";
import {
  formatElapsed,
  isSlaExceeded,
} from "@/features/creator/utils/elapsedTime";
import { getApplicationStatusBadge } from "@/features/creator/utils/statusBadge";

/**
 * 목록 6열 (기능요구사항 §9-1).
 *
 * 계정 아이디가 주요 식별 컬럼이다 — 초안에 있던 "활동명"은 도메인 모델에 없는
 * 값이라 제외됐고, 연락처는 상세(본인인증 카드)에서만 확인한다.
 */
export const CREATOR_APPLICATION_COLUMNS: Columns<CreatorApplicationInfo> = [
  {
    key: "accountId",
    label: "계정 아이디",
    render: (value) => (
      <span className="text-[13px] font-medium text-sz-n-900">
        @{value as string}
      </span>
    ),
  },
  {
    key: "realName",
    label: "실명",
    // 반려 건은 개인정보가 파기되어 값이 내려오지 않는다.
    // 계정 이름(닉네임)은 이 목록에 넣지 않는다 — 상세에서만 본다(§9-1).
    render: (_value, record) => {
      if (record.status === "REJECTED") {
        return <PurgedValue />;
      }
      return markDummy(record.realName) ?? "—";
    },
  },
  {
    key: "followerCount",
    label: "팔로워 수",
    render: (value) => {
      const followerCount = value as number | null;
      if (followerCount === null) {
        return <PurgedValue />;
      }
      return `${followerCount.toLocaleString()}명`;
    },
  },
  {
    key: "appliedAt",
    label: "신청일",
    render: (value) => (
      <span className="text-[11px] text-sz-n-500">
        {formatDateOnly(value as string)}
      </span>
    ),
  },
  {
    key: "appliedAt",
    label: "경과",
    align: "center",
    render: (_value, record) => {
      // 대기 중인 건은 "지금까지", 처리가 끝난 건은 "심사에 걸린 시간"을 보여준다
      const isProcessed = record.status !== "PENDING";
      const elapsed = formatElapsed(
        record.appliedAt,
        isProcessed ? record.processedAt : null
      );
      if (!elapsed) {
        return "—";
      }
      // SLA 강조는 대기 건에만 — 이미 종료된 건은 운영자가 조치할 게 없다
      return !isProcessed && isSlaExceeded(record.appliedAt) ? (
        <span className="font-semibold text-sz-warning-text">{elapsed}</span>
      ) : (
        elapsed
      );
    },
  },
  {
    key: "status",
    label: "상태",
    align: "center",
    render: (_value, record) => {
      const { variant, label } = getApplicationStatusBadge(
        record.status,
        record.appliedAt
      );
      return <StatusBadge variant={variant}>{label}</StatusBadge>;
    },
  },
];
