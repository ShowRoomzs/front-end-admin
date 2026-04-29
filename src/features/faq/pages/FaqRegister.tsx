import Section from "@/common/components/Section/Section";
import FormSelect from "@/common/components/Form/FormSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateFaq } from "@/features/faq/hooks/useCreateFaq";
import { useGetFaqCategories } from "@/features/faq/hooks/useGetFaqCategories";
import type { FaqRequest } from "@/features/faq/types/faq";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function FaqRegister() {
  const navigate = useNavigate();
  const { data: categories } = useGetFaqCategories();
  const { mutateAsync: createFaq, isPending } = useCreateFaq();

  const {
    control,
    register,
    handleSubmit,
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

  const onSubmit = async (data: FaqRequest) => {
    try {
      await createFaq(data);
      toast.success("FAQ가 등록되었습니다.");
      navigate("/support/faq");
    } catch {
      toast.error("FAQ 등록에 실패했습니다.");
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
        <Button type="submit" isLoading={isPending}>
          등록
        </Button>
      </div>
    </form>
  );
}
