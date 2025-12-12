'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  FileCode, 
  GitBranch,
  Star,
  AlertTriangle
} from 'lucide-react';

interface Analysis {
  id: string;
  status: string;
  codeHealth: any;
  issues: any[];
  recommendations: any[];
  metrics: any;
  repository: {
    name: string;
    owner: string;
    url: string;
    description: string | null;
  };
  analyzedAt: string;
  duration: number | null;
}

export default function DashboardPage() {
  const params = useParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/analyze?id=${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch analysis');
        const data = await response.json();
        setAnalysis(data);
      } catch (err) {
        setError('Failed to load analysis');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
    
    const interval = setInterval(fetchAnalysis, 5000);
    return () => clearInterval(interval);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading analysis...</div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {analysis.repository.owner}/{analysis.repository.name}
              </h1>
              <p className="text-gray-400">{analysis.repository.description}</p>
            </div>
            <Badge 
              variant={analysis.status === 'completed' ? 'default' : 'secondary'}
              className="text-lg px-4 py-2"
            >
              {analysis.status}
            </Badge>
          </div>
          <a 
            href={analysis.repository.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300"
          >
            View on GitHub →
          </a>
        </div>

        <Card className="mb-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="mr-2 h-6 w-6" />
              Code Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="text-6xl font-bold text-white">
                {analysis.codeHealth?.score || 0}
                <span className="text-2xl text-gray-400">/100</span>
              </div>
              <p className="text-gray-300 flex-1">
                {analysis.codeHealth?.summary || 'Analysis in progress...'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="issues" className="w-full">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="issues" className="data-[state=active]:bg-gray-700">
              Issues ({analysis.issues?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-gray-700">
              Recommendations ({analysis.recommendations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-gray-700">
              Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="space-y-4 mt-6">
            {analysis.issues?.map((issue, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <div>
                        <CardTitle className="text-white text-lg">{issue.message}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {issue.file} • {issue.type}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getSeverityColor(issue.severity)}>
                      {issue.severity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300"><strong>Suggestion:</strong> {issue.suggestion}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4 mt-6">
            {analysis.recommendations?.map((rec, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <div>
                        <CardTitle className="text-white text-lg">{rec.title}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {rec.category}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">{rec.priority}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-gray-300">{rec.description}</p>
                  <p className="text-sm text-gray-400">
                    <strong>Expected Impact:</strong> {rec.impact}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="metrics" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <FileCode className="h-8 w-8 text-blue-500 mb-2" />
                  <CardTitle className="text-white">Lines of Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">
                    {analysis.metrics?.linesOfCode?.toLocaleString() || '—'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <GitBranch className="h-8 w-8 text-green-500 mb-2" />
                  <CardTitle className="text-white">Files Count</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">
                    {analysis.metrics?.filesCount?.toLocaleString() || '—'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-purple-500 mb-2" />
                  <CardTitle className="text-white">Avg Complexity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">
                    {analysis.metrics?.avgComplexity || '—'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CheckCircle2 className="h-8 w-8 text-yellow-500 mb-2" />
                  <CardTitle className="text-white">Dependencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">
                    {analysis.metrics?.dependencies || '—'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {analysis.duration && (
              <Card className="mt-6 bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <p className="text-gray-400">
                    Analysis completed in <span className="text-white font-semibold">{analysis.duration}s</span>
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}