import { WebhooksPanel } from "../../../components/webhooks-panel";
import { mockWebhooks } from "../../../lib/mock-data";

export default function WebhooksPage() {
  return <WebhooksPanel initialWebhooks={mockWebhooks} />;
}
