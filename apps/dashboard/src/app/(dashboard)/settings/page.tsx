import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Organization profile, billing, and security — coming soon.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>Mock settings surface for the ForgeID pitch demo.</p>
          <p>Connect SSO, SCIM, and data residency from the API when ready.</p>
        </CardContent>
      </Card>
    </div>
  );
}
