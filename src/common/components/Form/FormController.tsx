import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

export const CONTROLLER_ID_PREFIX = "controller-";

export default function FormController<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>(props: ControllerProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <Controller
      {...props}
      render={(renderProps) => (
        <div id={`${CONTROLLER_ID_PREFIX}${props.name}`}>
          {props.render(renderProps)}
        </div>
      )}
    />
  );
}
