export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-[100dvh] flex flex-col">{children}</div>;
}
