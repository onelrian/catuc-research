import { useState } from "react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Trash2, Settings, ArrowLeft, Settings2 } from "lucide-react";
import {
  useListSurveys,
  getListSurveysQueryKey,
  useCreateSurvey,
  useUpdateSurvey,
  useDeleteSurvey,
  CreateQuestionBodyType,
} from "@workspace/api-client-react";

export default function SurveyManagementPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: surveys, isLoading } = useListSurveys({ query: { queryKey: getListSurveysQueryKey() } });
  
  const { mutate: createSurvey, isPending: isCreating } = useCreateSurvey();
  const { mutate: updateSurvey } = useUpdateSurvey();
  const { mutate: deleteSurvey } = useDeleteSurvey();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSurveyTitle, setNewSurveyTitle] = useState("");
  const [newSurveyDesc, setNewSurveyDesc] = useState("");
  const [newQuestions, setNewQuestions] = useState<any[]>([]);

  const handleToggleActive = (surveyId: number, isActive: boolean) => {
    updateSurvey({ surveyId, data: { isActive } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSurveysQueryKey() });
        toast({ title: "Status Updated", description: `Instrument is now ${isActive ? 'active' : 'archived'}.` });
      }
    });
  };

  const handleDelete = (surveyId: number) => {
    if (confirm("WARNING: This will permanently delete the instrument and all collected data. Proceed?")) {
      deleteSurvey({ surveyId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSurveysQueryKey() });
          toast({ title: "Instrument Deleted", variant: "destructive" });
        }
      });
    }
  };

  const handleAddQuestion = () => {
    setNewQuestions(prev => [
      ...prev,
      {
        id: Date.now(), 
        text: "",
        type: CreateQuestionBodyType.text,
        isRequired: true,
        options: [""], 
      }
    ]);
  };

  const handleAddLikertTemplate = () => {
    setNewQuestions(prev => [
      ...prev,
      {
        id: Date.now(), 
        text: "Please state your level of agreement with the following statement.",
        type: CreateQuestionBodyType.multiple_choice,
        isRequired: true,
        options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], 
      }
    ]);
  };

  const handleQuestionChange = (id: number, field: string, value: any) => {
    setNewQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleQuestionOptionChange = (qId: number, optIndex: number, value: string) => {
    setNewQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        const newOpts = [...(q.options || [])];
        newOpts[optIndex] = value;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const handleAddOption = (qId: number) => {
    setNewQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        return { ...q, options: [...(q.options || []), ""] };
      }
      return q;
    }));
  };

  const handleRemoveQuestion = (id: number) => {
    setNewQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleCreateSubmit = () => {
    if (!newSurveyTitle) {
      toast({ title: "Missing Title", description: "Instrument requires a title.", variant: "destructive" });
      return;
    }

    if (newQuestions.length === 0) {
      toast({ title: "Empty Instrument", description: "Add at least one variable/question.", variant: "destructive" });
      return;
    }

    const formattedQuestions = newQuestions.map((q, idx) => ({
      text: q.text,
      type: q.type,
      isRequired: q.isRequired,
      options: q.type === 'multiple_choice' ? q.options.filter((o: string) => o.trim() !== '') : undefined,
      orderIndex: idx
    }));

    createSurvey({
      data: {
        title: newSurveyTitle,
        description: newSurveyDesc,
        questions: formattedQuestions
      }
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewSurveyTitle("");
        setNewSurveyDesc("");
        setNewQuestions([]);
        queryClient.invalidateQueries({ queryKey: getListSurveysQueryKey() });
        toast({ title: "Instrument Created", description: "Ready for data collection." });
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-10 mt-4 mb-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border/50">
          <div className="space-y-2">
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-serif font-bold text-foreground tracking-tight">Instrument Management</h1>
            <p className="text-lg text-muted-foreground">Design and publish academic research tools.</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full px-6 shadow-sm gap-2 font-semibold">
                <Plus className="w-5 h-5" /> New Instrument
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader className="border-b border-border pb-6">
                <DialogTitle className="text-3xl font-serif font-bold text-primary">Design Instrument</DialogTitle>
                <p className="text-muted-foreground text-sm mt-1">Configure variables and scales for data collection.</p>
              </DialogHeader>
              <div className="space-y-8 py-6 px-1">
                <div className="space-y-6 bg-muted/20 p-6 rounded-xl border border-border/50">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base font-semibold">Study Title <span className="text-destructive">*</span></Label>
                    <Input 
                      id="title" 
                      value={newSurveyTitle} 
                      onChange={e => setNewSurveyTitle(e.target.value)} 
                      placeholder="e.g. Entrepreneurial Intentions Among University Students" 
                      className="text-lg py-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc" className="text-base font-semibold">Participant Briefing</Label>
                    <Textarea 
                      id="desc" 
                      value={newSurveyDesc} 
                      onChange={e => setNewSurveyDesc(e.target.value)} 
                      placeholder="Provide consent information and instructions for participants." 
                      rows={4}
                      className="resize-y"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-border/60">
                    <h3 className="font-serif font-bold text-2xl text-foreground flex items-center gap-2">
                      <Settings2 className="w-6 h-6 text-primary" /> Variables & Scales
                    </h3>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={handleAddLikertTemplate} className="font-semibold text-primary border-primary/30 hover:bg-primary/5">
                        + Add 5-Pt Likert
                      </Button>
                      <Button type="button" size="sm" onClick={handleAddQuestion} className="font-semibold">
                        + Custom Question
                      </Button>
                    </div>
                  </div>

                  {newQuestions.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-muted/10">
                      <h4 className="text-lg font-medium text-foreground mb-2">Instrument is empty</h4>
                      <p className="text-muted-foreground mb-6">Add variables to begin designing your research tool.</p>
                      <Button type="button" variant="secondary" onClick={handleAddQuestion}>Add First Question</Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {newQuestions.map((q, idx) => (
                        <Card key={q.id} className="relative overflow-hidden border-border/60 shadow-sm">
                          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-primary/40"></div>
                          <div className="absolute top-4 right-4 flex gap-2">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:bg-destructive/10 h-8 w-8"
                              onClick={() => handleRemoveQuestion(q.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <CardContent className="pt-6 pl-8 pr-16 space-y-6">
                            <div className="flex gap-1 items-center mb-2">
                              <span className="bg-primary/10 text-primary font-bold text-xs px-2 py-0.5 rounded">VAR {idx + 1}</span>
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-6">
                              <div className="flex-1 space-y-3">
                                <Label className="font-semibold">Item Text</Label>
                                <Input 
                                  value={q.text} 
                                  onChange={e => handleQuestionChange(q.id, 'text', e.target.value)} 
                                  placeholder="Enter statement or question" 
                                  className="font-medium"
                                />
                              </div>
                              <div className="w-full md:w-56 space-y-3">
                                <Label className="font-semibold">Measurement Scale</Label>
                                <Select 
                                  value={q.type} 
                                  onValueChange={val => handleQuestionChange(q.id, 'type', val)}
                                >
                                  <SelectTrigger className="font-medium">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Qualitative (Text)</SelectItem>
                                    <SelectItem value="multiple_choice">Multiple Choice / Likert</SelectItem>
                                    <SelectItem value="rating">Numeric Scale (1-10)</SelectItem>
                                    <SelectItem value="yes_no">Binary (Yes/No)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 bg-muted/30 p-3 rounded-lg border border-border/50 w-max">
                              <Switch 
                                id={`req-${q.id}`} 
                                checked={q.isRequired} 
                                onCheckedChange={val => handleQuestionChange(q.id, 'isRequired', val)}
                              />
                              <Label htmlFor={`req-${q.id}`} className="font-semibold cursor-pointer">Mandatory Response</Label>
                            </div>

                            {q.type === 'multiple_choice' && (
                              <div className="pt-4 border-t border-border/50">
                                <Label className="font-semibold block mb-3">Choice Options</Label>
                                <div className="space-y-3">
                                  {q.options?.map((opt: string, optIdx: number) => (
                                    <div key={optIdx} className="flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">{optIdx + 1}</div>
                                      <Input 
                                        value={opt}
                                        onChange={e => handleQuestionOptionChange(q.id, optIdx, e.target.value)}
                                        placeholder={`Value ${optIdx + 1}`}
                                        className="max-w-md"
                                      />
                                    </div>
                                  ))}
                                  <Button type="button" variant="ghost" size="sm" onClick={() => handleAddOption(q.id)} className="text-primary font-semibold mt-2">
                                    <Plus className="w-4 h-4 mr-1" /> Add Value
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="border-t border-border pt-6 pb-2">
                <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-full px-6">Cancel</Button>
                <Button onClick={handleCreateSubmit} disabled={isCreating} className="rounded-full px-8 font-semibold text-base h-11">
                  {isCreating ? "Publishing..." : "Publish Instrument"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-32 rounded-2xl"></Card>
            ))}
          </div>
        ) : surveys?.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-border rounded-3xl bg-card">
            <Settings className="w-16 h-16 mx-auto text-muted-foreground mb-6 opacity-20" />
            <h3 className="text-2xl font-serif font-bold text-foreground mb-3">Repository Empty</h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">Design your first research instrument to begin collecting data for your studies.</p>
            <Button size="lg" onClick={() => setIsCreateOpen(true)} className="rounded-full px-8 font-semibold">Create Instrument</Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {surveys?.map(survey => (
              <Card key={survey.id} className={`flex flex-col md:flex-row md:items-center justify-between p-6 sm:p-8 gap-6 rounded-2xl border-border/60 transition-all ${survey.isActive ? 'bg-card shadow-md border-l-4 border-l-primary' : 'bg-muted/30 border-l-4 border-l-muted-foreground'}`}>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-4 mb-1">
                    <h3 className={`font-serif font-bold text-2xl ${survey.isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {survey.title}
                    </h3>
                    <div className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${survey.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                      {survey.isActive ? 'Active' : 'Archived'}
                    </div>
                  </div>
                  {survey.description && (
                    <p className="text-muted-foreground text-base line-clamp-2 leading-relaxed max-w-3xl">{survey.description}</p>
                  )}
                  <div className="flex items-center gap-6 mt-4 text-sm font-medium">
                    <span className="text-muted-foreground">ID: INS-{survey.id.toString().padStart(4, '0')}</span>
                    <span className="text-muted-foreground">Created: {format(new Date(survey.createdAt), "MMM d, yyyy")}</span>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">{survey.responseCount} Responses</span>
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-6 shrink-0 border-t md:border-t-0 md:border-l border-border/50 pt-6 md:pt-0 md:pl-8">
                  <div className="flex items-center gap-3">
                    <Label htmlFor={`active-${survey.id}`} className="font-semibold text-sm cursor-pointer">Accepting Data</Label>
                    <Switch 
                      id={`active-${survey.id}`} 
                      checked={survey.isActive} 
                      onCheckedChange={(val) => handleToggleActive(survey.id, val)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Link href={`/dashboard/surveys/${survey.id}/results`}>
                      <Button variant="secondary" className="font-semibold rounded-full px-6">Analyze</Button>
                    </Link>
                    <Button variant="outline" size="icon" className="rounded-full text-destructive hover:bg-destructive hover:text-destructive-foreground border-border" onClick={() => handleDelete(survey.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
