"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowLeft, Download, FileSpreadsheet, BarChart3 } from "lucide-react";
import Link from "next/link";

const DEMO_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
const YES_NO_COLORS = ['hsl(var(--chart-4))', 'hsl(var(--destructive))'];

const LIKERT_CHART_COLORS = [
  '#e11d48', // rose-600
  '#f59e0b', // orange-500
  '#94a3b8', // slate-400
  '#10b981', // emerald-500
  '#047857', // emerald-700
];

const LIKERT_KEYS = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];

export function ResultsViewer({ results, rawData, surveyId }: { results: any, rawData: any[], surveyId: number }) {
  const sectionData = useMemo(() => {
    if (!results) return [];

    const map = new Map<string, { questions: any[], totalScore: number, scoreCount: number }>();
    
    results.questionResults.forEach((qr: any) => {
      let section = "General Data";
      const match = qr.questionText.match(/^([A-Z])\d+\./);
      if (match) {
        section = `Section ${match[1]}`;
      }

      if (!map.has(section)) {
        map.set(section, { questions: [], totalScore: 0, scoreCount: 0 });
      }
      
      const secInfo = map.get(section)!;
      secInfo.questions.push(qr);

      if (qr.questionType === 'multiple_choice' && qr.choiceCounts && Object.keys(qr.choiceCounts).includes("Strongly Disagree")) {
        let sum = 0;
        let count = 0;
        Object.entries(qr.choiceCounts).forEach(([key, val]: [string, any]) => {
          const weight = LIKERT_KEYS.indexOf(key) + 1;
          if (weight > 0) {
            sum += weight * val;
            count += val;
          }
        });
        
        if (count > 0) {
          const mean = sum / count;
          secInfo.totalScore += mean;
          secInfo.scoreCount += 1;
          qr.likertMean = mean;
          
          const percentData: any = { name: 'Distribution' };
          LIKERT_KEYS.forEach(k => {
            percentData[k] = ((qr.choiceCounts![k] || 0) / count) * 100;
          });
          qr.likertStackedData = [percentData];
        }
      }
    });

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      questions: data.questions,
      meanScore: data.scoreCount > 0 ? (data.totalScore / data.scoreCount) : null
    }));
  }, [results]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border/50">
        <div className="space-y-2 text-left">
          <Link href="/dashboard/surveys" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Instruments
          </Link>
          <h1 className="text-4xl font-serif font-bold text-foreground tracking-tight">{results.surveyTitle}</h1>
          <p className="text-lg text-muted-foreground">Results Analysis & Data View</p>
        </div>
        <Link href={`/survey/${surveyId}`}>
          <Button variant="outline" className="rounded-full px-6">View Instrument Form</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 rounded-2xl border-border/50 bg-card shadow-sm text-left">
          <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Participants</div>
          <div className="text-5xl font-serif font-bold text-foreground">{results.totalResponses}</div>
        </Card>
        <Card className="p-6 rounded-2xl border-border/50 bg-card shadow-sm text-left">
          <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Completion Rate</div>
          <div className="text-5xl font-serif font-bold text-foreground">
            {Math.round(results.completionRate * 100)}<span className="text-3xl text-muted-foreground">%</span>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="visual" className="w-full mt-10">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="visual" className="rounded-lg font-semibold py-2.5">
            <BarChart3 className="w-4 h-4 mr-2" /> Visual Insights
          </TabsTrigger>
          <TabsTrigger value="raw" className="rounded-lg font-semibold py-2.5">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Raw Data Table
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-12 mt-8 text-left">
          {sectionData.map((section, sIdx) => (
            <div key={sIdx} className="space-y-6">
              <div className="flex items-center gap-4 py-2 border-b-2 border-border/60">
                <h2 className="text-2xl font-serif font-bold text-foreground">{section.name}</h2>
                {section.meanScore !== null && (
                  <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                    Section Mean: {section.meanScore.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-8">
                {section.questions.map((qr) => {
                  const isLikert = qr.likertStackedData !== undefined;
                  const isYesNo = qr.questionType === 'yes_no';
                  const isDemoMC = qr.questionType === 'multiple_choice' && !isLikert;
                  
                  return (
                    <Card key={qr.questionId} className="overflow-hidden rounded-2xl border-border/60 shadow-sm bg-card">
                      <CardHeader className="bg-muted/10 border-b border-border/40 pb-5">
                        <div className="flex justify-between gap-4 items-start">
                          <CardTitle className="text-lg font-medium leading-relaxed">
                            {qr.questionText}
                          </CardTitle>
                          {isLikert && (
                            <div className="flex flex-col items-center shrink-0 bg-background border border-border rounded-lg px-4 py-2 shadow-sm">
                              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Mean</span>
                              <span className="text-2xl font-bold text-primary">{qr.likertMean.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {isLikert && (
                          <div className="h-[120px] w-full pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={qr.likertStackedData} layout="vertical" barSize={40}>
                                <XAxis type="number" hide domain={[0, 100]} />
                                <YAxis type="category" dataKey="name" hide />
                                <RechartsTooltip 
                                  formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                                />
                                {LIKERT_KEYS.map((k, i) => (
                                  <Bar key={k} dataKey={k} stackId="a" fill={LIKERT_CHART_COLORS[i]} />
                                ))}
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {(isYesNo || isDemoMC) && qr.choiceCounts && (
                          <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="h-[250px] w-[250px] shrink-0">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={Object.entries(qr.choiceCounts).map(([name, value]) => ({ name, value }))}
                                    cx="50%" cy="50%" innerRadius={isYesNo ? 60 : 0} outerRadius={110} paddingAngle={2} dataKey="value" stroke="none"
                                  >
                                    {Object.keys(qr.choiceCounts).map((key, index) => (
                                      <Cell key={`cell-${index}`} fill={isYesNo ? (key==="Yes" ? YES_NO_COLORS[0] : YES_NO_COLORS[1]) : DEMO_COLORS[index % DEMO_COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex-1 w-full space-y-2">
                              {Object.entries(qr.choiceCounts as Record<string, number>).sort((a, b) => b[1] - a[1]).map(([key, val], idx) => (
                                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/40">
                                  <span className="font-medium text-sm">{key}</span>
                                  <span className="text-muted-foreground text-sm">{val} ({Math.round((val / qr.totalAnswers) * 100)}%)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="raw" className="mt-8 text-left">
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b border-border/40 py-5 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-serif">Raw Data Matrix</CardTitle>
              <Button variant="outline" size="sm" className="rounded-full font-semibold gap-2">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-[180px] font-bold text-foreground">Timestamp</TableHead>
                      {results.questionResults.map((q: any) => (
                        <TableHead key={q.questionId} className="min-w-[250px] font-semibold text-foreground">{q.questionText}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rawData.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground font-mono text-xs">
                          {format(new Date(response.submittedAt), "yyyy-MM-dd HH:mm")}
                        </TableCell>
                        {results.questionResults.map((q: any) => {
                          const answer = response.answers.find((a: any) => a.questionId === q.questionId);
                          return (
                            <TableCell key={q.questionId}>
                              {answer?.values?.length ? answer.values.join(", ") : answer?.value || "-"}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
