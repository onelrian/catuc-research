"use client";

import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Users } from "lucide-react";

export function HeroSection() {
  return (
    <section className="text-center space-y-6 max-w-3xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        Active Research Period
      </motion.div>
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-5xl sm:text-6xl font-serif font-bold tracking-tight text-foreground"
      >
        Academic Research
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-xl text-muted-foreground leading-relaxed"
      >
        Welcome to CATUC Bamenda. Participate in active studies to advance understanding in Business and Management Sciences.
      </motion.p>
    </section>
  );
}

export function FeaturesSection() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-y border-border/50"
    >
      <div className="flex flex-col items-center text-center space-y-3 p-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-lg">Rigorous Methodology</h3>
        <p className="text-sm text-muted-foreground">Structured instruments designed for high-validity data collection.</p>
      </div>
      <div className="flex flex-col items-center text-center space-y-3 p-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-lg">Student Voices</h3>
        <p className="text-sm text-muted-foreground">Capturing comprehensive demographic and experiential data.</p>
      </div>
      <div className="flex flex-col items-center text-center space-y-3 p-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-lg">Institutional Impact</h3>
        <p className="text-sm text-muted-foreground">Driving university policy and academic understanding forward.</p>
      </div>
    </motion.div>
  );
}

import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface Survey {
  id: number;
  title: string;
  description: string | null;
  responseCount: number;
}

export function SurveyList({ surveys }: { surveys: Survey[] }) {
  if (surveys.length === 0) {
    return (
      <div className="p-16 text-center border border-dashed rounded-xl bg-muted/20">
        <h3 className="text-2xl font-serif font-medium text-foreground mb-3">No active studies</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          The research period has concluded or no studies are currently published. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {surveys.map((survey, i) => (
        <motion.div
          key={survey.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 + (i * 0.1) }}
        >
          <Card className="group transition-all duration-300 hover:shadow-lg hover:border-primary/30 overflow-hidden bg-card/50 backdrop-blur">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/80 transform origin-left scale-y-0 group-hover:scale-y-100 transition-transform duration-300 ease-out"></div>
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-foreground font-serif group-hover:text-primary transition-colors">
                {survey.title}
              </CardTitle>
              {survey.description && (
                <CardDescription className="text-base mt-3 leading-relaxed">
                  {survey.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pb-0">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {survey.responseCount} Participants</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Link href={`/survey/${survey.id}`}>
                <Button className="w-full sm:w-auto gap-2 group-hover:bg-primary/90 transition-all">
                  Participate in Study <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
