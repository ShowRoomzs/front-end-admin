import { useMemo, useState, useEffect } from "react";
import type { MenuItem } from "@/common/types";
import MenuItemComponent from "./MenuItemComponent";
import MenuGroupButton from "./MenuGroupButton";
import { useLocation, useNavigate } from "react-router-dom";

interface MenuGroupComponentProps {
  group: MenuItem;
}

export default function MenuGroupComponent(props: MenuGroupComponentProps) {
  const { group } = props;
  const navigate = useNavigate();
  const location = useLocation();

  // 세션스토리지에서 초기값 읽기
  const getInitialOpenState = () => {
    const storageKey = `menu-group-${group.id}`;
    const stored = sessionStorage.getItem(storageKey);
    return stored === "true";
  };

  const [isOpen, setIsOpen] = useState(getInitialOpenState);

  // 상태 변경 시 세션스토리지에 저장
  useEffect(() => {
    const storageKey = `menu-group-${group.id}`;
    sessionStorage.setItem(storageKey, String(isOpen));
  }, [isOpen, group.id]);

  const handleClickMenu = () => {
    const hasPath = !!group?.path;
    if (hasPath) {
      navigate(group.path!);
      return;
    }

    setIsOpen(!isOpen);
  };

  const isActive = useMemo(() => {
    const hasPath = !!group?.path;

    // 1depth 메뉴에 path가 있는 경우 (children 없음)
    if (hasPath && !group.children) {
      return group.path === location.pathname;
    }

    // 2depth 메뉴가 있는 경우
    if (isOpen) {
      return true;
    }

    const childPaths = group.children?.map((v) => v.path);
    return childPaths?.some((v) => v === location.pathname) ?? false;
  }, [group.children, group.path, isOpen, location.pathname]);

  return (
    <div className="mb-3">
      {group.label && (
        <MenuGroupButton
          label={group.label}
          isActive={isActive}
          isOpen={isOpen}
          hasItems={Boolean(group.children && group.children.length > 0)}
          onClick={handleClickMenu}
        />
      )}

      {isOpen && (
        <div className={group.label ? "mt-1 mb-2" : ""}>
          {group.children?.map((item) => (
            <MenuItemComponent key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
