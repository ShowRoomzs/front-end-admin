import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { DEVICE_LABEL } from "@/features/influencerMember/constants/params";
import type { AdminCreatorDetail } from "@/features/influencerMember/types";
import {
  ExternalAnchor,
  FieldGrid,
  Gone,
  MemberCard,
} from "@/features/memberShared/components/parts";
import {
  ELINK_CLASS,
  FLINK_CLASS,
  T_SUB_CLASS,
} from "@/features/memberShared/constants/styles";
import {
  eventDate,
  eventDateTime,
  eventMonthDayTime,
  eventTime,
} from "@/features/memberShared/utils/format";
import { useEffect, useState } from "react";

/** 「09:41 후 잠금」 — 서버 남은 초에서 1초씩 센다. 0이 되면 다시 읽어 마스킹으로 돌아간다 */
function LockCountdown(props: { seconds: number; onExpire: () => void }) {
  const { seconds, onExpire } = props;
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const timer = window.setInterval(
      () => setLeft((value) => Math.max(0, value - 1)),
      1000
    );
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (left === 0) onExpire();
  }, [left, onExpire]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <span className="tabular-nums opacity-75">
      · {mm}:{ss} 후 잠금
    </span>
  );
}

const UNMASK_BTN =
  "inline-flex h-6 cursor-pointer items-center gap-[5px] rounded-[6px] border border-sz-n-300 bg-white px-[9px] text-[11px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:text-sz-n-900 disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400";

interface InfluencerTopCardsProps {
  detail: AdminCreatorDetail;
  onUnmask: () => void;
  onLock: () => void;
  onMaskExpired: () => void;
  onOpenChangeRequest: (changeRequestId: number) => void;
}

/**
 * 좌측 상단 4카드 — 기본 · 본인확인(마스킹) · 사업자 · 정산(시안 18 rev.2).
 * 서버가 수집하지 않는 값(통신사 · 최근 갱신 · 상호 · 대표자 · 사업장 주소)은 null이라 행을 그리지 않는다.
 */
export function InfluencerTopCards(props: InfluencerTopCardsProps) {
  const { detail, onUnmask, onLock, onMaskExpired, onOpenChangeRequest } =
    props;
  const { basic, identity, unmask, business, settlementAccount } = detail;
  const withdrawn = detail.status === "WITHDRAWN";
  const device = basic.lastLoginDevice
    ? DEVICE_LABEL[basic.lastLoginDevice]
    : null;
  const isBusiness = business.businessType === "BUSINESS";
  const pendingChange = settlementAccount.pendingBusinessTypeChange;

  return (
    <>
      <MemberCard
        title="기본 정보"
        note={<span className="tabular-nums">{detail.memberNo}</span>}
      >
        <FieldGrid
          head={
            <div className="mb-1 flex items-center gap-3.5 border-b border-sz-n-100 pb-3">
              {basic.profileImageUrl ? (
                <img
                  src={basic.profileImageUrl}
                  alt=""
                  className="h-[52px] w-[52px] shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-sz-n-200 text-center text-[11px] leading-tight text-sz-n-500">
                  쇼룸
                  <br />
                  이미지
                </div>
              )}
              <div>
                <div className="text-[16px] font-semibold">
                  {basic.showroomName ?? "—"}
                </div>
                <div className="mt-0.5 text-[11px] tabular-nums text-sz-n-500">
                  {detail.memberNo}
                  {basic.showroomPublic && basic.showroomAddress ? (
                    <> · showroomz.kr/{basic.showroomAddress}</>
                  ) : (
                    withdrawn && (
                      <span className="text-sz-n-500"> · 쇼룸 비공개</span>
                    )
                  )}
                </div>
              </div>
            </div>
          }
          items={[
            { label: "쇼룸명", value: <b>{basic.showroomName ?? "—"}</b> },
            {
              label: "쇼룸 주소",
              value: basic.showroomUrl ? (
                <ExternalAnchor
                  url={basic.showroomUrl}
                  label={`showroomz.kr/${basic.showroomAddress ?? ""}`}
                />
              ) : basic.showroomAddress ? (
                // 탈퇴(비공개)면 링크가 아니다
                <Gone>showroomz.kr/{basic.showroomAddress} · 비공개</Gone>
              ) : (
                "—"
              ),
            },
            {
              label: "인스타",
              value: basic.instagramUrl ? (
                <ExternalAnchor url={basic.instagramUrl} />
              ) : withdrawn ? (
                <Gone />
              ) : (
                "—"
              ),
            },
            {
              label: "업무용 이메일",
              value: (
                <span className="tabular-nums">
                  {basic.businessEmail ?? "—"}
                </span>
              ),
            },
            {
              label: "가입일",
              value: (
                <span className="tabular-nums">
                  {eventDate(basic.joinedAt)}
                </span>
              ),
            },
            {
              label: "입점 승인일",
              value: (
                <span className="tabular-nums">
                  {eventDate(basic.onboardingApprovedAt)}
                </span>
              ),
            },
            {
              label: "최근 로그인",
              value: (
                <span className="tabular-nums">
                  {eventDateTime(basic.lastLoginAt)}
                  {device && <span className={T_SUB_CLASS}> · {device}</span>}
                </span>
              ),
            },
          ]}
        />
      </MemberCard>

      <MemberCard
        title="본인확인 정보"
        note={identity.destroyed ? "탈퇴 시 파기" : undefined}
        actions={
          !identity.destroyed &&
          (unmask.unmasked ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-sz-warning-bg px-2.5 py-[3px] text-[11px] font-medium text-sz-warning-text">
                해제됨 · {unmask.operatorName ?? "운영자"} ·{" "}
                {eventTime(unmask.unmaskedAt)}
                {unmask.remainingSeconds !== null && (
                  <LockCountdown
                    key={unmask.unmaskedAt ?? ""}
                    seconds={unmask.remainingSeconds}
                    onExpire={onMaskExpired}
                  />
                )}
              </span>
              <button type="button" className={UNMASK_BTN} onClick={onLock}>
                지금 잠금
              </button>
            </>
          ) : (
            <button
              type="button"
              className={UNMASK_BTN}
              disabled={!unmask.allowed}
              title={unmask.allowed ? undefined : "최고관리자 한정"}
              onClick={onUnmask}
            >
              마스킹 해제
            </button>
          ))
        }
      >
        {identity.destroyed ? (
          <FieldGrid
            items={[
              { label: "이름", value: <Gone /> },
              { label: "생년월일", value: <Gone /> },
              { label: "휴대폰", value: <Gone /> },
              {
                label: "CI/DI",
                value: (
                  <>
                    <Gone>파기 여부 미확정</Gone>{" "}
                    <span className={T_SUB_CLASS}>(법률 자문 대기)</span>
                  </>
                ),
              },
            ]}
          />
        ) : (
          <FieldGrid
            items={[
              { label: "이름", value: identity.name ?? "—" },
              {
                label: "생년월일",
                value: (
                  <>
                    {identity.birthday ?? "—"}
                    {identity.age !== null && (
                      <span className={T_SUB_CLASS}> ({identity.age}세)</span>
                    )}
                  </>
                ),
              },
              {
                label: "휴대폰",
                value: (
                  <span className="tabular-nums">{identity.phone ?? "—"}</span>
                ),
              },
              identity.carrier !== null && {
                label: "통신사",
                value: identity.carrier,
              },
              {
                label: "최초 인증",
                value: (
                  <span className="tabular-nums">
                    {eventDateTime(identity.firstVerifiedAt)}
                  </span>
                ),
              },
              identity.renewedAt !== null && {
                label: "최근 갱신",
                value: (
                  <span className="tabular-nums">
                    {eventDateTime(identity.renewedAt)}
                  </span>
                ),
              },
            ]}
          />
        )}
      </MemberCard>

      <MemberCard
        title="사업자 정보"
        note={
          business.destroyed
            ? "탈퇴 시 파기"
            : !isBusiness
              ? "비사업자 — 원천징수 대상"
              : undefined
        }
      >
        {business.destroyed ? (
          <FieldGrid
            items={[
              { label: "사업자 여부", value: <Gone /> },
              { label: "사업자등록번호", value: <Gone /> },
            ]}
          />
        ) : isBusiness ? (
          <FieldGrid
            items={[
              {
                label: "사업자 여부",
                value: (
                  <StatusBadge variant="neutral" hideDot>
                    사업자
                  </StatusBadge>
                ),
              },
              {
                label: "사업자 구분",
                value: business.businessTypeLabel ?? "—",
              },
              {
                label: "사업자등록번호",
                value: (
                  <span className="tabular-nums">
                    {business.businessRegistrationNumber ?? "—"}
                  </span>
                ),
              },
              {
                // 상호 · 대표자 · 주소는 수집하지 않아 등록증으로 확인한다
                label: "사업자등록증",
                value: business.businessLicenseImageUrl ? (
                  <a
                    href={business.businessLicenseImageUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={ELINK_CLASS}
                  >
                    등록증 보기 ↗
                  </a>
                ) : (
                  "—"
                ),
              },
            ]}
          />
        ) : (
          <FieldGrid
            items={[
              {
                label: "사업자 여부",
                value: (
                  <StatusBadge variant="neutral" hideDot>
                    비사업자
                  </StatusBadge>
                ),
              },
              {
                label: "원천징수",
                value: (
                  <>
                    <b>3.3%</b> <span className={T_SUB_CLASS}>· 사업소득</span>
                  </>
                ),
              },
              { label: "상호", value: <Gone>해당 없음</Gone> },
              { label: "사업자등록번호", value: <Gone>해당 없음</Gone> },
            ]}
          />
        )}
      </MemberCard>

      <MemberCard
        title="정산 정보"
        note={
          settlementAccount.destroyed
            ? "탈퇴 시 파기 · 지급 기록은 보존"
            : "계좌 전체 값은 정산 관리에서만 조회"
        }
      >
        {settlementAccount.destroyed ? (
          <FieldGrid
            items={[
              { label: "예금주", value: <Gone /> },
              { label: "계좌번호", value: <Gone /> },
              { label: "원천징수 방식", value: <Gone /> },
            ]}
          />
        ) : (
          <FieldGrid
            items={[
              { label: "은행", value: settlementAccount.bankName ?? "—" },
              {
                label: "예금주",
                value: settlementAccount.accountHolder ?? "—",
              },
              {
                label: "계좌번호",
                value: (
                  <>
                    <span className="tabular-nums">
                      {settlementAccount.accountNumber ?? "—"}
                    </span>
                    {settlementAccount.lastChange && (
                      <span className={T_SUB_CLASS}>
                        {" "}
                        · 변경{" "}
                        <span className="tabular-nums">
                          {eventMonthDayTime(
                            settlementAccount.lastChange.changedAt
                          )}
                        </span>
                        {settlementAccount.lastChange.previousBankName &&
                          ` · 이전 ${settlementAccount.lastChange.previousBankName} ****${settlementAccount.lastChange.previousLast4 ?? ""}`}
                      </span>
                    )}
                  </>
                ),
              },
              {
                label: "원천징수 방식",
                value:
                  business.withholdingType === "WITHHOLDING_3_3" ? (
                    <>
                      <b>3.3% 원천징수</b>{" "}
                      <span className={T_SUB_CLASS}>· 사업소득</span>
                    </>
                  ) : business.withholdingType === "TAX_INVOICE" ? (
                    <>
                      세금계산서 발행{" "}
                      <span className={T_SUB_CLASS}>· 부가세 별도</span>
                    </>
                  ) : (
                    "—"
                  ),
              },
              pendingChange && {
                // 사업자 구분 전환은 입점 관리 › 변경 요청(05 C3a · C3b)에서 승인 · 반려한다
                label: "사업자 구분 변경",
                value: (
                  <button
                    type="button"
                    className={FLINK_CLASS}
                    onClick={() =>
                      onOpenChangeRequest(pendingChange.changeRequestId)
                    }
                  >
                    변경 요청 확인 중 ↗
                  </button>
                ),
              },
            ]}
          />
        )}
      </MemberCard>
    </>
  );
}
