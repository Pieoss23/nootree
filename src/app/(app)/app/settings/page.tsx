import { PageHeader } from "@/components/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getDemoTenant } from "@/lib/demo-tenant";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const tenant = await getDemoTenant();
  if (!tenant) return null;

  return (
    <div className="space-y-8">
      <PageHeader title="Impostazioni" description="Profilo, studio, preferenze e sicurezza." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profilo</CardTitle>
            <CardDescription>Le tue informazioni personali.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="owner-name">Nome</Label>
              <Input id="owner-name" defaultValue={tenant.ownerName} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner-email">Email</Label>
              <Input id="owner-email" defaultValue={tenant.ownerEmail} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Studio</CardTitle>
            <CardDescription>Dati dello studio visibili ai pazienti.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="studio-name">Nome studio</Label>
              <Input id="studio-name" defaultValue={tenant.tenantName} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="studio-legal-name">Ragione sociale</Label>
              <Input id="studio-legal-name" defaultValue={tenant.studioLegalName ?? ""} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferenze</CardTitle>
            <CardDescription>Lingua, fuso orario e notifiche.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Le preferenze non sono ancora configurabili in questa milestone.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sicurezza</CardTitle>
            <CardDescription>Accesso e sessioni attive.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              La gestione delle sessioni sarà disponibile insieme all&apos;autenticazione
              passwordless (Milestone 1.1).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
