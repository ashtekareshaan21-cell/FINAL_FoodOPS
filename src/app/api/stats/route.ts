import { NextResponse } from 'next/server';
import { adminService } from '@/services/adminService';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  try {
    const stats = await adminService.getAdminStats();

    return NextResponse.json(
      {
        rescuesCompleted: stats.completedRescues,
        kgRescued: stats.foodWeightKg,
        co2eAbatedKg: stats.co2SavedKg,
        waterPreservedL: stats.waterSavedLiters,
        activeRescues: stats.activeRescues,
        divertedWeightKg: stats.divertedWeightKg,
        asOf: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Stats endpoint failed:', error);
    return NextResponse.json(
      {
        error: 'Data unavailable',
        asOf: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }
}
