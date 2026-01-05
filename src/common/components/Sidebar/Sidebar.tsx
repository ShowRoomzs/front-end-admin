import type { MenuConfig } from "@/common/types";
import MenuSection from "./MenuSection";
import { SIDEBAR_WIDTH } from "./config";
import { HEADER_HEIGHT } from "../MainLayout/config";

interface SidebarProps {
  menus: Array<MenuConfig>;
  isOpen: boolean;
}

export default function Sidebar(props: SidebarProps) {
  const { menus, isOpen } = props;

  return (
    <aside
      className={`bg-[#1c223f] border-r border-[#2a2d4a] flex flex-col transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{
        width: `${SIDEBAR_WIDTH}px`,
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
      }}
    >
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#3d4166] scrollbar-track-transparent">
        <div className="py-6">
          {menus.map((menu) => (
            <MenuSection key={menu.menuType} groups={menu.groups} />
          ))}
        </div>
      </div>
    </aside>
  );
}
