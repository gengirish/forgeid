import { AuditLogPanel } from "../../../components/audit-log-panel";
import { mockAuditEvents } from "../../../lib/mock-data";

export default function AuditPage() {
  return <AuditLogPanel events={mockAuditEvents} />;
}
