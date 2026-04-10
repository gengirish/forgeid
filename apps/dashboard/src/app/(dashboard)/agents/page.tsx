import { AgentsTable } from "../../../components/agents-table";
import { mockAgents } from "../../../lib/mock-data";

export default function AgentsPage() {
  return <AgentsTable initialAgents={mockAgents} />;
}
