// Custom error class for NextResponse.json error responses
import { NextResponse } from 'next/server';

/** Anything JSON-serialisable is accepted as the error payload. */
export type ErrorPayload =
  string | number | boolean | null | ErrorPayload[] | { [key: string]: ErrorPayload };

export class NextResponseError extends Error {
  readonly status: number;
  readonly error: ErrorPayload;

  constructor(error: ErrorPayload, status: number = 400) {
    super(typeof error === 'string' ? error : JSON.stringify(error));
    this.status = status;
    this.error = error;
  }

  get response() {
    return NextResponse.json({ error: this.error }, { status: this.status });
  }
}
