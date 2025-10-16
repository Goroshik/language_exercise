// Custom error class for NextResponse.json error responses
import { NextResponse } from 'next/server';

export class NextResponseError extends Error {
  status: number;
  error: any;

  constructor(error: any, status: number = 400) {
    super(typeof error === 'string' ? error : JSON.stringify(error));
    this.status = status;
    this.error = error;
  }

  get response() {
    return NextResponse.json({ error: this.error }, { status: this.status });
  }
}
