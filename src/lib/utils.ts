import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un temps en secondes vers le format LRC [mm:ss.xx]
 */
export function formatLrcTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `[${mins.toString().padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}]`;
}

/**
 * Parse un timestamp LRC vers des secondes
 */
export function parseLrcTime(timeStr: string): number {
  const match = timeStr.match(/\[(\d{2}):(\d{2})\.(\d{2})\]/);
  if (!match) return 0;
  
  const mins = parseInt(match[1], 10);
  const secs = parseInt(match[2], 10);
  const hundredths = parseInt(match[3], 10);
  
  return mins * 60 + secs + hundredths / 100;
}

/**
 * Formate une durée en secondes vers mm:ss
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Génère un slug à partir d'un texte
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Convertit un tableau de lignes synchronisées en format LRC brut
 */
export function syncedLyricsToLrc(
  lyrics: { time: number; text: string }[],
  metadata?: { title?: string; artist?: string; album?: string }
): string {
  let lrc = '';
  
  if (metadata?.title) lrc += `[ti:${metadata.title}]\n`;
  if (metadata?.artist) lrc += `[ar:${metadata.artist}]\n`;
  if (metadata?.album) lrc += `[al:${metadata.album}]\n`;
  if (lrc) lrc += '\n';
  
  for (const line of lyrics) {
    lrc += `${formatLrcTime(line.time)}${line.text}\n`;
  }
  
  return lrc;
}

/**
 * Parse un fichier LRC brut vers un tableau de lignes synchronisées
 */
export function parseLrc(lrcContent: string): { time: number; text: string }[] {
  const lines = lrcContent.split('\n');
  const result: { time: number; text: string }[] = [];
  
  for (const line of lines) {
    const match = line.match(/^\[(\d{2}:\d{2}\.\d{2})\](.*)$/);
    if (match) {
      const timeStr = `[${match[1]}]`;
      const text = match[2].trim();
      if (text) {
        result.push({
          time: parseLrcTime(timeStr),
          text,
        });
      }
    }
  }
  
  return result.sort((a, b) => a.time - b.time);
}

/**
 * Calcule les points pour une contribution
 */
export function calculatePoints(type: 'sync' | 'correction' | 'validation'): number {
  switch (type) {
    case 'sync':
      return 10;
    case 'correction':
      return 5;
    case 'validation':
      return 3;
    default:
      return 0;
  }
}

/**
 * Détermine le niveau basé sur les points
 */
export function calculateLevel(points: number): number {
  if (points < 50) return 1;
  if (points < 200) return 2;
  if (points < 500) return 3;
  return 4;
}

/**
 * Retourne le nom du niveau
 */
export function getLevelName(level: number): string {
  switch (level) {
    case 1:
      return 'Débutant';
    case 2:
      return 'Contributeur';
    case 3:
      return 'Expert';
    case 4:
      return 'Ambassadeur';
    default:
      return 'Inconnu';
  }
}
