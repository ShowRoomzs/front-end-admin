import { forwardRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export interface OptionCombination {
  id: string;
  combination: Array<string>;
  price: string;
  stock: string;
  isDisplayed: boolean;
  isRepresentative: boolean;
}

interface FormOptionCombinationTableProps {
  combinations: Array<OptionCombination>;
  disabled?: boolean;
}

const FormOptionCombinationTable = forwardRef<
  HTMLDivElement,
  FormOptionCombinationTableProps
>((props, ref) => {
  const { combinations, disabled = false } = props;

  if (combinations.length === 0) {
    return (
      <div
        ref={ref}
        className="rounded-md border border-gray-300 p-8 text-center text-gray-500"
      >
        옵션 조합 정보가 없습니다.
      </div>
    );
  }

  return (
    <div ref={ref}>
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-900">옵션 목록</h3>
      </div>
      <div className="rounded-md border border-gray-300">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center border-r">옵션 항목</TableHead>
              <TableHead className="text-center border-r">옵션가</TableHead>
              <TableHead className="text-center border-r">재고 수량</TableHead>
              <TableHead className="text-center border-r">진열 여부</TableHead>
              <TableHead className="text-center">대표 옵션 여부</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combinations.map((combination) => (
              <TableRow key={combination.id}>
                <TableCell className="text-center border-r">
                  <div className="flex justify-center items-center gap-1.5">
                    {combination.combination.map((item) => (
                      <div
                        className="inline-flex items-center justify-center bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-700"
                        key={item}
                      >
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </TableCell>

                <TableCell className="border-r">
                  <div className="flex items-center gap-2 px-3">
                    <span className="text-muted-foreground">+</span>
                    <Input value={combination.price} type="number" disabled={disabled} readOnly />
                  </div>
                </TableCell>
                <TableCell className="border-r">
                  <Input
                    value={combination.stock}
                    disabled={disabled}
                    type="number"
                    readOnly
                  />
                </TableCell>
                <TableCell className="text-center border-r">
                  <div className="flex justify-center">
                    <Switch checked={combination.isDisplayed} disabled={disabled} />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <RadioGroup
                    value={combinations.find((c) => c.isRepresentative)?.id ?? ""}
                    disabled={disabled}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <RadioGroupItem
                        value={combination.id}
                        id={`rep-${combination.id}`}
                      />
                      <Label
                        htmlFor={`rep-${combination.id}`}
                        className="cursor-pointer"
                      >
                        지정
                      </Label>
                    </div>
                  </RadioGroup>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

FormOptionCombinationTable.displayName = "FormOptionCombinationTable";

export default FormOptionCombinationTable;
