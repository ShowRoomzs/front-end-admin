import DetailCard, {
  FieldRow,
} from "@/common/components/DetailCard/DetailCard";
import HistoryList, {
  type HistoryItem,
} from "@/common/components/HistoryList/HistoryList";
import RecordNav from "@/common/components/RecordNav/RecordNav";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import AnswerConfirmModal from "@/features/inquiry/components/AnswerConfirmModal/AnswerConfirmModal";
import InquiryThread from "@/features/inquiry/components/InquiryThread/InquiryThread";
import { useGetInquiryDetail } from "@/features/inquiry/hooks/useGetInquiryDetail";
import { useRegisterAnswer } from "@/features/inquiry/hooks/useRegisterAnswer";
import type {
  CsCategoryCode,
  InquiryDetailParams,
  InquiryHistoryEvent,
  InquiryStatusFilter,
} from "@/features/inquiry/types/inquiry";
import { getInquiryStatusBadge } from "@/features/inquiry/utils/statusBadge";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
  useSearchParams,
} from "react-router-dom";

const LIST_PATH = "/support/inquiry";

const HISTORY_TONE: Record<
  InquiryHistoryEvent["event"],
  { label: string; tone: HistoryItem["tone"] }
> = {
  RECEIVED: { label: "문의 접수", tone: "accent" },
  ANSWERED: { label: "답변 등록", tone: "muted" },
};

/**
 * A3~A6 — 1:1 문의 상세.
 *
 * 운영자가 하는 일은 **답변 작성 1회**뿐이다. 상태를 직접 바꾸는 조작은 없고,
 * 접수 → 답변완료 전이의 트리거는 답변 등록 성공 하나다(§17-1). 되돌리는 경로도 없다.
 */
export default function InquiryDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { inquiryId: inquiryIdParam } = useRouteParams<{ inquiryId: string }>();
  const [searchParams] = useSearchParams();
  const inquiryId = Number(inquiryIdParam);

  /*
    목록에서 보던 필터를 그대로 넘긴다. 서버가 이 범위 안에서 이전/다음을 계산하므로
    상세의 이동 순서가 목록 순서와 어긋날 수 없다.
  */
  const detailParams = useMemo<InquiryDetailParams>(
    () => ({
      status: (searchParams.get("status") ?? "ALL") as InquiryStatusFilter,
      type: (searchParams.get("type") || null) as CsCategoryCode | null,
      keyword: searchParams.get("keyword") ?? "",
    }),
    [searchParams]
  );

  const { data: detail, isLoading } = useGetInquiryDetail(
    inquiryId,
    detailParams
  );
  const { mutateAsync: registerAnswer, isPending: isSubmitting } =
    useRegisterAnswer();

  const [answer, setAnswer] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const goToList = useCallback(() => {
    navigate({ pathname: LIST_PATH, search: location.search });
  }, [navigate, location.search]);

  const handleSubmit = useCallback(async () => {
    const content = answer.trim();
    // 다른 운영자가 먼저 답한 캐시로 버튼이 살아 있을 수 있다
    if (!detail || detail.status !== "WAITING" || !content || isSubmitting) {
      return;
    }

    try {
      await registerAnswer({ inquiryId: detail.inquiryId, data: { content } });
      setIsConfirmOpen(false);
      setAnswer("");
      toast.success("답변을 등록했습니다. 소비자에게 발송됩니다.");
    } catch {
      // 실패해도 모달은 닫지 않는다 — 사유 토스트는 인터셉터가 띄웠고, 재시도가 가능해야 한다
      toast.error("답변 등록에 실패했습니다.");
    }
  }, [answer, detail, isSubmitting, registerAnswer]);

  if (isLoading || !detail) {
    return (
      <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
        {isLoading ? "불러오는 중…" : "문의를 찾을 수 없습니다."}
      </div>
    );
  }

  const isWaiting = detail.status === "WAITING";
  const { variant, label } = getInquiryStatusBadge(
    detail.status,
    detail.slaExceeded
  );

  // 서버가 이미 시간 역순으로 내려준다. 새 이벤트가 늘어도 화면이 죽지 않게 매핑에 없는 값은 흘린다
  const historyItems: Array<HistoryItem> = detail.history.map((item) => {
    const mapped = HISTORY_TONE[item.event];
    return {
      label: mapped?.label ?? item.event,
      tone: mapped?.tone ?? "muted",
      processedAt: item.occurredAt,
      processorName: item.actorLabel,
    };
  });

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-sz-n-900">
            1:1 문의 상세
          </h1>
          <p className="mt-0.5 text-[12px] text-sz-n-600">
            {detail.typeName} · {detail.inquiryNumber}
          </p>
        </div>

        <RecordNav
          onList={goToList}
          onPrev={
            detail.prevInquiryId
              ? () =>
                  navigate({
                    pathname: `${LIST_PATH}/${detail.prevInquiryId}`,
                    search: location.search,
                  })
              : undefined
          }
          onNext={
            detail.nextInquiryId
              ? () =>
                  navigate({
                    pathname: `${LIST_PATH}/${detail.nextInquiryId}`,
                    search: location.search,
                  })
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex flex-col gap-4">
          <DetailCard title="문의 정보" note={detail.inquiryNumber}>
            <FieldRow label="유형">
              <StatusBadge variant="neutral" hideDot>
                {detail.typeName}
              </StatusBadge>
            </FieldRow>
            {/*
              시안의 `회원 상세 보기` · `주문 상세 보기` 링크는 아직 붙이지 않았다 —
              어드민에 소비자 회원 상세와 주문 상세 라우트가 없어서(각각 목록만 있다)
              지금 링크를 걸면 없는 화면으로 보낸다. 두 화면이 생기면 여기에 연결한다.
            */}
            <FieldRow label="소비자">{detail.userName}</FieldRow>
            <FieldRow label="참조 주문">
              {/* 앱에서 주문 없이도 문의할 수 있어 선택값이다 — `—` 케이스가 정상이다 */}
              {detail.orderId ? (
                <span className="tabular-nums">#{detail.orderId}</span>
              ) : (
                <span className="text-sz-n-500">—</span>
              )}
            </FieldRow>
            <FieldRow label="접수일시">
              <span className="tabular-nums">
                {formatDateTimeShort(detail.createdAt)}
              </span>
            </FieldRow>
          </DetailCard>

          <DetailCard
            title="문의 스레드"
            note={
              detail.thread.length > 1 ? `${detail.thread.length}개` : undefined
            }
          >
            <InquiryThread messages={detail.thread} />

            {/*
              답변 입력은 접수 상태에서만 그린다. 답변완료 건에 빈 입력창을 남겨 두면
              "한 번 더 보낼 수 있다"고 읽히는데, 등록은 1회뿐이다(§17-4).
            */}
            {isWaiting && (
              <>
                <label
                  htmlFor="inquiry-answer"
                  className="mb-1 mt-4 block text-[12px] font-medium text-sz-n-600"
                >
                  답변<span className="ml-0.5 text-sz-danger-text">*</span>
                </label>
                <textarea
                  id="inquiry-answer"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  maxLength={2000}
                  placeholder="소비자에게 그대로 노출됩니다."
                  className="mb-2 min-h-[88px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-[7px] text-[13px] leading-relaxed text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
                />
              </>
            )}
          </DetailCard>
        </div>

        <div className="sticky top-0 flex flex-col gap-4">
          <DetailCard title="처리">
            <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3 pt-2">
              <span className="text-[12px] text-sz-n-500">현재 상태</span>
              <StatusBadge variant={variant}>{label}</StatusBadge>
            </div>

            <div className="pt-2">
              <MetaRow
                label="접수일시"
                value={
                  <span className="tabular-nums">
                    {formatDateTimeShort(detail.createdAt)}
                  </span>
                }
              />
              {detail.answeredAt && (
                <MetaRow
                  label="답변일시"
                  value={
                    <span className="tabular-nums">
                      {formatDateTimeShort(detail.answeredAt)}
                    </span>
                  }
                />
              )}
              {/*
                경과 라벨(미답변 경과 / 응답 소요)도 서버가 상태에 맞춰 내려준다.
                값·라벨 모두 서버 계산값을 그대로 쓴다 — 운영자 PC 시계가 틀어져도
                SLA 표시가 흔들리지 않아야 한다(§17-6).
              */}
              <MetaRow
                label={detail.elapsedLabel}
                value={
                  <span
                    className={
                      detail.slaExceeded ? "text-sz-warning-text" : undefined
                    }
                  >
                    {detail.elapsedText}
                  </span>
                }
              />
              {detail.operatorName && (
                <MetaRow label="처리자" value={detail.operatorName} />
              )}
            </div>

            {/*
              답변완료여도 카드를 없애지 않는다 — 상태에 따라 카드가 사라지면 좌우
              레이아웃이 점프한다. 버튼 자리만 안내문으로 바꾼다(§17-3).
            */}
            {isWaiting ? (
              <>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setIsConfirmOpen(true)}
                    // 필수 미입력은 에러 문구 없이 버튼 비활성만으로 표현한다(§17-4)
                    disabled={!answer.trim() || isSubmitting}
                    className="inline-flex h-9 w-full items-center justify-center rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:bg-sz-accent-600 disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-400"
                  >
                    답변 등록
                  </button>
                </div>
                <p className="mb-2 mt-2.5 text-[11px] leading-[1.55] text-sz-n-500">
                  등록하면 소비자에게 즉시 발송되며 수정·삭제할 수 없습니다.
                  등록과 동시에 접수 대기열과 GNB 배지에서 내려갑니다.
                </p>
              </>
            ) : (
              <p className="mb-2 mt-4 text-[11px] leading-[1.55] text-sz-n-500">
                답변이 등록된 건입니다. 답변은 1회로 종료되며 수정·삭제할 수
                없습니다. 소비자가 다시 물으면 새 문의로 접수됩니다.
              </p>
            )}
          </DetailCard>

          <DetailCard title="처리 이력" flushBody>
            <HistoryList items={historyItems} />
          </DetailCard>
        </div>
      </div>

      <AnswerConfirmModal
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        content={answer.trim()}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </>
  );
}

interface MetaRowProps {
  label: string;
  value: ReactNode;
}

/** 시안 `.mrow` — 라벨 좌 · 값 우 정렬의 메타 정보 한 줄 */
function MetaRow(props: MetaRowProps) {
  const { label, value } = props;

  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="text-sz-n-500">{label}</span>
      <span className="text-right font-medium text-sz-n-900">{value}</span>
    </div>
  );
}
