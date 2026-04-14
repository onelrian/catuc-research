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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { ArrowLeft, Download, FileSpreadsheet, BarChart3, TrendingUp, Users, Target } from "lucide-react";
import Link from "next/link";

// ── Color Palettes ──────────────────────────────────────────
const DEMO_COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8',
  '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#ec4899'
];
const YES_NO_COLORS = ['#10b981', '#ef4444'];

const RATING_GRADIENT = [
  '#ef4444', '#f97316', '#a3a3a3', '#22c55e', '#10b981',
];

const SECTION_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

// ── Statistics Helpers ──────────────────────────────────────
function calcMedian(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calcStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((s, v) => s + v, 0) / (values.length - 1));
}

function interpretScore(mean: number): string {
  if (mean >= 4.2) return "Strong Agreement";
  if (mean >= 3.4) return "Moderate Agreement";
  if (mean >= 2.6) return "Neutral";
  if (mean >= 1.8) return "Moderate Disagreement";
  return "Strong Disagreement";
}

const LIKERT_LABELS: Record<string, string> = {
  '1': 'SD', '2': 'D', '3': 'N', '4': 'A', '5': 'SA',
};

// ── Main Component ──────────────────────────────────────────
export function ResultsViewer({ results, rawData, surveyId }: { results: any, rawData: any[], surveyId: number }) {
  
  // ── Build section data from the DB's section field ──
  const sectionData = useMemo(() => {
    if (!results) return [];

    const map = new Map<string, { questions: any[], ratings: number[] }>();
    
    results.questionResults.forEach((qr: any) => {
      const section = qr.section || "General";

      if (!map.has(section)) {
        map.set(section, { questions: [], ratings: [] });
      }
      
      const secInfo = map.get(section)!;
      secInfo.questions.push(qr);

      // Collect all rating values for section-level stats
      if (qr.questionType === "rating" && qr.ratingDistribution) {
        Object.entries(qr.ratingDistribution).forEach(([val, count]: [string, any]) => {
          for (let i = 0; i < count; i++) secInfo.ratings.push(parseInt(val));
        });
      }
    });

    return Array.from(map.entries()).map(([name, data]) => {
      const sorted = [...data.ratings].sort((a, b) => a - b);
      const mean = sorted.length > 0 ? sorted.reduce((s, v) => s + v, 0) / sorted.length : null;
      return {
        name,
        shortName: name.replace(/^SECTION [A-Z]:\s*/i, ""),
        questions: data.questions,
        meanScore: mean,
        median: sorted.length > 0 ? calcMedian(sorted) : null,
        stdDev: mean !== null ? calcStdDev(sorted, mean) : null,
        n: sorted.length,
      };
    });
  }, [results]);

  // ── Radar chart data for cross-section comparison ──
  const radarData = useMemo(() => {
    return sectionData
      .filter(s => s.meanScore !== null)
      .map(s => ({
        section: s.shortName,
        mean: parseFloat(s.meanScore!.toFixed(2)),
        fullMark: 5,
      }));
  }, [sectionData]);

  // ── CSV Export Handler ──
  const handleExport = () => {
    window.open(`/api/surveys/${surveyId}/export`, "_blank");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border/50">
        <div className="space-y-2 text-left">
          <Link href="/dashboard/surveys" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Instruments
          </Link>
          <h1 className="text-4xl font-serif font-bold text-foreground tracking-tight">{results.surveyTitle}</h1>
          <p className="text-lg text-muted-foreground">Results Analysis & Data View</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-full px-6 gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Link href={`/survey/${surveyId}`}>
            <Button variant="outline" className="rounded-full px-6">View Instrument Form</Button>
          </Link>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 rounded-2xl border-border/50 bg-gradient-to-br from-card to-indigo-500/5 shadow-sm text-left">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Participants</div>
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-5xl font-serif font-bold text-foreground">{results.totalResponses}</div>
        </Card>
        <Card className="p-6 rounded-2xl border-border/50 bg-gradient-to-br from-card to-emerald-500/5 shadow-sm text-left">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Completion Rate</div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="text-5xl font-serif font-bold text-foreground">
            {Math.round(results.completionRate * 100)}<span className="text-3xl text-muted-foreground">%</span>
          </div>
        </Card>
        <Card className="p-6 rounded-2xl border-border/50 bg-gradient-to-br from-card to-orange-500/5 shadow-sm text-left">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Questions</div>
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-5xl font-serif font-bold text-foreground">{results.questionResults.length}</div>
        </Card>
        <Card className="p-6 rounded-2xl border-border/50 bg-gradient-to-br from-card to-violet-500/5 shadow-sm text-left">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sections</div>
            <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-5xl font-serif font-bold text-foreground">{sectionData.length}</div>
        </Card>
      </div>

      {/* ── Cross-Section Radar Chart ── */}
      {radarData.length > 1 && (
        <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/10 border-b border-border/40 pb-5">
            <CardTitle className="text-xl font-serif flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Cross-Section Comparison
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Mean scores across all research dimensions (1 = Strongly Disagree, 5 = Strongly Agree)</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="section" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }} 
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Radar name="Mean Score" dataKey="mean" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                  <RechartsTooltip
                    formatter={(value: number) => [value.toFixed(2), 'Mean Score']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Section means summary row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {sectionData.filter(s => s.meanScore !== null).map((s, i) => (
                <div key={s.name} className="flex items-center gap-3 p-4 rounded-xl bg-muted/20 border border-border/40">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: SECTION_COLORS[i % SECTION_COLORS.length] }} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{s.shortName}</div>
                    <div className="text-xs text-muted-foreground">
                      Mean: <span className="font-bold text-primary">{s.meanScore!.toFixed(2)}</span> · 
                      Median: {s.median} · 
                      SD: {s.stdDev!.toFixed(2)} · 
                      N={s.n}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tabs: Visual Insights / Raw Data ── */}
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
              {/* Section Header with Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 border-b-2 border-border/60">
                <h2 className="text-2xl font-serif font-bold text-foreground">{section.name}</h2>
                {section.meanScore !== null && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold">
                      Mean: {section.meanScore.toFixed(2)} / 5
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs font-semibold">
                      {interpretScore(section.meanScore)}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-8">
                {section.questions.map((qr: any) => (
                  <QuestionCard key={qr.questionId} qr={qr} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="raw" className="mt-8 text-left">
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b border-border/40 py-5 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-serif">Raw Data Matrix</CardTitle>
              <Button variant="outline" size="sm" className="rounded-full font-semibold gap-2" onClick={handleExport}>
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

// ── Individual Question Card ──────────────────────────────
function QuestionCard({ qr }: { qr: any }) {
  const isYesNo = qr.questionType === "yes_no";
  const isMultipleChoice = qr.questionType === "multiple_choice";
  const isRating = qr.questionType === "rating";
  const isText = qr.questionType === "text";

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm bg-card">
      <CardHeader className="bg-muted/10 border-b border-border/40 pb-5">
        <div className="flex justify-between gap-4 items-start">
          <CardTitle className="text-lg font-medium leading-relaxed">
            {qr.questionText}
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-2.5 py-1 rounded-md bg-muted/50 text-muted-foreground text-xs font-semibold">
              N={qr.totalAnswers}
            </div>
            {isRating && qr.averageRating && (
              <div className="flex flex-col items-center bg-background border border-border rounded-lg px-4 py-2 shadow-sm">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Mean</span>
                <span className="text-2xl font-bold text-primary">{qr.averageRating.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pb-8">
        {/* Rating Questions: Horizontal bar chart */}
        {isRating && <RatingChart qr={qr} />}

        {/* Multiple Choice / Yes-No: Pie chart with legend */}
        {(isYesNo || isMultipleChoice) && qr.choiceCounts && Object.keys(qr.choiceCounts).length > 0 && (
          <ChoiceChart qr={qr} isYesNo={isYesNo} />
        )}

        {/* Text Questions */}
        {isText && qr.textAnswers.length > 0 && (
          <div className="space-y-3">
            {qr.textAnswers.map((text: string, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-muted/20 border border-border/40 text-sm text-foreground leading-relaxed">
                {text}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {qr.totalAnswers === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No responses yet for this question.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Rating Chart Component ──────────────────────────────
function RatingChart({ qr }: { qr: any }) {
  const distribution = qr.ratingDistribution || {};
  
  // Build data for all 5 Likert values
  const data = Array.from({ length: 5 }, (_, i) => ({
    rating: LIKERT_LABELS[String(i + 1)] || String(i + 1),
    count: distribution[String(i + 1)] || 0,
  }));

  // Calculate statistics
  const allValues: number[] = [];
  Object.entries(distribution).forEach(([val, count]: [string, any]) => {
    for (let i = 0; i < count; i++) allValues.push(parseInt(val));
  });
  const sorted = [...allValues].sort((a, b) => a - b);
  const mean = qr.averageRating || 0;
  const median = calcMedian(sorted);
  const stdDev = calcStdDev(allValues, mean);
  const total = allValues.length;

  if (total === 0) return null;

  return (
    <div className="space-y-4">
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis 
              dataKey="rating" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              allowDecimals={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <RechartsTooltip
              formatter={(value: number) => [value, 'Responses']}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={RATING_GRADIENT[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Mean</div>
          <div className="text-xl font-bold text-primary">{mean.toFixed(2)}</div>
        </div>
        <div className="p-3 rounded-xl bg-muted/20 border border-border/40 text-center">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Median</div>
          <div className="text-xl font-bold text-foreground">{median}</div>
        </div>
        <div className="p-3 rounded-xl bg-muted/20 border border-border/40 text-center">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Std Dev</div>
          <div className="text-xl font-bold text-foreground">{stdDev.toFixed(2)}</div>
        </div>
        <div className="p-3 rounded-xl bg-muted/20 border border-border/40 text-center">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Interpretation</div>
          <div className="text-sm font-bold text-foreground">{interpretScore(mean)}</div>
        </div>
      </div>
    </div>
  );
}

// ── Choice Chart Component (Pie) ──────────────────────────
function ChoiceChart({ qr, isYesNo }: { qr: any; isYesNo: boolean }) {
  const entries = Object.entries(qr.choiceCounts as Record<string, number>).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  
  const pieData = entries.map(([name, value]) => ({ name, value }));
  const colors = isYesNo ? YES_NO_COLORS : DEMO_COLORS;

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="h-[260px] w-[260px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={isYesNo ? 60 : 0}
              outerRadius={100}
              paddingAngle={pieData.length > 1 ? 3 : 0}
              dataKey="value"
              stroke="hsl(var(--card))"
              strokeWidth={2}
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <RechartsTooltip 
              formatter={(value: number, name: string) => [`${value} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`, name]}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with bars */}
      <div className="flex-1 w-full space-y-2.5">
        {entries.map(([key, val], idx) => {
          const pct = total > 0 ? (val / total) * 100 : 0;
          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                  <span className="font-medium text-sm text-foreground">{key}</span>
                </div>
                <span className="text-muted-foreground text-sm font-semibold">{val} ({pct.toFixed(0)}%)</span>
              </div>
              <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ width: `${pct}%`, backgroundColor: colors[idx % colors.length] }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
