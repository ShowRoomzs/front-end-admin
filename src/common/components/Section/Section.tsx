import type { ReactNode } from "react";

interface SectionProps {
  title?: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
}

export default function Section(props: SectionProps) {
  const { title, children, required = false, className = "" } = props;

  return (
    <section
      className={`relative bg-white rounded-lg border border-gray-200 mb-6 ${className}`}
    >
      {title && (
        <div className="px-6 py-2 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            {title}
            {required && <span className="text-red-500 ml-1">*</span>}
          </h2>
        </div>
      )}
      <div className="p-6 flex flex-col gap-6">{children}</div>
    </section>
  );
}
