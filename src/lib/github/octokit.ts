import { Octokit } from '@octokit/rest';

if (!process.env.GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN is not set in environment variables');
}

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export interface RepoInfo {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  url: string;
  defaultBranch: string;
}

export async function getRepositoryInfo(owner: string, repo: string): Promise<RepoInfo> {
  const { data } = await octokit.repos.get({
    owner,
    repo,
  });

  return {
    owner: data.owner.login,
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    stars: data.stargazers_count,
    forks: data.forks_count,
    language: data.language,
    url: data.html_url,
    defaultBranch: data.default_branch,
  };
}

export async function getRepoFiles(owner: string, repo: string, path: string = '') {
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path,
  });

  return data;
}

export async function getRepoLanguages(owner: string, repo: string) {
  const { data } = await octokit.repos.listLanguages({
    owner,
    repo,
  });

  return data;
}

export async function getRepoIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') {
  const { data } = await octokit.issues.listForRepo({
    owner,
    repo,
    state,
    per_page: 100,
  });

  return data;
}