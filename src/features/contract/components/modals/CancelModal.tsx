import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import Btn from "@/features/contract/components/shared/Btn";
import { CheckListRow } from "@/features/contract/components/shared/CheckRow";
import { TermRow, Terms } from "@/features/contract/components/shared/Terms";
import { FLink } from "@/features/contract/components/detail/Rows";
import {
  CheckBox,
  MLabel,
  MODAL_SELECT_CLASS,
  MODAL_TEXTAREA_CLASS,
  ModalWarn,
  MODAL_SUMMARY_CLASS,
} from "@/features/contract/components/modals/ModalParts";
import DateTimeField from "@/features/contract/components/shared/DateTimeField";
import {
  CANCEL_REASONS,
  CANCEL_REQUEST_CHANNELS,
} from "@/features/contract/constants/labels";
import { SELECT_CHEVRON_STYLE } from "@/features/contract/constants/params";
import type {
  AdminContractCancelRequest,
  AdminContractDetail,
  ContractCancelRequestChannel,
  ContractCloseReasonCode,
} from "@/features/contract/types";
import {
  formatMonthDayTime,
  toParts,
  toServerDateTime,
  type DateTimeParts,
} from "@/features/contract/utils/datetime";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useState, type ReactNode } from "react";

dayjs.extend(utc);

type Requester = AdminContractCancelRequest["requesterType"];

const MEMO_MAX = 1000;

interface CancelModalProps {
  detail: AdminContractDetail;
  isPending: boolean;
  onClose: () => void;
  onOpenThread?: () => void;
  onConfirm: (body: AdminContractCancelRequest) => void;
}

function currentStateText(detail: AdminContractDetail) {
  const { contract, signature } = detail;
  if (contract.status === "CONCLUSION_PENDING") {
    return "체결 처리 대기 · 양측 서명 완료";
  }
  const brand = signature.brandSignedAt ? "브랜드 서명 완료" : "브랜드 대기";
  const creator = signature.creatorSignedAt
    ? "인플루언서 서명 완료"
    : "인플루언서 대기";
  return `서명 진행중 · ${brand} · ${creator}`;
}

/**
 * 시안 C6 — 직권 취소. 검토 통과 이후 양측에게 취소 버튼이 없어 **소통 스레드 요청 → 운영자 직권**으로만
 * 들어온다. 사유·설명은 양측에 그대로 통지되므로 둘 다 필수이고, API 미도입이라 모두싸인 요청이
 * 살아 있으므로 **모두싸인 취소 확인 체크**를 받는다. 필수 미입력 → 버튼만 비활성.
 */
export default function CancelModal(props: CancelModalProps) {
  const { detail, isPending, onClose, onOpenThread, onConfirm } = props;
  const { contract } = detail;
  const [reasonCode, setReasonCode] = useState<ContractCloseReasonCode | "">(
    ""
  );
  const [memo, setMemo] = useState("");
  const [withdrawn, setWithdrawn] = useState(false);
  // 요청자 — 서버가 스레드에서 판정할 수 없어 운영자가 기록한다(28-1). 직권이면 경로·시각이 없다
  const [requester, setRequester] = useState<Requester | "">("");
  const [channel, setChannel] = useState<ContractCancelRequestChannel | "">("");
  const [requestedParts, setRequestedParts] = useState<DateTimeParts>(() => ({
    ...toParts(null),
    date: "",
  }));

  const byParty = requester === "SELLER" || requester === "CREATOR";
  const requestedAt = byParty ? toServerDateTime(requestedParts) : null;
  // 요청 시각은 현재 이전이어야 한다(서버도 같은 규칙) — 규칙 위반도 필수 미충족처럼 버튼만 막는다
  const nowServer = dayjs.utc().format("YYYY-MM-DDTHH:mm:ss");
  const requesterValid =
    requester === "ADMIN" ||
    (byParty &&
      channel !== "" &&
      requestedAt !== null &&
      requestedAt <= nowServer);
  const canSubmit =
    reasonCode !== "" && memo.trim().length > 0 && withdrawn && requesterValid;

  const requesterName =
    requester === "SELLER"
      ? contract.brand.name
      : requester === "CREATOR"
        ? (contract.creator?.name ?? "인플루언서")
        : null;
  const channelLabel = CANCEL_REQUEST_CHANNELS.find(
    (item) => item.code === channel
  )?.label;

  // 시안 C6 요약의 「요청」 행 — 아래 입력값을 「무드코스메틱 · 소통 스레드 08.14 10:05」로 미리 보여 준다
  let requestSummary: ReactNode = (
    <span className="text-sz-n-400">아래에서 요청자를 기록하세요</span>
  );
  if (requester === "ADMIN") {
    requestSummary = "운영자 직권 — 요청자 없음";
  } else if (requesterName) {
    requestSummary = (
      <>
        {[
          requesterName,
          // 시안: 「소통 스레드 08.14 10:05」 — 경로와 시각은 한 칸 띄워 붙인다
          [channelLabel, requestedAt ? formatMonthDayTime(requestedAt) : null]
            .filter(Boolean)
            .join(" "),
        ]
          .filter(Boolean)
          .join(" · ")}
      </>
    );
  }

  return (
    <ModalShell
      isOpen
      title="직권 취소"
      width={520}
      onClose={onClose}
      bodyClassName="max-h-[70vh] overflow-y-auto p-5 text-[12px] leading-[1.7] text-sz-n-700"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="dangerSolid"
            disabled={!canSubmit}
            isLoading={isPending}
            onClick={() =>
              reasonCode !== "" &&
              requester !== "" &&
              onConfirm({
                signatureRequestWithdrawn: withdrawn,
                reasonCode,
                memo: memo.trim(),
                requesterType: requester,
                requestChannel: byParty && channel !== "" ? channel : null,
                requestedAt: byParty ? requestedAt : null,
              })
            }
          >
            직권 취소
          </Btn>
        </>
      }
    >
      <b className="font-semibold text-sz-n-900">{contract.title}</b>(
      {contract.contractNumber})를 <b className="font-semibold">취소</b>로
      종결합니다.
      <Terms className={MODAL_SUMMARY_CLASS}>
        <TermRow label="현재 상태" labelWidth={96} className="py-2">
          {currentStateText(detail)}
        </TermRow>
        <TermRow label="요청" labelWidth={96} className="py-2">
          <span className="tabular-nums">{requestSummary}</span>{" "}
          {onOpenThread && <FLink onClick={onOpenThread}>스레드 열기 ↗</FLink>}
        </TermRow>
      </Terms>
      <MLabel required>요청자</MLabel>
      <select
        className={MODAL_SELECT_CLASS}
        style={SELECT_CHEVRON_STYLE}
        value={requester}
        onChange={(event) => setRequester(event.target.value as Requester | "")}
      >
        <option value="">누가 취소를 요청했는지 선택하세요</option>
        <option value="SELLER">브랜드 · {contract.brand.name}</option>
        {contract.creator && (
          <option value="CREATOR">인플루언서 · {contract.creator.name}</option>
        )}
        <option value="ADMIN">운영자 직권 — 요청자 없음</option>
      </select>
      {byParty && (
        <div className="flex gap-3">
          <div className="w-[150px] shrink-0">
            <MLabel required>요청 경로</MLabel>
            <select
              className={MODAL_SELECT_CLASS}
              style={SELECT_CHEVRON_STYLE}
              value={channel}
              onChange={(event) =>
                setChannel(
                  event.target.value as ContractCancelRequestChannel | ""
                )
              }
            >
              <option value="">선택</option>
              {CANCEL_REQUEST_CHANNELS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <MLabel required>요청 시각</MLabel>
            <DateTimeField
              ariaLabel="요청 시각"
              value={requestedParts}
              onChange={setRequestedParts}
            />
          </div>
        </div>
      )}
      <MLabel required>취소 사유</MLabel>
      <select
        className={MODAL_SELECT_CLASS}
        style={SELECT_CHEVRON_STYLE}
        value={reasonCode}
        onChange={(event) =>
          setReasonCode(event.target.value as ContractCloseReasonCode | "")
        }
      >
        <option value="">사유를 선택하세요</option>
        {CANCEL_REASONS.map((reason) => (
          <option key={reason.code} value={reason.code}>
            {reason.label}
          </option>
        ))}
      </select>
      <MLabel required>양측에 전달할 설명</MLabel>
      <textarea
        className={MODAL_TEXTAREA_CLASS}
        style={{ minHeight: 64 }}
        maxLength={MEMO_MAX}
        placeholder="취소 사유와 이후 진행 방법을 적어 주세요."
        value={memo}
        onChange={(event) => setMemo(event.target.value)}
      />
      <MLabel required>확인</MLabel>
      <CheckBox>
        <CheckListRow checked={withdrawn} onChange={setWithdrawn}>
          모두싸인에서 <b className="font-semibold">서명 요청을 취소</b>했습니다
          — 여기서 종결해도 모두싸인의 요청은 자동으로 닫히지 않습니다
        </CheckListRow>
      </CheckBox>
      <ModalWarn>
        취소는 <b>종결 상태</b>입니다 — 되돌릴 수 없고 같은 조건으로 진행하려면
        브랜드가 <b>새 계약을 작성</b>해야 합니다. 사유와 설명은{" "}
        <b>양측에 통지</b>되고 요청 스레드에 답글로 남습니다. 이미 서명한 쪽의
        서명도 효력을 잃습니다.
      </ModalWarn>
    </ModalShell>
  );
}
