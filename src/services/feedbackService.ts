import { Octokit } from '@octokit/rest';

interface FeedbackData {
  type: 'bug' | 'feature';
  title: string;
  description: string;
  imageUrl?: string;
}

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

/**
 * Service for creating GitHub issues from user feedback
 */
export class FeedbackService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(config: GitHubConfig) {
    this.octokit = new Octokit({
      auth: config.token
    });
    this.owner = config.owner;
    this.repo = config.repo;
  }

  /**
   * Create a GitHub issue from feedback data
   */
  async createIssue(feedback: FeedbackData) {
    const { type, title, description, imageUrl } = feedback;

    // Determine label and emoji based on type
    const label = type === 'bug' ? 'bug' : 'enhancement';
    const emoji = type === 'bug' ? '🐛' : '💡';

    // Build issue body with optional image
    let body = description;
    
    if (imageUrl) {
      body += `\n\n### Screenshot\n\n![screenshot](${imageUrl})`;
    }
    
    body += '\n\n---\n\n@Goroshik';

    // Create the issue
    const issue = await this.octokit.rest.issues.create({
      owner: this.owner,
      repo: this.repo,
      title: `${emoji} ${title}`,
      body,
      labels: [label]
    });

    return {
      success: true,
      issueNumber: issue.data.number,
      issueUrl: issue.data.html_url
    };
  }
}

/**
 * Create a feedback service instance with GitHub configuration
 */
export function createFeedbackService(): FeedbackService {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'Goroshik';
  const repo = process.env.GITHUB_REPO || 'language_exercise';

  if (!token) {
    throw new Error('GITHUB_TOKEN is not configured');
  }

  return new FeedbackService({
    token,
    owner,
    repo
  });
}
