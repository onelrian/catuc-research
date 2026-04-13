import { useMemo } from "react";
import { useParams } from "wouter";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
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
  Legend,
} from "recharts";
import { ArrowLeft, Download, FileSpreadsheet, BarChart3 } from "lucide-react";
import {
  useGetSurveyResults,
  getGetSurveyResultsQueryKey,
  useGetRawResponses,
  getGetRawResponsesQueryKey
} from "@workspace/api-client-react";

const DEMO_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
const YES_NO_COLORS = ['hsl(var(--chart-4))', 'hsl(var(--destructive))'];

// Likert colors: SD -> SA
const LIKERT_CHART_COLORS = [
  '#e11d48', // rose-600
  '#f59e0b', // orange-500
  '#94a3b8', // slate-400
  '#10b981', // emerald-500
  '#047857', // emerald-700
];

const LIKERT_KEYS = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];

export default function SurveyResultsPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const id = parseInt(surveyId || "0", 10);

  const { data: results, isLoading: loadingResults } = useGetSurveyResults(id, {
    query: { enabled: !!id, queryKey: getGetSurveyResultsQueryKey(id) }
  });

  const { data: rawData, isLoading: loadingRaw } = useGetRawResponses(id, {
    query: { enabled: !!id, queryKey: getGetRawResponsesQueryKey(id) }
  });

  // Calculate Likert means and group by section
  const sectionData = useMemo(() => {
    if (!results) return [];

    const map = new Map<string, { questions: any[], totalScore: number, scoreCount: number }>();
    
    results.questionResults.forEach(qr => {
      // We don't have direct access to `section` in QuestionResult from the schema provided,
      // but we can deduce it if it's prepended, or put them all in "General".
      // Based on instructions: "Group question results by their section with section headers".
      // Wait, QuestionResult type in api.schemas.ts doesn't include section.
      // Let's attempt to infer section from text if it has a prefix like "B1."
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

      // Check if it's a Likert question by examining choices
      if (qr.questionType === 'multiple_choice' && qr.choiceCounts && Object.keys(qr.choiceCounts).includes("Strongly Disagree")) {
        // Calculate mean score
        let sum = 0;
        let count = 0;
        Object.entries(qr.choiceCounts).forEach(([key, val]) => {
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
          // attach mean to qr for rendering
          (qr as any).likertMean = mean;
          
          // Prepare data for stacked bar: convert counts to percentages
          const percentData: any = { name: 'Distribution' };
          LIKERT_KEYS.forEach(k => {
            percentData[k] = ((qr.choiceCounts![k] || 0) / count) * 100;
          });
          (qr as any).likertStackedData = [percentData];
        }
      }
    });

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      questions: data.questions,
      meanScore: data.scoreCount > 0 ? (data.totalScore / data.scoreCount) : null
    }));
  }, [results]);


  if (isNaN(id)) return <Layout><div className="p-8 text-center text-destructive">Invalid Survey ID</div></Layout>;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 mt-4 mb-20">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border/50">
          <div className="space-y-2">
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            {loadingResults ? (
              <div className="h-10 bg-muted rounded w-96 animate-pulse"></div>
            ) : (
              <>
                <h1 className="text-4xl font-serif font-bold text-foreground tracking-tight">{results?.surveyTitle}</h1>
                <p className="text-lg text-muted-foreground">Results Analysis & Data View</p>
              </>
            )}
          </div>
          <Link href={`/survey/${id}`}>
            <Button variant="outline" className="rounded-full px-6">
              View Instrument Form
            </Button>
          </Link>
        </div>

        {loadingResults ? (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1,2,3].map(i => <Card key={i} className="h-32 rounded-2xl"></Card>)}
            </div>
          </div>
        ) : results ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="rounded-2xl border-border/50 bg-card shadow-sm">
                <CardContent className="p-6">
                  <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Participants</div>
                  <div className="text-5xl font-serif font-bold text-foreground">{results.totalResponses}</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/50 bg-card shadow-sm">
                <CardContent className="p-6">
                  <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Completion Rate</div>
                  <div className="text-5xl font-serif font-bold text-foreground">
                    {Math.round(results.completionRate * 100)}<span className="text-3xl text-muted-foreground">%</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Display overall means for sections if available */}
              {sectionData.filter(s => s.meanScore !== null).slice(0, 2).map((sec, i) => (
                <Card key={i} className="rounded-2xl border-border/50 bg-primary/5 shadow-sm">
                  <CardContent className="p-6">
                    <div className="text-sm font-semibold text-primary uppercase tracking-wider mb-2 line-clamp-1">{sec.name} Mean</div>
                    <div className="text-5xl font-serif font-bold text-primary">
                      {sec.meanScore?.toFixed(2)}<span className="text-xl text-primary/60 font-sans ml-1">/5</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="visual" className="w-full mt-10">
              <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="visual" className="rounded-lg font-semibold py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <BarChart3 className="w-4 h-4 mr-2" /> Visual Insights
                </TabsTrigger>
                <TabsTrigger value="raw" className="rounded-lg font-semibold py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Raw Data Table
                </TabsTrigger>
              </TabsList>

              <TabsContent value="visual" className="space-y-12 mt-8">
                {results.questionResults.length === 0 ? (
                  <div className="text-center py-20 border border-dashed rounded-2xl bg-card text-muted-foreground font-medium text-lg">
                    No questions found for this instrument.
                  </div>
                ) : results.totalResponses === 0 ? (
                  <div className="text-center py-20 border border-dashed rounded-2xl bg-card text-muted-foreground font-medium text-lg">
                    Data collection pending. Share instrument to gather insights.
                  </div>
                ) : (
                  sectionData.map((section, sIdx) => (
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
                          const isLikert = (qr as any).likertStackedData !== undefined;
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
                                      <span className="text-2xl font-bold text-primary">{(qr as any).likertMean.toFixed(2)}</span>
                                    </div>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent className="p-6">
                                
                                {isLikert && (
                                  <div className="space-y-4">
                                    <div className="h-[80px] w-full">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={(qr as any).likertStackedData} layout="vertical" barSize={40}>
                                          <XAxis type="number" hide domain={[0, 100]} />
                                          <YAxis type="category" dataKey="name" hide />
                                          <RechartsTooltip 
                                            formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                                            contentStyle={{ borderRadius: '8px', fontWeight: 500, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                          />
                                          {LIKERT_KEYS.map((k, i) => (
                                            <Bar key={k} dataKey={k} stackId="a" fill={LIKERT_CHART_COLORS[i]} />
                                          ))}
                                        </BarChart>
                                      </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: LIKERT_CHART_COLORS[0]}}></div>
                                        <span className="text-xs font-semibold text-muted-foreground">Strongly Disagree</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-muted-foreground">Strongly Agree</span>
                                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: LIKERT_CHART_COLORS[4]}}></div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {(isYesNo || isDemoMC) && qr.choiceCounts && (
                                  <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="h-[250px] w-[250px] shrink-0">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                          <Pie
                                            data={Object.entries(qr.choiceCounts).map(([name, value]) => ({ name, value }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={isYesNo ? 60 : 0} // Donut for yes/no, pie for demo
                                            outerRadius={110}
                                            paddingAngle={isYesNo ? 2 : 1}
                                            dataKey="value"
                                            stroke="none"
                                          >
                                            {Object.keys(qr.choiceCounts).map((key, index) => (
                                              <Cell key={`cell-${index}`} fill={isYesNo ? (key==="Yes" ? YES_NO_COLORS[0] : YES_NO_COLORS[1]) : DEMO_COLORS[index % DEMO_COLORS.length]} />
                                            ))}
                                          </Pie>
                                          <RechartsTooltip 
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))', fontWeight: 600 }}
                                          />
                                        </PieChart>
                                      </ResponsiveContainer>
                                    </div>
                                    <div className="flex-1 w-full space-y-3">
                                      {Object.entries(qr.choiceCounts).sort((a,b)=>b[1]-a[1]).map(([key, val], idx) => {
                                        const percent = Math.round((val / qr.totalAnswers) * 100);
                                        const color = isYesNo ? (key==="Yes" ? YES_NO_COLORS[0] : YES_NO_COLORS[1]) : DEMO_COLORS[idx % DEMO_COLORS.length];
                                        return (
                                          <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/40">
                                            <div className="flex items-center gap-3">
                                              <div className="w-4 h-4 rounded-full" style={{backgroundColor: color}}></div>
                                              <span className="font-medium text-sm">{key}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                              <span className="text-muted-foreground text-sm">{val} ({percent}%)</span>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                {qr.questionType === 'text' && qr.textAnswers && (
                                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-border">
                                    {qr.textAnswers.length === 0 ? (
                                      <div className="text-muted-foreground text-sm italic p-4 bg-muted/20 rounded-lg text-center">No qualitative data provided.</div>
                                    ) : (
                                      qr.textAnswers.map((ans, i) => (
                                        <div key={i} className="p-4 bg-muted/20 border border-border/40 rounded-xl text-sm text-foreground leading-relaxed">
                                          "{ans}"
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="raw" className="mt-8">
                <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/10 border-b border-border/40 py-5 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-serif">Raw Data Matrix</CardTitle>
                    <Button variant="outline" size="sm" className="rounded-full font-semibold gap-2">
                      <Download className="w-4 h-4" /> Export CSV
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingRaw ? (
                      <div className="h-64 flex items-center justify-center text-muted-foreground font-medium">Loading matrix...</div>
                    ) : rawData && rawData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="w-[180px] font-bold text-foreground">Timestamp</TableHead>
                              {results.questionResults.map(q => (
                                <TableHead key={q.questionId} className="min-w-[250px] font-semibold text-foreground">
                                  <div className="line-clamp-2" title={q.questionText}>{q.questionText}</div>
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rawData.map((response, i) => (
                              <TableRow key={response.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                                <TableCell className="whitespace-nowrap text-muted-foreground font-mono text-xs">
                                  {format(new Date(response.submittedAt), "yyyy-MM-dd HH:mm")}
                                </TableCell>
                                {results.questionResults.map(q => {
                                  const answer = response.answers.find(a => a.questionId === q.questionId);
                                  let displayVal = "-";
                                  if (answer) {
                                    if (answer.values && answer.values.length > 0) displayVal = answer.values.join(", ");
                                    else if (answer.value) displayVal = answer.value;
                                  }
                                  return (
                                    <TableCell key={q.questionId} className="max-w-[300px] truncate text-sm" title={displayVal}>
                                      {displayVal}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-16 text-muted-foreground font-medium text-lg">No raw records available.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>
    </Layout>
  );
}
