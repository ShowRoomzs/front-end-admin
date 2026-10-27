import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import Btn from "@/features/contract/components/shared/Btn";
import { WarnBox } from "@/features/post/components/shared/PostParts";
import { POLICY_CHAPTER } from "@/features/post/constants/provisional";
import {
  useGetPolicyClauses,
  useGetSuspensionReasons,
} from "@/features/post/hooks/useAdminPost";

/*
  목록 머리 버튼 2개(시안 C1 `.navgrp` 「신고 유형 기준」 · 「서비스 운영정책 — 커뮤니티 장」)가 여는 읽기 전용 안내.
  운영정책 문서가 아직 없어(기획 X-23 · A-59) 문서 링크 대신 서버 코드 목록을 그대로 보인다 — 문서가 생기면 링크로 바꾼다.
*/

const ROW_CLASS =
  "flex items-start justify-between gap-3 border-b border-sz-n-100 py-[9px] text-[12px] last:border-b-0";

/** 신고 유형 기준 — 소비자 신고 사유 6종 + 운영자 전용 1종(조치 사유와 같은 축) */
export function ReportTypeGuideModal(props: { onClose: () => void }) {
  const { onClose } = props;
  const { data: reasons = [], isLoading } = useGetSuspensionReasons();

  return (
    <ModalShell
      isOpen
      title="신고 유형 기준"
      width={520}
      onClose={onClose}
      footer={
        <Btn variant="secondary" onClick={onClose}>
          닫기
        </Btn>
      }
    >
      <WarnBox tone="info" className="mb-3">
        소비자 신고 사유와 노출 중지 사유는 같은 축입니다 — 신고 사유별 조치율을
        그대로 봅니다. 「의료적 효능 표현」은 별도 사유가 아니라 허위 · 과장
        정보의 근거 규정(3조 4항)으로 구분합니다.
      </WarnBox>
      {isLoading ? (
        <p className="py-2 text-[12px] text-sz-n-500">불러오는 중…</p>
      ) : (
        reasons.map((item) => (
          <div key={item.code} className={ROW_CLASS}>
            <span className="font-medium text-sz-n-900">{item.label}</span>
            <span className="text-right text-[11px] text-sz-n-500">
              {[
                item.operatorOnly ? "운영자 전용 — 신고로 들어오지 않음" : null,
                item.detailRequired ? "상세 설명 필수" : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
        ))
      )}
    </ModalShell>
  );
}

/** 서비스 운영정책 — 커뮤니티 장 — 노출 중지 근거 규정 조항(가정값) */
export function PolicyChapterModal(props: { onClose: () => void }) {
  const { onClose } = props;
  const { data: clauses = [], isLoading } = useGetPolicyClauses();

  return (
    <ModalShell
      isOpen
      title={POLICY_CHAPTER}
      width={520}
      onClose={onClose}
      footer={
        <Btn variant="secondary" onClick={onClose}>
          닫기
        </Btn>
      }
    >
      <WarnBox tone="info" className="mb-3">
        【잠정】 조항 번호 · 문구는 운영정책 문서 확정 전 가정값입니다. 지난
        조치에는 조치 시점의 문구가 그대로 남습니다.
      </WarnBox>
      {isLoading ? (
        <p className="py-2 text-[12px] text-sz-n-500">불러오는 중…</p>
      ) : (
        clauses.map((item) => (
          <div key={item.code} className={ROW_CLASS}>
            <span className="text-sz-n-900">
              {item.label.replace(`${POLICY_CHAPTER} `, "")}
            </span>
          </div>
        ))
      )}
    </ModalShell>
  );
}
