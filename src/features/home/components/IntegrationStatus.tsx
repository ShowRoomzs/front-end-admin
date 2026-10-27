import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { HOME_COPY, INTEGRATION_ORDER } from "@/features/home/constants/labels";
import type { AdminHomeIntegration } from "@/features/home/types";
import {
  integrationLabel,
  isIntegrationDown,
  serverClock,
} from "@/features/home/utils/format";

function sortIntegrations(integrations: Array<AdminHomeIntegration>) {
  const rank = (key: string) => {
    const index = INTEGRATION_ORDER.indexOf(
      key as (typeof INTEGRATION_ORDER)[number]
    );
    return index === -1 ? INTEGRATION_ORDER.length : index;
  };
  return [...integrations].sort((a, b) => rank(a.key) - rank(b.key));
}

/**
 * 헤더 우측 연동 배지 3종(시안 `.ph-r`) — 정상은 성공색(점 없음), 지연 · 장애는 위험색 + 점(H3).
 * 꺼짐(DISABLED) · 연동 없음(NOT_INTEGRATED · 전자서명 수동)은 정상이 아니지만 장애도 아니라 회색으로 둔다.
 */
export function IntegrationBadges(props: {
  integrations: Array<AdminHomeIntegration>;
}) {
  const { integrations } = props;
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-sz-n-600">
      <span>{HOME_COPY.integrationLead}</span>
      {sortIntegrations(integrations).map((integration) => {
        const label = integrationLabel(integration);
        const title = integration.message ?? undefined;
        if (isIntegrationDown(integration)) {
          return (
            <span key={integration.key} title={title}>
              <StatusBadge variant="danger">
                {label} {integration.status === "DOWN" ? "장애" : "지연"}
              </StatusBadge>
            </span>
          );
        }
        if (integration.status === "OK") {
          return (
            <span key={integration.key} title={title}>
              <StatusBadge variant="success" hideDot>
                {label}
              </StatusBadge>
            </span>
          );
        }
        return (
          <span key={integration.key} title={title}>
            <StatusBadge variant="neutral" hideDot>
              {label} {integration.status === "DISABLED" ? "꺼짐" : "수동"}
            </StatusBadge>
          </span>
        );
      })}
    </div>
  );
}

/**
 * 연동 장애 배너(H3 `.bn`) — 연동이 끊기면 할 일 숫자 자체가 틀릴 수 있어 가장 먼저 알린다.
 * 닫을 수 없고 서버가 OK로 돌려주면 사라진다. 배송 추적은 시안 문구 그대로, 그 밖은 서버 메시지 · 영향 큐를 적는다.
 */
export function IntegrationBanner(props: {
  integrations: Array<AdminHomeIntegration>;
}) {
  const down = props.integrations.filter(isIntegrationDown);
  if (down.length === 0) return null;
  return (
    <div className="mb-4 flex flex-col gap-2">
      {down.map((integration) => {
        const since = integration.since
          ? ` · ${serverClock(integration.since)}부터`
          : "";
        return (
          <div
            key={integration.key}
            role="alert"
            className="flex items-start gap-2.5 rounded-[8px] bg-sz-danger-bg px-4 py-[9px] text-[12px] leading-[1.6] text-sz-danger-text"
          >
            <span>!</span>
            {integration.key === "DELIVERY_TRACKING" ? (
              <span>
                <b className="font-semibold">{HOME_COPY.trackingBannerTitle}</b>
                {since} — 배송 예외{" "}
                <b className="font-semibold">판정을 일시 중지</b>했습니다. 복구
                전까지 「배송 예외 확인」 건수가 실제보다 적게 보일 수 있습니다.
              </span>
            ) : (
              <span>
                <b className="font-semibold">
                  {integrationLabel(integration)} 연동 이상
                </b>
                {since}
                {integration.message ? ` — ${integration.message}` : ""}
                {integration.affectedQueues.length > 0 &&
                  ` · 영향받는 할 일: ${integration.affectedQueues
                    .map((queue) => `「${queue}」`)
                    .join(" · ")}`}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
