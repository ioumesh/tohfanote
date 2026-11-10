import {handleGiftRequest} from '@/server/next-handler.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export const GET = handleGiftRequest;
export const POST = handleGiftRequest;
export const PUT = handleGiftRequest;
export const DELETE = handleGiftRequest;
