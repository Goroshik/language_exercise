import { Octokit } from '@octokit/rest';
import { NextRequest, NextResponse } from 'next/server';

import { safeJson } from 'src/utils/jsonWrapper';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'Goroshik';
const GITHUB_REPO = process.env.GITHUB_REPO || 'language_exercise';

// POST /api/feedback - Create a GitHub issue
export async function POST(request: NextRequest) {
  try {
    if (!GITHUB_TOKEN) {
      console.error('GITHUB_TOKEN is not configured');
      return NextResponse.json(
        { error: 'GitHub integration is not configured' },
        { status: 500 }
      );
    }

    const body = await safeJson(request);
    const { type, title, description } = body;

    // Validation
    if (!type || !['bug', 'feature'].includes(type)) {
      return NextResponse.json({ error: 'Invalid issue type' }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    // Initialize Octokit
    const octokit = new Octokit({
      auth: GITHUB_TOKEN
    });

    // Determine label and emoji based on type
    const label = type === 'bug' ? 'bug' : 'enhancement';
    const emoji = type === 'bug' ? '🐛' : '💡';

    // Create the issue
    const issue = await octokit.rest.issues.create({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      title: `${emoji} ${title}`,
      body: `${description}\n\n---\n\n@Goroshik`,
      labels: [label]
    });

    return NextResponse.json(
      {
        success: true,
        issueNumber: issue.data.number,
        issueUrl: issue.data.html_url
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating GitHub issue:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create issue'
      },
      { status: 500 }
    );
  }
}
