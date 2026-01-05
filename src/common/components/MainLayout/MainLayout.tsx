import { useMemo, useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "./Header";
import { ADMIN_MENU } from "@/common/constants";
import type { MenuItem } from "@/common/types";
import { SIDEBAR_WIDTH } from "../Sidebar/config";
import { SIDEBAR_STORAGE_KEY } from "./config";

export default function MainLayout() {
  const getInitialSidebarState = () => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(getInitialSidebarState);
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarOpen));
  }, [isSidebarOpen]);

  const menus = useMemo(() => {
    return [ADMIN_MENU];
  }, []);

  const flattenMenus = menus.flatMap((m) => m.groups);

  const title = useMemo(() => {
    const find = (menus: Array<MenuItem>): string | undefined => {
      for (const menu of menus) {
        if (menu.path === location.pathname) {
          return menu.label;
        }
        if (menu.children && menu.children.length > 0) {
          const result = find(menu.children);

          if (result) {
            return result;
          }
        }
      }
    };
    return find(flattenMenus);
  }, [flattenMenus, location.pathname]);

  return (
    <div className="h-screen bg-[#f7f8fa] flex flex-col">
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden bg-[#f7f8fa]">
        <Sidebar menus={menus} isOpen={isSidebarOpen} />

        <main
          className="flex-1 overflow-y-auto p-[20px] bg-[#f7f8fa] transition-[margin] duration-300"
          style={{ marginLeft: isSidebarOpen ? 0 : `-${SIDEBAR_WIDTH}px` }}
        >
          <h1 className="text-[20px] font-bold mb-4">{title}</h1>
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
