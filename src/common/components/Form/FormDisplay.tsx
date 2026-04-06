interface FormDisplayProps {
  value: string;
}

export default function FormDisplay(props: FormDisplayProps) {
  const { value } = props;

  return <div className="text-sm text-gray-900">{value}</div>;
}
