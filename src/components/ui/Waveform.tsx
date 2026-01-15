// Composant Waveform basé sur WaveSurfer.js pour LyricSync
"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import WaveSurfer from "wavesurfer.js";

interface WaveformProps {
  src: string;
  currentTime?: number;
  onSeek?: (time: number) => void;
  onReady?: (duration: number) => void;
  height?: number;
  waveColor?: string;
  progressColor?: string;
}

export interface WaveformRef {
  seekTo: (progress: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

const Waveform = forwardRef<WaveformRef, WaveformProps>(
  (
    {
      src,
      currentTime = 0,
      onSeek,
      onReady,
      height = 80,
      waveColor = "#a78bfa",
      progressColor = "#ec4899",
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const waveSurferRef = useRef<WaveSurfer | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [duration, setDuration] = useState(0);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      seekTo: (progress: number) => {
        if (waveSurferRef.current && isReady) {
          waveSurferRef.current.seekTo(progress);
        }
      },
      getCurrentTime: () => {
        if (waveSurferRef.current && isReady) {
          return waveSurferRef.current.getCurrentTime();
        }
        return 0;
      },
      getDuration: () => {
        if (waveSurferRef.current && isReady) {
          return waveSurferRef.current.getDuration();
        }
        return 0;
      },
    }));

    useEffect(() => {
      if (!containerRef.current || !src) return;

      // Clean up previous instance
      if (waveSurferRef.current) {
        waveSurferRef.current.destroy();
        waveSurferRef.current = null;
      }

      setIsReady(false);

      // Create new WaveSurfer instance
      const wavesurfer = WaveSurfer.create({
        container: containerRef.current,
        waveColor: waveColor,
        progressColor: progressColor,
        height: height,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        cursorColor: "#9333ea",
        cursorWidth: 2,
        backend: "MediaElement",
        normalize: true,
        fillParent: true,
        minPxPerSec: 50,
        autoScroll: true,
        hideScrollbar: true,
      });

      waveSurferRef.current = wavesurfer;

      // Load audio
      wavesurfer.load(src);

      // Event handlers
      wavesurfer.on("ready", () => {
        const dur = wavesurfer.getDuration();
        setDuration(dur);
        setIsReady(true);
        onReady?.(dur);
      });

      wavesurfer.on("interaction", () => {
        if (wavesurfer && onSeek) {
          const time = wavesurfer.getCurrentTime();
          onSeek(time);
        }
      });

      wavesurfer.on("click", () => {
        if (wavesurfer && onSeek) {
          const time = wavesurfer.getCurrentTime();
          onSeek(time);
        }
      });

      return () => {
        wavesurfer.destroy();
      };
    }, [src, height, waveColor, progressColor, onSeek, onReady]);

    // Update progress when currentTime changes externally
    useEffect(() => {
      if (waveSurferRef.current && isReady && duration > 0) {
        const progress = currentTime / duration;
        // Only update if the difference is significant (to avoid infinite loops)
        const currentProgress = waveSurferRef.current.getCurrentTime() / duration;
        if (Math.abs(progress - currentProgress) > 0.01) {
          waveSurferRef.current.seekTo(Math.min(1, Math.max(0, progress)));
        }
      }
    }, [currentTime, isReady, duration]);

    return (
      <div className="w-full bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div
          ref={containerRef}
          className="waveform-container cursor-pointer"
          style={{ minHeight: height }}
        />
        {!isReady && src && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-sm text-gray-500">Chargement du waveform...</span>
          </div>
        )}
      </div>
    );
  }
);

Waveform.displayName = "Waveform";

export default Waveform;
