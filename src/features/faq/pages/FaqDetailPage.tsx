import Section from "@/common/components/Section/Section";
import FormSelect from "@/common/components/Form/FormSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeleteFaq } from "@/features/faq/hooks/useDeleteFaq";
import { useGetFaqCategories } from "@/features/faq/hooks/useGetFaqCategories";
import { useGetFaqDetail } from "@/features/faq/hooks/useGetFaqDetail";
import { useUpdateFaq } from "@/features/faq/hooks/useUpdateFaq";
import type { FaqRequest } from "@/features/faq/types/faq";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

export default function FaqDetailPage() {
  const navigate = useNavigate();
  const { faqId: faqIdParam } = useParams<{ faqId: string }>();
  const faqId = Number(faqIdParam);
  const { data: categories } = useGetFaqCategories();
  const { data: faqDetail } = useGetFaqDetail(faqId);
  const { mutateAsync: updateFaq, isPending: isUpdating } = useUpdateFaq();
  const { mutateAsync: deleteFaq, isPending: isDeleting } = useDeleteFaq();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FaqRequest>({
    defaultValues: {
      category: "",
      question: "",
      answer: "",
    },
  });

  const categoryOptions =
    categories?.map((category) => ({
      label: category.description,
      value: category.key,
    })) ?? [];

  useEffect(() => {
    if (!faqDetail) {
      return;
    }

    reset({
      category: faqDetail.category,
      question: faqDetail.question,
      answer: faqDetail.answer,
    });
  }, [faqDetail, reset]);

  const onSubmit = async (data: FaqRequest) => {
    if (!Number.isFinite(faqId)) {
      return;
    }

    try {
      await updateFaq({ faqId, data });
      toast.success("FAQ가 수정되었습니다.");
      navigate("/support/faq");
    } catch {
      toast.error("FAQ 수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!Number.isFinite(faqId) || !window.confirm("FAQ를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteFaq(faqId);
      toast.success("FAQ가 삭제되었습니다.");
      navigate("/support/faq");
    } catch {
      toast.error("FAQ 삭제에 실패했습니다.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
      <Section required title="카테고리">
        <div className="flex flex-col gap-2 max-w-md">
          <Label htmlFor="category">카테고리</Label>
          <Controller
            control={control}
            name="category"
            rules={{ required: "카테고리는 필수 선택값입니다." }}
            render={({ field }) => (
              <FormSelect
                options={categoryOptions}
                placeholder="카테고리를 선택하세요"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.category && (
            <p className="text-sm text-red-500">{errors.category.message}</p>
          )}
        </div>
      </Section>

      <Section required title="질문">
        <div className="flex flex-col gap-2">
          <Label htmlFor="question">질문</Label>
          <Input
            id="question"
            placeholder="질문을 입력하세요"
            {...register("question", {
              required: "질문은 필수 입력값입니다.",
            })}
          />
          {errors.question && (
            <p className="text-sm text-red-500">{errors.question.message}</p>
          )}
        </div>
      </Section>

      <Section required title="답변">
        <div className="flex flex-col gap-2">
          <Label htmlFor="answer">답변</Label>
          <textarea
            id="answer"
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-64 resize-none"
            placeholder="답변을 입력하세요"
            {...register("answer", {
              required: "답변은 필수 입력값입니다.",
            })}
          />
          {errors.answer && (
            <p className="text-sm text-red-500">{errors.answer.message}</p>
          )}
        </div>
      </Section>

      <div className="flex gap-3 justify-end mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/support/faq")}
        >
          취소
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          isLoading={isDeleting}
        >
          삭제
        </Button>
        <Button type="submit" isLoading={isUpdating}>
          저장
        </Button>
      </div>
    </form>
  );
}
