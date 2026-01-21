interface PreviewContentProps {
  imageUrl: string;
  className?: string;
}

export const PreviewContent = (props: PreviewContentProps) => {
  const { imageUrl, className } = props;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src={imageUrl}
        alt={imageUrl}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
};
