import { PurgedValue } from "@/common/components/DetailCard/DetailCard";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { Columns } from "@/common/components/Table/types";
import { formatDateOnly } from "@/common/utils/formatDate";
import type { CreatorApplicationInfo } from "@/features/creator/services/creatorService";
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
    key: "activityName",
    label: "활동명",
    // 반려 건은 개인정보가 파기되어 값이 내려오지 않는다
    render: (value) => (value as string | null) ?? <PurgedValue />,
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
      // 처리가 끝난 건은 경과 시간을 노출하지 않는다
      if (record.status !== "PENDING") {
        return "—";
      }
      const elapsed = formatElapsed(record.appliedAt);
      if (!elapsed) {
        return "—";
      }
      return isSlaExceeded(record.appliedAt) ? (
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
