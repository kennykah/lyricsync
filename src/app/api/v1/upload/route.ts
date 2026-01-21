import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié. Veuillez vous connecter.' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const artist = formData.get('artist') as string | null;
    const album = formData.get('album') as string | null;
    const lyrics = formData.get('lyrics') as string | null;
    const inputMode = formData.get('inputMode') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'Fichier audio requis' },
        { status: 400 }
      );
    }

    if (!title || !artist || !lyrics) {
      return NextResponse.json(
        { error: 'Titre, artiste et paroles sont requis' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être un fichier audio' },
        { status: 400 }
      );
    }

    // Validate file size (Vercel limit: 4.5MB for free plan, but we'll limit to 10MB for safety)
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Le fichier ne doit pas dépasser ${Math.round(maxSize / 1024 / 1024)} Mo (limite d'hébergement)` },
        { status: 413 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileName = `${user.id}/${Date.now()}-${sanitizedTitle}.${fileExt}`;

    // Convert File to ArrayBuffer then to Uint8Array for Supabase
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, uint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      if (uploadError.message.includes('Bucket not found')) {
        return NextResponse.json(
          { error: "Le bucket de stockage 'audio' n'existe pas" },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: `Erreur upload: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('audio')
      .getPublicUrl(fileName);

    const audioUrl = publicUrlData.publicUrl;

    // Generate slug
    const slug = `${sanitizedTitle}-${Date.now()}`;

    // Determine song status and process based on input mode
    let songStatus = 'draft';
    let syncedLyrics = null;

    if (inputMode === 'lrc') {
      // Parse LRC file and create synchronized lyrics
      console.log('Processing LRC file...');
      syncedLyrics = parseLRCContent(lyrics);

      if (syncedLyrics && syncedLyrics.length > 0) {
        // If LRC parsing successful, song can be published directly (or go to validation)
        songStatus = 'pending_validation'; // Let validators check the sync quality
        console.log(`Parsed ${syncedLyrics.length} synchronized lines from LRC`);
      } else {
        return NextResponse.json(
          { error: 'Erreur lors du parsing du fichier LRC. Vérifiez le format.' },
          { status: 400 }
        );
      }
    }

    // Insert song into database
    const { data: songData, error: dbError } = await supabase
      .from('songs')
      .insert([
        {
          title,
          slug,
          artist_name: artist,
          album: album || null,
          audio_url: audioUrl,
          lyrics_text: inputMode === 'lrc' ? extractPlainLyrics(lyrics) : lyrics,
          status: songStatus,
          submitted_by: user.id,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);

      // Try to delete the uploaded file
      await supabase.storage.from('audio').remove([fileName]);

      return NextResponse.json(
        { error: `Erreur base de données: ${dbError.message}` },
        { status: 500 }
      );
    }

    // If we have synchronized lyrics (from LRC), save them
    if (syncedLyrics && syncedLyrics.length > 0) {
      console.log('Saving synchronized lyrics...');

      // Generate LRC raw format
      const lrcRaw = syncedLyrics
        .map((line) => {
          const mins = Math.floor(line.time / 60);
          const secs = (line.time % 60).toFixed(2).padStart(5, "0");
          return `[${mins.toString().padStart(2, "0")}:${secs}]${line.text}`;
        })
        .join("\n");

      const { error: lrcError } = await supabase
        .from('lrc_files')
        .insert([
          {
            song_id: songData.id,
            synced_lyrics: syncedLyrics,
            lrc_raw: lrcRaw,
            source: 'lrc_import',
            created_by: user.id,
            validated_by: null, // Will be set during validation
            validated_at: null,
          },
        ]);

      if (lrcError) {
        console.error('LRC save error:', lrcError);

        // Don't fail the whole upload for LRC error, but log it
        console.warn('Continuing without LRC data due to save error');
      } else {
        console.log('Synchronized lyrics saved successfully');
      }
    }

    const successMessage = inputMode === 'lrc'
      ? 'Fichier LRC importé avec succès. En attente de validation.'
      : 'Chanson uploadée avec succès';

    return NextResponse.json({
      success: true,
      song: songData,
      message: successMessage,
      inputMode,
      syncedLinesCount: syncedLyrics?.length || 0
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    );
  }
}

// Parse LRC content and extract synchronized lyrics
function parseLRCContent(lrcContent: string): Array<{ time: number; text: string }> | null {
  try {
    const lines = lrcContent.split('\n');
    const syncedLyrics: Array<{ time: number; text: string }> = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('[ti:') || trimmedLine.startsWith('[ar:') ||
          trimmedLine.startsWith('[al:') || trimmedLine.startsWith('[by:') ||
          trimmedLine.startsWith('[offset:') || !trimmedLine.includes(']')) {
        continue; // Skip metadata and empty lines
      }

      // Extract timestamps and text
      const timestampMatches = trimmedLine.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/g);
      if (timestampMatches && timestampMatches.length > 0) {
        // Use the first timestamp for this line
        const timestampMatch = timestampMatches[0].match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/);
        if (timestampMatch) {
          const minutes = parseInt(timestampMatch[1], 10);
          const seconds = parseInt(timestampMatch[2], 10);
          const milliseconds = parseInt(timestampMatch[3].padEnd(3, '0'), 10);

          const time = minutes * 60 + seconds + milliseconds / 1000;

          // Extract text after the timestamp
          const textStart = trimmedLine.indexOf(']') + 1;
          const text = trimmedLine.substring(textStart).trim();

          if (text) {
            syncedLyrics.push({ time, text });
          }
        }
      }
    }

    // Sort by time
    syncedLyrics.sort((a, b) => a.time - b.time);

    return syncedLyrics.length > 0 ? syncedLyrics : null;
  } catch (error) {
    console.error('LRC parsing error:', error);
    return null;
  }
}

// Extract plain lyrics text from LRC content (without timestamps)
function extractPlainLyrics(lrcContent: string): string {
  try {
    const lines = lrcContent.split('\n');
    const plainLines: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('[ti:') || trimmedLine.startsWith('[ar:') ||
          trimmedLine.startsWith('[al:') || trimmedLine.startsWith('[by:') ||
          trimmedLine.startsWith('[offset:')) {
        continue; // Skip metadata
      }

      // Extract text after timestamps
      const textStart = trimmedLine.lastIndexOf(']');
      if (textStart !== -1 && textStart < trimmedLine.length - 1) {
        const text = trimmedLine.substring(textStart + 1).trim();
        if (text) {
          plainLines.push(text);
        }
      }
    }

    return plainLines.join('\n');
  } catch (error) {
    console.error('Plain lyrics extraction error:', error);
    return lrcContent; // Fallback to original content
  }
}
