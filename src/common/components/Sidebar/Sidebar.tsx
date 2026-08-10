import logo from "@/common/assets/logo.svg";
import type { MenuConfig, MenuItem } from "@/common/types";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SIDEBAR_WIDTH } from "./config";

interface SidebarProps {
  menus: Array<MenuConfig>;
}

const OPEN_GROUPS_STORAGE_KEY = "admin-sidebar-open-groups";

function readOpenGroups(): Array<string> {
  try {
    const stored = sessionStorage.getItem(OPEN_GROUPS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Array<string>) : [];
  } catch {
    return [];
  }
}

/**
 * 어드민 셸 사이드바 (웹 디자인시스템 v1.1)
 * 배경 --n-100 · 우측 --n-200 보더 · 활성 하위 메뉴만 --accent-500.
 * 하위 메뉴 보유 항목만 셰브론을 노출하고 다중 열림을 허용한다.
 */
export default function Sidebar(props: SidebarProps) {
  const { menus } = props;
  const location = useLocation();
  const navigate = useNavigate();

  const [openGroupIds, setOpenGroupIds] =
    useState<Array<string>>(readOpenGroups);

  useEffect(() => {
    sessionStorage.setItem(
      OPEN_GROUPS_STORAGE_KEY,
      JSON.stringify(openGroupIds)
    );
  }, [openGroupIds]);

  // 상세 화면(`/market/registration/12`)에서도 해당 메뉴가 활성으로 보여야 한다
  const isPathActive = useCallback(
    (path?: string) =>
      Boolean(path) &&
      (location.pathname === path || location.pathname.startsWith(`${path}/`)),
    [location.pathname]
  );

  const isChildActive = useCallback(
    (item: MenuItem) =>
      item.children?.some((child) => isPathActive(child.path)) ?? false,
    [isPathActive]
  );

  const groups = menus.flatMap((menu) => menu.groups);

  // 현재 경로가 속한 그룹은 자동으로 펼친다
  useEffect(() => {
    const activeGroup = groups.find((group) => isChildActive(group));
    if (!activeGroup) {
      return;
    }
    setOpenGroupIds((prev) =>
      prev.includes(activeGroup.id) ? prev : [...prev, activeGroup.id]
    );
  }, [groups, isChildActive]);

  const toggleGroup = (groupId: string) => {
    setOpenGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <aside
      className="flex shrink-0 flex-col border-r border-sz-n-200 bg-sz-n-100"
      style={{ width: `${SIDEBAR_WIDTH}px` }}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-sz-n-200 px-4">
        <img
          src={logo}
          alt="SHOWROOMZ"
          className="h-3.5 cursor-pointer"
          onClick={() => navigate("/")}
        />
        <span className="ml-0.5 border-l border-sz-n-300 pl-2 text-[11px] font-medium text-sz-n-500">
          어드민
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {groups.map((group, index) => {
          const hasChildren = Boolean(group.children?.length);
          const isOpen = openGroupIds.includes(group.id);
          const isActive = hasChildren
            ? isChildActive(group)
            : isPathActive(group.path);

          /*
            디자인시스템 `.gnb-item.active` — 현재 화면인 항목을 액센트로 채운다.
            하위 메뉴를 가진 그룹은 제외한다. 그룹 자체는 화면이 아니라 묶음이고,
            실제 현재 화면인 하위 항목이 따로 채워지므로 둘 다 칠하면 어디가
            현재 위치인지 흐려진다.
          */
          const isFilled = !hasChildren && isActive;

          return (
            <div key={group.id}>
              <button
                type="button"
                onClick={() =>
                  group.path ? navigate(group.path) : toggleGroup(group.id)
                }
                className={`mb-0.5 flex w-full items-center gap-2 rounded-[6px] px-2.5 py-[7px] text-left text-[12px] ${
                  isFilled
                    ? "bg-sz-accent-500 font-medium text-white"
                    : `hover:bg-sz-n-200 ${
                        isOpen || isActive
                          ? "font-medium text-sz-n-900"
                          : "text-sz-n-600"
                      }`
                }`}
              >
                <span
                  className={`w-[15px] shrink-0 text-center text-[11px] ${
                    isFilled ? "text-white/70" : "text-sz-n-400"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="flex-1">{group.label}</span>
                {group.badge !== undefined && (
                  <span
                    className={`min-w-4 shrink-0 rounded-[8px] px-[5px] text-center text-[10px] font-semibold text-white ${
                      // 파란 배경 위에 빨간 배지를 얹으면 둘 다 안 읽힌다
                      isFilled ? "bg-white/25" : "bg-sz-danger-text"
                    }`}
                  >
                    {group.badge.toLocaleString()}
                  </span>
                )}
                {hasChildren && (
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center transition-transform ${
                      isOpen ? "rotate-180 text-sz-n-700" : "text-sz-n-500"
                    }`}
                  >
                    <svg
                      viewBox="0 0 12 12"
                      fill="none"
                      className="h-[11px] w-[11px]"
                    >
                      <path
                        d="M2.5 4.5L6 8L9.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </button>

              {hasChildren && isOpen && (
                <div>
                  {group.children!.map((child) => {
                    const isCurrent = isPathActive(child.path);

                    return (
                      <Link
                        key={child.id}
                        to={child.path ?? "#"}
                        className={`mb-px flex items-center justify-between rounded-[6px] py-[5px] pl-[33px] pr-2.5 text-[11px] ${
                          isCurrent
                            ? "bg-sz-accent-500 font-medium text-white"
                            : "text-sz-n-500 hover:bg-sz-n-200"
                        }`}
                      >
                        <span>{child.label}</span>
                        {child.count !== undefined && (
                          <span
                            className={`text-[10px] ${
                              isCurrent ? "text-white" : "text-sz-n-500"
                            }`}
                          >
                            {child.count.toLocaleString()}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
