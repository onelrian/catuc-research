"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus, Trash2, Settings2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSurvey, deleteSurvey, toggleSurveyActive } from "@/app/actions";

/**
 * Client component for Survey/Instrument Management.
 * Allows researchers to create, delete, and toggle research tools.
 */
export function SurveyManagementClient({ initialSurveys }: { initialSurveys: any[] }) {
  const router = useRouter();
  const { toast } = useToast();
  
  // State management for existing surveys and new instrument design
  const [surveys] = useState(initialSurveys);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSurveyTitle, setNewSurveyTitle] = useState("");
  const [newSurveyDesc, setNewSurveyDesc] = useState("");
  const [newQuestions, setNewQuestions] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddQuestion = () => {
    setNewQuestions(prev => [
      ...prev,
      {
        id: Date.now(), 
        text: "",
        type: "text",
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
        type: "multiple_choice",
        isRequired: true,
        options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], 
      }
    ]);
  };

  const handleQuestionChange = (id: number, field: string, value: any) => {
    setNewQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleRemoveQuestion = (id: number) => {
    setNewQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleCreateSubmit = async () => {
    if (!newSurveyTitle) {
      toast({ title: "Missing Title", description: "Instrument requires a title.", variant: "destructive" });
      return;
    }
    
    setIsCreating(true);
    
    const formattedQuestions = newQuestions.map((q, idx) => ({
      text: q.text,
      type: q.type,
      isRequired: q.isRequired,
      options: q.type === 'multiple_choice' ? q.options.filter((o: string) => o.trim() !== '') : undefined,
      orderIndex: idx
    }));

    const result = await createSurvey({
      title: newSurveyTitle,
      description: newSurveyDesc,
      questions: formattedQuestions
    });
    
    setIsCreating(false);
    
    if (result.success) {
      setIsCreateOpen(false);
      setNewSurveyTitle("");
      setNewSurveyDesc("");
      setNewQuestions([]);
      toast({ title: "Instrument Created", description: "Ready for data collection." });
      router.refresh();
    } else {
      toast({
        title: "Creation Error",
        description: result.error || "Failed to create instrument.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (surveyId: number) => {
    if (confirm("WARNING: This will permanently delete the instrument and all collected data. Proceed?")) {
      const result = await deleteSurvey(surveyId);
      if (result.success) {
        toast({ title: "Instrument Deleted", variant: "destructive" });
        router.refresh();
      } else {
        toast({ title: "Delete Error", description: "Failed to delete instrument.", variant: "destructive" });
      }
    }
  };

  const handleToggleActive = async (surveyId: number, isActive: boolean) => {
    const result = await toggleSurveyActive(surveyId, isActive);
    if (result.success) {
      toast({ title: "Status Updated", description: `Instrument is now ${isActive ? 'active' : 'archived'}.` });
      router.refresh();
    } else {
      toast({ title: "Update Error", description: "Failed to update instrument status.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border/50">
        <div className="space-y-2 text-left">
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSurveyTitle(e.target.value)} 
                    placeholder="e.g. Entrepreneurial Intentions Among University Students" 
                    className="text-lg py-6"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc" className="text-base font-semibold">Participant Briefing</Label>
                  <Textarea 
                    id="desc" 
                    value={newSurveyDesc} 
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewSurveyDesc(e.target.value)} 
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
                    <Button type="button" variant="outline" size="sm" onClick={handleAddLikertTemplate}>+ Add 5-Pt Likert</Button>
                    <Button type="button" size="sm" onClick={handleAddQuestion}>+ Custom Question</Button>
                  </div>
                </div>

                {newQuestions.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-muted/10">
                    <h4 className="text-lg font-medium text-foreground mb-2">Instrument is empty</h4>
                    <Button type="button" variant="secondary" onClick={handleAddQuestion}>Add First Question</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {newQuestions.map((q) => (
                      <Card key={q.id} className="relative overflow-hidden">
                        <div className="absolute top-4 right-4 flex gap-2">
                          <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemoveQuestion(q.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <CardContent className="pt-6 pl-8 pr-16 space-y-6">
                          <Input value={q.text} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuestionChange(q.id, 'text', e.target.value)} placeholder="Enter statement" />
                          <Select value={q.type} onValueChange={(val: string) => handleQuestionChange(q.id, 'type', val)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Qualitative (Text)</SelectItem>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="rating">Likert Scale (1–5)</SelectItem>
                              <SelectItem value="yes_no">Binary (Yes/No)</SelectItem>
                            </SelectContent>
                          </Select>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateSubmit} disabled={isCreating}>{isCreating ? "Publishing..." : "Publish Instrument"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 text-left">
        {surveys.map(survey => (
          <Card key={survey.id} className={`p-6 sm:p-8 rounded-2xl ${survey.isActive ? 'border-l-4 border-l-primary' : 'bg-muted/30 border-l-4 border-l-muted-foreground'}`}>
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-4 mb-1">
                  <h3 className="font-serif font-bold text-2xl">{survey.title}</h3>
                  <div className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${survey.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                    {survey.isActive ? 'Active' : 'Archived'}
                  </div>
                </div>
                {survey.description && <p className="text-muted-foreground text-base line-clamp-2">{survey.description}</p>}
                <div className="flex items-center gap-6 mt-4 text-sm font-medium text-muted-foreground">
                  <span>ID: INS-{survey.id.toString().padStart(4, '0')}</span>
                  <span>Created: {format(new Date(survey.createdAt), "MMM d, yyyy")}</span>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">{survey.responseCount} Responses</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Link href={`/dashboard/surveys/${survey.id}/results`}>
                  <Button variant="secondary" className="font-semibold rounded-full px-6">Analyze</Button>
                </Link>
                <Switch 
                  checked={survey.isActive} 
                  onCheckedChange={(val: boolean) => handleToggleActive(survey.id, val)}
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full text-destructive" 
                  onClick={() => handleDelete(survey.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
