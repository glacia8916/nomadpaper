import { type NextRequest, NextResponse } from 'next/server';

const canonicalHost = 'nomadpaper.cn';
const legacyHost = 'paper.nomadpaper.cn';

export function proxy(request: NextRequest) {
  if (request.nextUrl.hostname !== legacyHost) return NextResponse.next();

  const destination = request.nextUrl.clone();
  destination.hostname = canonicalHost;
  destination.protocol = 'https:';
  destination.port = '';
  return NextResponse.redirect(destination, 308);
}
