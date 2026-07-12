type ProgressBarProps = {
  progress: number;
};

export function ProgressBar({
  progress,
}: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[#5D5FEF] transition-all duration-300"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}