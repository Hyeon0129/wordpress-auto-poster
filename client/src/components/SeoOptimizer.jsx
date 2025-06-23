import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Loader2, Search, FileText, Users, Tag, Image } from 'lucide-react';

const SeoOptimizer = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('analyze');

  // SEO 분석 상태
  const [analysisInput, setAnalysisInput] = useState({ title: '', content: '', target_keyword: '' });
  const [analysisResult, setAnalysisResult] = useState(null);

  // 키워드 리서치 상태
  const [keywordInput, setKeywordInput] = useState('');
  const [keywordResult, setKeywordResult] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysisResult(null);
    try {
      const response = await fetch('/api/seo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisInput)
      });
      const data = await response.json();
      if (data.success) {
        setAnalysisResult(data.data);
      } else {
        // Handle error
      }
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordResearch = async () => {
    setLoading(true);
    setKeywordResult(null);
    try {
      const response = await fetch('/api/seo/keyword-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keywordInput })
      });
      const data = await response.json();
      if (data.success) {
        setKeywordResult(data.data);
      } else {
        // Handle error
      }
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO 최적화 도구</CardTitle>
        <CardDescription>콘텐츠의 SEO를 분석하고, 키워드를 리서치하여 검색 순위를 높여보세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analyze">콘텐츠 분석</TabsTrigger>
            <TabsTrigger value="research">키워드 리서치</TabsTrigger>
          </TabsList>
          <TabsContent value="analyze" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input id="title" placeholder="게시물 제목" value={analysisInput.title} onChange={(e) => setAnalysisInput({...analysisInput, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">콘텐츠</Label>
              <Textarea id="content" placeholder="분석할 콘텐츠를 입력하세요." value={analysisInput.content} onChange={(e) => setAnalysisInput({...analysisInput, content: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyword">타겟 키워드</Label>
              <Input id="keyword" placeholder="핵심 키워드" value={analysisInput.target_keyword} onChange={(e) => setAnalysisInput({...analysisInput, target_keyword: e.target.value})} />
            </div>
            <Button onClick={handleAnalyze} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />} 분석 시작
            </Button>
            {analysisResult && (
              <div className="mt-4 p-4 border rounded-lg">
                <h3 className="font-bold">분석 결과</h3>
                <p>SEO 점수: {analysisResult.seo_score} / 100 ({analysisResult.grade})</p>
                <p>제목 내 키워드: {analysisResult.keyword_in_title ? '있음' : '없음'}</p>
                <p>키워드 밀도: {analysisResult.keyword_density}%</p>
                <p>콘텐츠 길이: {analysisResult.content_length}자</p>
                <h4 className="font-semibold mt-2">추천 사항</h4>
                <ul>
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index}>- {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
          <TabsContent value="research" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="research-keyword">키워드</Label>
              <div className="flex gap-2">
                <Input id="research-keyword" placeholder="리서치할 키워드" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} />
                <Button onClick={handleKeywordResearch} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} 리서치
                </Button>
              </div>
            </div>
            {keywordResult && (
              <div className="mt-4 p-4 border rounded-lg">
                <h3 className="font-bold">리서치 결과: {keywordResult.seed_keyword}</h3>
                <p>경쟁 강도: {keywordResult.main_analysis.competition_level} ({keywordResult.main_analysis.difficulty_score})</p>
                <h4 className="font-semibold mt-2">관련 키워드</h4>
                <ul>
                  {keywordResult.related_keywords.map((kw, index) => (
                    <li key={index}>{kw.keyword} (경쟁: {kw.competition_level})</li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SeoOptimizer;

