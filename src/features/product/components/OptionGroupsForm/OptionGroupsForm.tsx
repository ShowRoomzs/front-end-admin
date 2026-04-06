import FormController from "@/common/components/Form/FormController";
import FormOptionTable from "@/common/components/Form/FormOptionTable";
import type { ProductDetailFormData } from "@/features/product/pages/ProductDetailPage";
import { useFieldArray, type Control } from "react-hook-form";

interface OptionGroupsFormProps {
  control: Control<ProductDetailFormData>;
}

export default function OptionGroupsForm(props: OptionGroupsFormProps) {
  const { control } = props;

  const { fields } = useFieldArray({
    control,
    name: "optionGroups",
  });

  return (
    <div className="space-y-6">
      {fields.map((field, index) => (
        <div key={field.id} className="relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">
              옵션 {index + 1}
            </h3>
          </div>
          <FormController
            name={`optionGroups.${index}.name`}
            control={control}
            render={({ field: nameField }) => (
              <FormController
                name={`optionGroups.${index}.items`}
                control={control}
                render={({ field: itemsField }) => (
                  <FormOptionTable
                    optionName={nameField.value}
                    options={itemsField.value}
                    disabled
                  />
                )}
              />
            )}
          />
        </div>
      ))}
    </div>
  );
}
