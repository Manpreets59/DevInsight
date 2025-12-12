export interface RepositoryAnalysis {
  id: string
  repository: {
    owner: string
    name: string
    url: string
  }
  codeHealth: {
    score: number
    coverage?: number
    complexity?: number
  }
  issues: Issue[]
  recommendations: Recommendation[]
  metrics: CodeMetrics
  analyzedAt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface Issue {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  file: string
  line?: number
  message: string
  suggestion?: string
}

export interface Recommendation {
  category: string
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  impact: string
}

export interface CodeMetrics {
  linesOfCode: number
  filesCount: number
  avgComplexity: number
  testCoverage?: number
  dependencies: number
  vulnerabilities?: number
}