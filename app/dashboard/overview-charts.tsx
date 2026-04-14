"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * Overview Chart for Dashboard.
 * Displays survey participation counts using Recharts.
 */
export function OverviewChart({ data }: { data: { surveyTitle: string; responseCount: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm font-medium bg-muted/5 rounded-xl border border-dashed border-border">
        No response data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.slice(0, 5)} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis 
          dataKey="surveyTitle" 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(val: string) => val.length > 18 ? val.substring(0, 18) + '...' : val}
          dy={10}
        />
        <YAxis 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          dx={-10}
        />
        <RechartsTooltip 
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))', 
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            fontWeight: 500
          }}
        />
        <Bar 
          dataKey="responseCount" 
          name="Responses" 
          fill="hsl(var(--primary))" 
          radius={[6, 6, 0, 0]} 
          barSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
