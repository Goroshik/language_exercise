// Custom error class for NextResponse.json error responses
import { NextResponse } from 'next/server';

// TODO: Fix types - create proper error type instead of using any
export class NextResponseError extends Error {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(error: any, status: number = 400) {
    super(typeof error === 'string' ? error : JSON.stringify(error));
    this.status = status;
    this.error = error;
  }

  get response() {
    return NextResponse.json({ error: this.error }, { status: this.status });
  }
}
