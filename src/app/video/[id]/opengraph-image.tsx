import { ImageResponse } from 'next/og';
import { db } from '@/db';
import { media } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const alt = 'Video Thumbnail';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Fetch media data
  const mediaData = await db
    .select()
    .from(media)
    .where(eq(media.id, id))
    .limit(1);

  const mediaItem = mediaData[0];

  if (!mediaItem) {
    // Return a default image if media not found
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#0a0a0a',
            color: 'white',
            fontSize: 48,
            fontWeight: 'bold',
          }}
        >
          GirlsGotGame
        </div>
      ),
      { ...size }
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {/* Background - thumbnail image (first frame from video) */}
        {mediaItem.thumbnail ? (
          <img
            src={mediaItem.thumbnail}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}
        
        {/* Overlay */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            background: mediaItem.thumbnail
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.8))'
              : '#0a0a0a',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            padding: 60,
            position: 'relative',
            zIndex: 1,
            justifyContent: 'center',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 40,
            }}
          >
            <span style={{ color: '#ec4899', fontSize: 32, fontWeight: 'bold' }}>
              GirlsGotGame
            </span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 24 }}>
              {mediaItem.type === 'video' ? 'Video' : 'Photo'}
            </span>
          </div>

          {/* Title/Caption - truncated if too long */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            {mediaItem.caption ? (
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 'bold',
                  color: 'white',
                  lineHeight: 1.2,
                  maxWidth: '900px',
                }}
              >
                {mediaItem.caption.length > 80
                  ? mediaItem.caption.substring(0, 80) + '...'
                  : mediaItem.caption}
              </span>
            ) : (
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 'bold',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                {mediaItem.type === 'video' ? 'Video Clip' : 'Photo'}
              </span>
            )}

            {/* Date posted */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <span
                style={{
                  color: '#ec4899',
                  fontSize: 20,
                  fontWeight: 'bold',
                  padding: '8px 16px',
                  borderRadius: 20,
                  backgroundColor: 'rgba(236, 72, 153, 0.2)',
                }}
              >
                {mediaItem.type === 'video' ? 'VIDEO' : 'PHOTO'}
              </span>
              <span
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 24,
                }}
              >
                {formatDate(mediaItem.uploadedAt)}
              </span>
            </div>
          </div>

          {/* Uploader */}
          {mediaItem.uploader && mediaItem.uploader !== 'Anonymous' ? (
            <div
              style={{
                position: 'absolute',
                bottom: 60,
                left: 60,
                right: 60,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                color: 'rgba(255,255,255,0.7)',
                fontSize: 20,
              }}
            >
              <span>Posted by</span>
              <span
                style={{
                  color: 'white',
                  fontWeight: '600',
                }}
              >
                {mediaItem.uploader}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size }
  );
}
