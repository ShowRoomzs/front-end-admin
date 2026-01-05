import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import type { MenuItem } from "@/common/types";
import { menuStorage } from "@/common/utils/menuStorage";
import MenuItemButton from "./MenuItemButton";
import MenuSubItem from "./MenuSubItem";
import MenuItemLink from "./MenuItemLink";

interface MenuItemComponentProps {
  item: MenuItem;
}

export default function MenuItemComponent(props: MenuItemComponentProps) {
  const { item } = props;
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(() => menuStorage.get(item.id));
  const hasChildren = item.children && item.children.length > 0;

  useEffect(() => {
    menuStorage.set(item.id, isOpen);
  }, [isOpen, item.id]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // 1depth: children이 있는 경우 (토글 가능)
  if (hasChildren) {
    return (
      <div>
        <MenuItemButton
          label={item.label}
          isOpen={isOpen}
          onClick={handleToggle}
        />

        {isOpen && (
          <div className="bg-[#181b30]">
            {item.children!.map((child) => (
              <MenuSubItem
                key={child.id}
                id={child.id}
                label={child.label}
                path={child.path || "#"}
                isActive={child.path === location.pathname}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // 1depth: children이 없는 경우 (바로 링크)
  return (
    <MenuItemLink
      label={item.label}
      path={item.path || "#"}
      isActive={item.path === location.pathname}
    />
  );
}
