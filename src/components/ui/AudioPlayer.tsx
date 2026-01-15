// Composant AudioPlayer basé sur Howler.js pour LyricSync
import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Howl } from "howler";
import Button from "@/components/ui/Button";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  onTimeUpdate?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
}

export interface AudioPlayerRef {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
}

const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  ({ src, onTimeUpdate, onPlay, onPause, onEnd }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const howlRef = useRef<Howl | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      play: () => {
        if (howlRef.current && !howlRef.current.playing()) {
          howlRef.current.play();
          setIsPlaying(true);
          onPlay?.();
        }
      },
      pause: () => {
        if (howlRef.current && howlRef.current.playing()) {
          howlRef.current.pause();
          setIsPlaying(false);
          onPause?.();
        }
      },
      seek: (time: number) => {
        if (howlRef.current) {
          howlRef.current.seek(time);
          setCurrentTime(time);
          onTimeUpdate?.(time);
        }
      },
      getCurrentTime: () => currentTime,
      getDuration: () => duration,
      isPlaying: () => isPlaying,
    }));

    useEffect(() => {
      if (!src) return;

      if (howlRef.current) {
        howlRef.current.unload();
      }

      const howl = new Howl({
        src: [src],
        html5: true,
        volume: volume,
        rate: playbackRate,
        onload: () => {
          setDuration(howl.duration());
        },
        onplay: () => {
          setIsPlaying(true);
          onPlay?.();
          // Start time update interval
          intervalRef.current = setInterval(() => {
            const time = howl.seek() as number;
            setCurrentTime(time);
            onTimeUpdate?.(time);
          }, 100);
        },
        onpause: () => {
          setIsPlaying(false);
          onPause?.();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        },
        onend: () => {
          setIsPlaying(false);
          onEnd?.();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        },
      });

      howlRef.current = howl;
      setCurrentTime(0);

      return () => {
        howl.unload();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [src]);

    // Update volume when changed
    useEffect(() => {
      if (howlRef.current) {
        howlRef.current.volume(isMuted ? 0 : volume);
      }
    }, [volume, isMuted]);

    // Update playback rate when changed
    useEffect(() => {
      if (howlRef.current) {
        howlRef.current.rate(playbackRate);
      }
    }, [playbackRate]);

    const play = useCallback(() => {
      if (!howlRef.current) return;
      howlRef.current.play();
    }, []);

    const pause = useCallback(() => {
      if (!howlRef.current) return;
      howlRef.current.pause();
    }, []);

    const togglePlay = useCallback(() => {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    }, [isPlaying, play, pause]);

    const seek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const time = Number(e.target.value);
      if (howlRef.current) {
        howlRef.current.seek(time);
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
    }, [onTimeUpdate]);

    const skipBackward = useCallback(() => {
      if (howlRef.current) {
        const newTime = Math.max(0, currentTime - 5);
        howlRef.current.seek(newTime);
        setCurrentTime(newTime);
        onTimeUpdate?.(newTime);
      }
    }, [currentTime, onTimeUpdate]);

    const skipForward = useCallback(() => {
      if (howlRef.current) {
        const newTime = Math.min(duration, currentTime + 5);
        howlRef.current.seek(newTime);
        setCurrentTime(newTime);
        onTimeUpdate?.(newTime);
      }
    }, [currentTime, duration, onTimeUpdate]);

    const toggleMute = useCallback(() => {
      setIsMuted(!isMuted);
    }, [isMuted]);

    const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = Number(e.target.value);
      setVolume(newVolume);
      if (newVolume > 0) {
        setIsMuted(false);
      }
    }, []);

    const cyclePlaybackRate = useCallback(() => {
      const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
      const currentIndex = rates.indexOf(playbackRate);
      const nextIndex = (currentIndex + 1) % rates.length;
      setPlaybackRate(rates[nextIndex]);
    }, [playbackRate]);

    return (
      <div className="w-full bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.01}
            value={currentTime}
            onChange={seek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Skip Backward */}
            <button
              onClick={skipBackward}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Reculer de 5s"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            {/* Play/Pause */}
            <Button
              size="sm"
              onClick={togglePlay}
              className="rounded-full w-12 h-12 flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            {/* Skip Forward */}
            <button
              onClick={skipForward}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Avancer de 5s"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Playback Speed */}
            <button
              onClick={cyclePlaybackRate}
              className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Vitesse de lecture"
            >
              {playbackRate}x
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AudioPlayer.displayName = "AudioPlayer";

function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds === Infinity) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default AudioPlayer;
