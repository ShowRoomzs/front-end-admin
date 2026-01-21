import { PreviewModal } from "@/common/components/PreviewModal/PreviewModal";
import useMouse from "@/common/hooks/useMouse";
import { cn } from "@/lib/utils";
import { ZoomIn } from "lucide-react";
import {
  useCallback,
  useState,
  type ImgHTMLAttributes,
  type MouseEvent,
} from "react";
import { Fragment } from "react/jsx-runtime";

interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  showPreview?: boolean;
}

export default function Image(props: ImageProps) {
  const { showPreview = false, ...imageProps } = props;
  const [openModal, setOpenModal] = useState(false);
  const [ref, isHovered] = useMouse<HTMLDivElement>(0);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLImageElement>) => {
      e.stopPropagation();
      e.preventDefault();
      if (!showPreview) {
        return;
      }
      setOpenModal(true);
    },
    [showPreview]
  );

  return (
    <Fragment>
      <PreviewModal
        isOpen={openModal}
        onOpenChange={setOpenModal}
        imageUrl={imageProps.src || ""}
        currentIndex={0}
        fileLength={1}
      />
      <div
        ref={ref}
        onClick={handleClick}
        className="relative w-fit h-fit flex items-center justify-center"
      >
        <div
          className={cn(
            "w-full h-full transition-opacity duration-200 absolute top-0 left-0 bg-black/20 p-1 opacity-0 flex items-center justify-center",
            isHovered && showPreview && "opacity-100"
          )}
        >
          <ZoomIn color="#FFFFFF" width={20} height={20} />
        </div>
        <img
          className={cn("cursor-pointer", imageProps.className)}
          {...imageProps}
        />
      </div>
    </Fragment>
  );
}
