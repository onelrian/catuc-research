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
  Legend
} from "recharts";
import {
  useGetSurveyResults,
  getGetSurveyResultsQueryKey,
  useGetRawResponses,
  getGetRawResponsesQueryKey
} from "@workspace/api-client-react";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function SurveyResultsPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const id = parseInt(surveyId || "0", 10);

  const { data: results, isLoading: loadingResults } = useGetSurveyResults(id, {
    query: { enabled: !!id, queryKey: getGetSurveyResultsQueryKey(id) }
  });

  const { data: rawData, isLoading: loadingRaw } = useGetRawResponses(id, {
    query: { enabled: !!id, queryKey: getGetRawResponsesQueryKey(id) }
  });

  if (isNaN(id)) return <Layout><div className="p-8 text-center text-destructive">Invalid Survey ID</div></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 mt-4">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/dashboard/surveys" className="text-sm text-muted-foreground hover:text-foreground">
                Surveys
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-medium text-foreground">Results</span>
            </div>
            {loadingResults ? (
              <div className="h-8 bg-muted rounded w-64 animate-pulse mt-2"></div>
            ) : (
              <h1 className="text-3xl font-serif font-semibold text-primary tracking-tight">{results?.surveyTitle}</h1>
            )}
          </div>
          <Link href={`/survey/${id}`}>
            <Button variant="outline">View Survey Form</Button>
          </Link>
        </div>

        {loadingResults ? (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card><CardHeader><div className="h-16"></div></CardHeader></Card>
              <Card><CardHeader><div className="h-16"></div></CardHeader></Card>
            </div>
          </div>
        ) : results ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Total Responses</div>
                  <div className="text-4xl font-bold text-foreground">{results.totalResponses}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Completion Rate</div>
                  <div className="text-4xl font-bold text-foreground">
                    {Math.round(results.completionRate * 100)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="insights" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="insights">Visual Insights</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>

              <TabsContent value="insights" className="space-y-8 mt-6">
                {results.questionResults.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
                    No questions found for this survey.
                  </div>
                ) : results.totalResponses === 0 ? (
                  <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
                    No responses yet. Share your survey to collect data.
                  </div>
                ) : (
                  results.questionResults.map((qr) => (
                    <Card key={qr.questionId} className="overflow-hidden">
                      <CardHeader className="bg-muted/10 border-b pb-4">
                        <CardTitle className="text-lg font-medium leading-snug">
                          {qr.questionText}
                        </CardTitle>
                        <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                          {qr.questionType.replace('_', ' ')} • {qr.totalAnswers} answers
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        
                        {(qr.questionType === 'multiple_choice' || qr.questionType === 'yes_no') && qr.choiceCounts && (
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={Object.entries(qr.choiceCounts).map(([name, value]) => ({ name, value }))}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={100}
                                  paddingAngle={2}
                                  dataKey="value"
                                  label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                >
                                  {Object.keys(qr.choiceCounts).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}
                                />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {qr.questionType === 'rating' && qr.ratingDistribution && (
                          <div>
                            <div className="mb-6 text-center">
                              <span className="text-4xl font-bold text-primary">{qr.averageRating?.toFixed(1)}</span>
                              <span className="text-muted-foreground ml-2">Average Rating</span>
                            </div>
                            <div className="h-[200px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={
                                  Array.from({length: 10}, (_, i) => ({
                                    rating: (i + 1).toString(),
                                    count: qr.ratingDistribution?.[(i + 1).toString()] || 0
                                  }))
                                }>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                  <XAxis dataKey="rating" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                  <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                  <RechartsTooltip 
                                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                  />
                                  <Bar dataKey="count" name="Responses" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {qr.questionType === 'text' && qr.textAnswers && (
                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {qr.textAnswers.length === 0 ? (
                              <div className="text-muted-foreground text-sm italic">No text answers provided.</div>
                            ) : (
                              qr.textAnswers.map((ans, i) => (
                                <div key={i} className="p-3 bg-muted/30 border rounded text-sm text-foreground">
                                  "{ans}"
                                </div>
                              ))
                            )}
                          </div>
                        )}

                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="raw" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Raw Response Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingRaw ? (
                      <div className="h-32 flex items-center justify-center text-muted-foreground">Loading data...</div>
                    ) : rawData && rawData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[180px]">Submitted At</TableHead>
                              {results.questionResults.map(q => (
                                <TableHead key={q.questionId} className="min-w-[200px]">
                                  {q.questionText}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rawData.map(response => (
                              <TableRow key={response.id}>
                                <TableCell className="whitespace-nowrap text-muted-foreground">
                                  {format(new Date(response.submittedAt), "MMM d, yyyy HH:mm")}
                                </TableCell>
                                {results.questionResults.map(q => {
                                  const answer = response.answers.find(a => a.questionId === q.questionId);
                                  let displayVal = "-";
                                  if (answer) {
                                    if (answer.values && answer.values.length > 0) displayVal = answer.values.join(", ");
                                    else if (answer.value) displayVal = answer.value;
                                  }
                                  return (
                                    <TableCell key={q.questionId} className="max-w-[300px] truncate" title={displayVal}>
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
                      <div className="text-center py-8 text-muted-foreground">No responses recorded yet.</div>
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
