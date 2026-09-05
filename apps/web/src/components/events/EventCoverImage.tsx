type EventCoverImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function EventCoverImage({
  src,
  alt,
  className = "",
}: EventCoverImageProps) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`bg-slate-100 bg-cover bg-center bg-no-repeat ${className}`}
      style={{
        backgroundImage:
          `url("${src}")`,
      }}
    />
  );
}