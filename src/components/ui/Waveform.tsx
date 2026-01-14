// Composant Waveform basé sur WaveSurfer.js pour LyricSync
import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

interface WaveformProps {
  src: string;
  onSeek?: (time: number) => void;
}

export default function Waveform({ src, onSeek }: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current || !src) return;
    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
    }
    waveSurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#a78bfa",
      progressColor: "#ec4899",
      height: 80,
      barWidth: 2,
      cursorColor: "#9333ea",
      backend: "MediaElement",
    });
    waveSurferRef.current.load(src);
    waveSurferRef.current.on("interaction", () => {
      if (waveSurferRef.current && onSeek) {
        const time = waveSurferRef.current.getCurrentTime();
        onSeek(time);
      }
    });
    return () => {
      waveSurferRef.current?.destroy();
    };
  }, [src, onSeek]);

  return <div ref={containerRef} className="waveform-container" />;
}
