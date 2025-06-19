import { NextResponse } from "next/server";

export function nextError(error: ErrorWithStatus) {
  return NextResponse.json(
    error.message,
    error.details
  );
}

type ErrorWithStatus = {
  message: { error: string };
  details: { status: number }
}

export const MISSING_TOKEN: ErrorWithStatus = {
  message: { error: 'Missing tokens in query parameters' },
  details: { status: 401 }
};

export const MISSING_QUERY: ErrorWithStatus = {
  message: { error: 'Missing query parameter' },
  details: { status: 400 }
};

export const NO_VIDEOS_FOUND: ErrorWithStatus = {
  message: { error: 'No videos found for the given query' },
  details: { status: 404 }
};