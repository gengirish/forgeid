import { RolesPanel } from "../../../components/roles-panel";
import { mockRoles } from "../../../lib/mock-data";

export default function RolesPage() {
  return <RolesPanel initialRoles={mockRoles} />;
}
