interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage(props: PlaceholderPageProps) {
  const { title } = props;

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-3xl font-light text-[#2e3547] mb-2">{title}</h1>
        <p className="text-sm text-[#858796]">Page content to be implemented</p>
      </div>
    </div>
  );
}
