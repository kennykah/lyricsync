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
          lyrics_text: lyrics,
          status: 'draft',
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

    return NextResponse.json({
      success: true,
      song: songData,
      message: 'Chanson uploadée avec succès',
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    );
  }
}
