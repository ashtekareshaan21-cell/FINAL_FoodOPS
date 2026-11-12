import { ImageResponse } from 'next/og';

export const alt = 'FoodOPS - Surplus food rescue, pilot in Pune';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #0b3c26 0%, #0f4c31 60%, #145c3c 100%)',
          color: '#f8faf9',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: '#f8faf9',
              color: '#0b3c26',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 900,
            }}
          >
            F
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-0.02em' }}>
              FoodOPS
            </span>
            <span style={{ fontSize: '18px', color: '#a7f3d0', fontWeight: 600 }}>
              www.foodops.live
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '940px' }}>
          <span
            style={{
              fontSize: '60px',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}
          >
            Surplus food rescue, pilot in Pune
          </span>
          <span style={{ fontSize: '28px', color: '#d1fae5', fontWeight: 500, lineHeight: 1.35 }}>
            Coordinating kitchens, verified NGOs, and rescue riders with verified handovers in Pune and Pimpri-Chinchwad.
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.22)',
            paddingTop: '24px',
            fontSize: '20px',
            color: '#d1fae5',
            fontWeight: 600,
          }}
        >
          <span>For Donors  •  For NGOs  •  For Riders</span>
          <span>Pilot Stage</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
