import { Layout } from "@/components/layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <div className="space-y-10 py-6">
        {children}
      </div>
    </Layout>
  );
}
