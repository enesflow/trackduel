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