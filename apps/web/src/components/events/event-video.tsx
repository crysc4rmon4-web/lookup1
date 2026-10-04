"use client";

import { useEffect, useRef, useState } from "react";

export function EventVideo({
  src,
  title,
  className = "",
}: {
  src: string;
  title: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.5)
          video.pause();
      },
      { threshold: [0, 0.5] },
    );
    const pauseWhenHidden = () => {
      if (document.hidden) video.pause();
    };
    observer.observe(video);
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", pauseWhenHidden);
      video.pause();
    };
  }, [src]);
  return failed ? (
    <p role="status" className="p-6 text-sm">
      Este vídeo no se puede reproducir en tu navegador.
    </p>
  ) : (
    <video
      ref={ref}
      src={src}
      aria-label={title}
      controls
      playsInline
      preload="none"
      onError={() => setFailed(true)}
      className={`h-full w-full bg-slate-950 object-contain ${className}`}
    />
  );
}
