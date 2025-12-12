'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Github, Sparkles, BarChart3, FileCode, Shield } from 'lucide-react';

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAnalyze = async () => {
    if (!repoUrl) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze repository');
      }

      const data = await response.json();
      router.push(`/dashboard/${data.analysisId}`);
    } catch (err) {
      setError('Failed to analyze repository. Please check the URL and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-12 w-12 text-blue-500 mr-3" />
            <h1 className="text-5xl font-bold text-white">DevInsight AI</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            AI-Powered Developer Intelligence Dashboard. Get instant insights, code health analysis,
            and personalized recommendations for your GitHub repositories.
          </p>
        </div>

        <Card className="max-w-3xl mx-auto mb-16 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Analyze Your Repository</CardTitle>
            <CardDescription className="text-gray-400">
              Enter a GitHub repository URL to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Github className="mr-2 h-4 w-4" />
                {loading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle className="text-white">Code Health</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Get comprehensive health metrics and quality scores for your codebase
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <Shield className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle className="text-white">Issue Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                AI-powered detection of potential issues and vulnerabilities
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <FileCode className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle className="text-white">Smart Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Personalized, actionable suggestions to improve your project
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <Sparkles className="h-8 w-8 text-yellow-500 mb-2" />
              <CardTitle className="text-white">AI-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Powered by Google Gemini AI for intelligent analysis
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-xl text-gray-300 mb-4">Powered By</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="secondary" className="text-sm px-4 py-2">Cline</Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">Kestra</Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">Oumi</Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">Vercel</Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">CodeRabbit</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}