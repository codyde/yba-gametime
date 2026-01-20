import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

const handler = toNextJsHandler(auth);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  
  // Debug logging for Apple auth callbacks
  if (url.pathname.includes('apple') || url.searchParams.has('code')) {
    console.log('[Apple Auth Debug] GET Request:', {
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams),
      headers: {
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
      },
    });
  }
  
  return handler.GET(request);
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  
  // Debug logging for Apple auth callbacks (Apple uses form_post)
  if (url.pathname.includes('apple') || url.pathname.includes('callback')) {
    const clonedRequest = request.clone();
    try {
      const formData = await clonedRequest.formData();
      console.log('[Apple Auth Debug] POST Request:', {
        pathname: url.pathname,
        formData: Object.fromEntries(formData),
        headers: {
          host: request.headers.get('host'),
          origin: request.headers.get('origin'),
          'content-type': request.headers.get('content-type'),
        },
      });
    } catch {
      console.log('[Apple Auth Debug] POST Request (non-form):', {
        pathname: url.pathname,
      });
    }
  }
  
  return handler.POST(request);
}
