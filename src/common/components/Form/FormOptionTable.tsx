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

export interface OptionItem {
  id: string | number;
  name: string;
  price: number | null;
}

interface FormOptionTableProps {
  optionName?: string;
  options: Array<OptionItem>;
  disabled?: boolean;
}

const FormOptionTable = forwardRef<HTMLDivElement, FormOptionTableProps>(
  (props, ref) => {
    const { optionName = "", options = [], disabled = false } = props;

    return (
      <div
        ref={ref}
        className="space-y-4 border border-gray-300 rounded-md p-3"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Input
              value={optionName}
              placeholder="옵션명 (예: 색상, 사이즈)"
              disabled={disabled}
              className="max-w-md"
              readOnly
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 text-center">순서</TableHead>
                <TableHead>옵션 항목</TableHead>
                <TableHead className="w-48">옵션가</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.map((option, index) => (
                <TableRow key={option.id}>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell>
                    <Input value={option.name} disabled={disabled} readOnly />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">+</span>
                      <Input
                        value={option.price?.toString()}
                        disabled={disabled}
                        type="number"
                        readOnly
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
);

FormOptionTable.displayName = "FormOptionTable";

export default FormOptionTable;
