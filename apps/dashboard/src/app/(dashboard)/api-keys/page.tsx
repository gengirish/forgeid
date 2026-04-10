import { ApiKeysPanel } from "../../../components/api-keys-panel";
import { mockApiKeys } from "../../../lib/mock-data";

export default function ApiKeysPage() {
  return <ApiKeysPanel initialKeys={mockApiKeys} />;
}
