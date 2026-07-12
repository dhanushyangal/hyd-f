/**
 * Remounts on each /app/* navigation for a fast enter animation.
 * Layout (sidebar/navbar) stays mounted — only page content fades in.
 */
export default function AppTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="app-page-enter h-full min-h-0">{children}</div>;
}
