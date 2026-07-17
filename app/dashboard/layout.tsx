import { PermissionsProvider } from '../lib/permissions-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <PermissionsProvider>{children}</PermissionsProvider>;
}
