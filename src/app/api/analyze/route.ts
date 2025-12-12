import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getRepositoryInfo, getRepoLanguages, getRepoIssues } from '@/lib/github/octokit';
import { analyzeRepository } from '@/lib/ai/analyzer';

export async function POST(req: NextRequest) {
  console.log('🔍 Analyze API called');
  
  try {
    const body = await req.json();
    const { repoUrl } = body;

    console.log('📦 Received repo URL:', repoUrl);

    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    // Parse GitHub URL - more flexible regex
    const urlMatch = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\s]+)/);
    if (!urlMatch) {
      console.error('❌ Invalid GitHub URL format');
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL. Expected format: https://github.com/owner/repo' },
        { status: 400 }
      );
    }

    const [, owner, repoNameRaw] = urlMatch;
    const repo = repoNameRaw.replace(/\.git$/, '').trim();

    console.log(`✅ Parsed - Owner: ${owner}, Repo: ${repo}`);

    // Check if repository exists in DB
    let repository;
    try {
      repository = await prisma.repository.findUnique({
        where: {
          owner_name: {
            owner,
            name: repo,
          },
        },
      });
      console.log('🔎 Repository in DB:', repository ? 'Found' : 'Not found');
    } catch (dbError) {
      console.error('❌ Database error (findUnique):', dbError);
      // If DB error, continue without checking
      repository = null;
    }

    // Fetch repo info from GitHub
    let repoInfo;
    try {
      console.log('🌐 Fetching from GitHub API...');
      repoInfo = await getRepositoryInfo(owner, repo);
      console.log('✅ GitHub API response received');
    } catch (githubError: any) {
      console.error('❌ GitHub API error:', githubError.message);
      return NextResponse.json(
        { error: `Failed to fetch repository from GitHub: ${githubError.message}` },
        { status: 404 }
      );
    }

    // Create repository if it doesn't exist
    if (!repository) {
      try {
        repository = await prisma.repository.create({
          data: {
            name: repo,
            owner,
            url: repoUrl,
            description: repoInfo.description,
          },
        });
        console.log('✅ Repository created in DB');
      } catch (createError) {
        console.error('❌ Failed to create repository in DB:', createError);
        return NextResponse.json(
          { error: 'Database error: Failed to create repository' },
          { status: 500 }
        );
      }
    }

    // Create analysis record
    let analysis;
    try {
      analysis = await prisma.analysis.create({
        data: {
          repositoryId: repository.id,
          status: 'processing',
          codeHealth: {},
          issues: [],
          recommendations: [],
          metrics: {},
        },
      });
      console.log('✅ Analysis record created:', analysis.id);
    } catch (analysisError) {
      console.error('❌ Failed to create analysis record:', analysisError);
      return NextResponse.json(
        { error: 'Database error: Failed to create analysis' },
        { status: 500 }
      );
    }

    // Start analysis
    try {
      const startTime = Date.now();
      console.log('🤖 Starting AI analysis...');
      
      const [languages, issues] = await Promise.all([
        getRepoLanguages(owner, repo),
        getRepoIssues(owner, repo),
      ]);

      console.log(`📊 Fetched ${Object.keys(languages).length} languages, ${issues.length} issues`);

      const analysisResult = await analyzeRepository(repoInfo, languages, issues);
      const duration = Math.floor((Date.now() - startTime) / 1000);

      console.log('✅ AI analysis complete in', duration, 'seconds');

      // Update analysis with results
      await prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: 'completed',
          codeHealth: analysisResult.codeHealth as any,
          issues: analysisResult.issues as any,
          recommendations: analysisResult.recommendations as any,
          metrics: analysisResult.metrics as any,
          duration,
        },
      });

      console.log('✅ Analysis updated in database');

      return NextResponse.json({
        analysisId: analysis.id,
        repositoryId: repository.id,
        status: 'completed',
      });
    } catch (error: any) {
      console.error('❌ Analysis failed:', error);
      
      try {
        await prisma.analysis.update({
          where: { id: analysis.id },
          data: { status: 'failed' },
        });
      } catch (updateError) {
        console.error('❌ Failed to update analysis status:', updateError);
      }
      
      return NextResponse.json(
        { error: `Analysis failed: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get('id');

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        repository: true,
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis', details: error.message },
      { status: 500 }
    );
  }
}