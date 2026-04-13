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
import {
  useListSurveys,
  getListSurveysQueryKey,
  useCreateSurvey,
  useUpdateSurvey,
  useDeleteSurvey,
  QuestionType,
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
        toast({ title: "Survey updated", description: `Survey is now ${isActive ? 'active' : 'inactive'}.` });
      }
    });
  };

  const handleDelete = (surveyId: number) => {
    if (confirm("Are you sure you want to delete this survey? All responses will be lost.")) {
      deleteSurvey({ surveyId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSurveysQueryKey() });
          toast({ title: "Survey deleted" });
        }
      });
    }
  };

  const handleAddQuestion = () => {
    setNewQuestions(prev => [
      ...prev,
      {
        id: Date.now(), // temp id
        text: "",
        type: CreateQuestionBodyType.text,
        isRequired: false,
        options: [""], // for multiple choice
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
      toast({ title: "Missing title", description: "Please provide a survey title", variant: "destructive" });
      return;
    }

    if (newQuestions.length === 0) {
      toast({ title: "Missing questions", description: "Please add at least one question", variant: "destructive" });
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
        toast({ title: "Survey created successfully" });
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 mt-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-serif font-semibold text-primary tracking-tight">Survey Management</h1>
            <p className="text-muted-foreground mt-1">Create and manage your research studies.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>Create New Study</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-serif">Create New Study</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Study Title *</Label>
                      <Input 
                        id="title" 
                        value={newSurveyTitle} 
                        onChange={e => setNewSurveyTitle(e.target.value)} 
                        placeholder="e.g. Impact of Remote Work on Productivity" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="desc">Description</Label>
                      <Textarea 
                        id="desc" 
                        value={newSurveyDesc} 
                        onChange={e => setNewSurveyDesc(e.target.value)} 
                        placeholder="Provide a brief overview for participants" 
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-lg">Questions</h3>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
                        + Add Question
                      </Button>
                    </div>

                    {newQuestions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border rounded bg-muted/20">
                        No questions added yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {newQuestions.map((q, idx) => (
                          <Card key={q.id} className="relative">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveQuestion(q.id)}
                            >
                              Remove
                            </Button>
                            <CardContent className="pt-6 space-y-4">
                              <div className="flex gap-4">
                                <div className="flex-1 space-y-2">
                                  <Label>Question Text</Label>
                                  <Input 
                                    value={q.text} 
                                    onChange={e => handleQuestionChange(q.id, 'text', e.target.value)} 
                                    placeholder="Enter your question" 
                                  />
                                </div>
                                <div className="w-48 space-y-2">
                                  <Label>Type</Label>
                                  <Select 
                                    value={q.type} 
                                    onValueChange={val => handleQuestionChange(q.id, 'type', val)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Open Text</SelectItem>
                                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                      <SelectItem value="rating">Rating (1-10)</SelectItem>
                                      <SelectItem value="yes_no">Yes / No</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`req-${q.id}`} 
                                  checked={q.isRequired} 
                                  onCheckedChange={val => handleQuestionChange(q.id, 'isRequired', !!val)}
                                />
                                <Label htmlFor={`req-${q.id}`} className="font-normal cursor-pointer">Required question</Label>
                              </div>

                              {q.type === 'multiple_choice' && (
                                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                                  <Label>Options</Label>
                                  {q.options?.map((opt: string, optIdx: number) => (
                                    <Input 
                                      key={optIdx}
                                      value={opt}
                                      onChange={e => handleQuestionOptionChange(q.id, optIdx, e.target.value)}
                                      placeholder={`Option ${optIdx + 1}`}
                                      className="max-w-md mb-2"
                                    />
                                  ))}
                                  <Button type="button" variant="ghost" size="sm" onClick={() => handleAddOption(q.id)} className="text-primary">
                                    + Add Option
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateSubmit} disabled={isCreating}>
                    {isCreating ? "Creating..." : "Save Study"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-1/4"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : surveys?.length === 0 ? (
          <div className="text-center py-16 border rounded-lg bg-card">
            <h3 className="text-xl font-medium text-foreground mb-2">No studies yet</h3>
            <p className="text-muted-foreground mb-6">Create your first research study to start collecting data.</p>
            <Button onClick={() => setIsCreateOpen(true)}>Create New Study</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {surveys?.map(survey => (
              <Card key={survey.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-6">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-lg text-foreground">{survey.title}</h3>
                    {!survey.isActive && (
                      <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded font-medium">Inactive</span>
                    )}
                  </div>
                  {survey.description && (
                    <p className="text-muted-foreground text-sm line-clamp-1">{survey.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground flex gap-4 mt-2">
                    <span>Created: {format(new Date(survey.createdAt), "MMM d, yyyy")}</span>
                    <span>{survey.responseCount} responses</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${survey.id}`} className="text-xs text-muted-foreground">Active</Label>
                    <Switch 
                      id={`active-${survey.id}`} 
                      checked={survey.isActive} 
                      onCheckedChange={(val) => handleToggleActive(survey.id, val)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/surveys/${survey.id}/results`}>
                      <Button variant="secondary" size="sm">Results</Button>
                    </Link>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(survey.id)}>
                      Delete
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
