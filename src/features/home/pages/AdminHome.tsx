import {
  IntegrationBadges,
  IntegrationBanner,
} from "@/features/home/components/IntegrationStatus";
import {
  TodaySchedule,
  TodayMetrics,
} from "@/features/home/components/HomeRail";
import {
  TodoCard,
  TodoEmpty,
  TodoSummary,
  TodoTable,
} from "@/features/home/components/TodoTable";
import { HOME_COPY } from "@/features/home/constants/labels";
import { useGetAdminHome } from "@/features/home/hooks/useAdminHome";
import { asOfText, isIntegrationDown } from "@/features/home/utils/format";

/**
 * 어드민 홈(ui-admin-00-home rev.4) — 질문 순서 = 화면 순서: ① 깨진 것(헤더 연동 배지 · 배너)
 * ② 할 일(급한 순 표) ③ 오늘 일정 · 오늘 지표(우측 레일).
 * 화면 전체가 `GET /v1/admin/home` 한 번이다 — 큐 숫자는 서버가 각 모듈 요약과 같은 계산으로 낸다
 * (홈 전용 숫자를 만들지 않는다 · 합계 = 사이드바 배지 합).
 * 제목 줄 우측에 연동 배지가 붙어 h1을 직접 그린다(MainLayout SELF_TITLED_PATHS에 "/").
 */
export default function AdminHome() {
  const { data: home, isLoading, isError, refetch } = useGetAdminHome();
  const integrations = home?.integrations ?? [];
  const compact = integrations.some(isIntegrationDown);

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-sz-n-900">
            {HOME_COPY.title}
          </h1>
          {home && (
            <div className="mt-[2px] text-[12px] tabular-nums text-sz-n-600">
              {asOfText(home.asOf)}
            </div>
          )}
        </div>
        {integrations.length > 0 && (
          <IntegrationBadges integrations={integrations} />
        )}
      </div>

      <IntegrationBanner integrations={integrations} />

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-4">
        <div>
          {home ? (
            <TodoCard
              summary={<TodoSummary todo={home.todo} />}
              right={
                home.todo.rows.length > 0 ? HOME_COPY.todoRight : undefined
              }
            >
              {home.todo.rows.length > 0 ? (
                <TodoTable rows={home.todo.rows} compact={compact} />
              ) : (
                <TodoEmpty />
              )}
            </TodoCard>
          ) : (
            <TodoCard summary={<>할 일</>}>
              <div className="px-6 py-[72px] text-center text-[12px] text-sz-n-500">
                {isLoading && "불러오는 중…"}
                {isError && (
                  <>
                    홈을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => refetch()}
                        className="inline-flex h-8 cursor-pointer items-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
                      >
                        다시 시도
                      </button>
                    </div>
                  </>
                )}
              </div>
            </TodoCard>
          )}
        </div>
        {home && (
          <div className="flex flex-col gap-4">
            <TodaySchedule items={home.todaySchedule} />
            <TodayMetrics metrics={home.metricsToday} />
          </div>
        )}
      </div>
    </div>
  );
}
