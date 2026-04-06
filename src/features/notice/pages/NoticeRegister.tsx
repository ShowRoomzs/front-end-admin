import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCreateNotice } from "@/features/notice/hooks/useCreateNotice";
import type { CreateNoticeRequest } from "@/features/notice/types/notice";
import toast from "react-hot-toast";

export default function NoticeRegister() {
  const navigate = useNavigate();
  const { mutateAsync: createNotice, isPending } = useCreateNotice();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateNoticeRequest>({
    defaultValues: { title: "", content: "", isVisible: true },
  });

  const onSubmit = async (data: CreateNoticeRequest) => {
    try {
      await createNotice(data);
      toast.success("공지사항이 등록되었습니다.");
      navigate("/support/notice");
    } catch {
      toast.error("공지 등록에 실패했습니다.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">공지사항 등록</h1>
        <p className="text-sm text-muted-foreground">새로운 공지사항을 작성합니다.</p>
      </div>
      <div className="p-6 border shadow-sm rounded-lg bg-card text-card-foreground">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">                  
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              placeholder="공지사항 제목을 입력하세요"
              {...register("title", { required: "제목은 필수 입력값입니다." })}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="content">내용 *</Label>
            <textarea
              id="content"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-64 resize-none"
              placeholder="공지사항 내용을 입력하세요"
              {...register("content", { required: "내용은 필수 입력값입니다." })}
            />
            {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="isVisible">공개 설정 *</Label>
            <div className="flex items-center gap-2 mt-1">
              <Controller
                control={control}
                name="isVisible"
                render={({ field: { onChange, value } }) => (
                  <Switch id="isVisible" checked={value} onCheckedChange={onChange} />
                )}
              />
              <Label htmlFor="isVisible" className="text-sm font-normal cursor-pointer text-muted-foreground">
                활성화 시 사용자 앱에 노출됩니다.
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-6 mt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => navigate("/support/notice")}>
              취소
            </Button>
            <Button type="submit" isLoading={isPending}>
              등록
            </Button>
         </div>
        </form>
      </div>
    </div>
  );
}