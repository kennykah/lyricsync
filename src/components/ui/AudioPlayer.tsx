// Composant AudioPlayer basé sur Howler.js pour LyricSync
import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import Button from "@/components/ui/Button";

interface AudioPlayerProps {
  src: string;
}

export default function AudioPlayer({ src }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const howlRef = useRef<Howl | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!src) return;
    if (howlRef.current) {
      howlRef.current.unload();
    }
    const howl = new Howl({
      src: [src],
      html5: true,
      onload: () => setDuration(howl.duration()),
      onend: () => setIsPlaying(false),
    });
    howlRef.current = howl;
    setCurrentTime(0);
    setDuration(howl.duration());
    return () => {
      howl.unload();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [src]);

  const play = () => {
    if (!howlRef.current) return;
    howlRef.current.play();
    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setCurrentTime(howlRef.current?.seek() as number || 0);
    }, 200);
  };

  const pause = () => {
    if (!howlRef.current) return;
    howlRef.current.pause();
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (howlRef.current) {
      howlRef.current.seek(time);
      setCurrentTime(time);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={isPlaying ? pause : play}>
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <span className="text-sm text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={duration}
        step={0.01}
        value={currentTime}
        onChange={seek}
        className="w-full"
      />
    </div>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
