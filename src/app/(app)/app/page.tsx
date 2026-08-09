import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { PageHeader, UsageMeter, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getDemoTenant } from "@/lib/demo-tenant";
import { countActivePatients, listPatientsByTenant } from "@/modules/patients";
import { getResourceLimit } from "@/modules/entitlements";
import { getActiveSubscriptionForTenant } from "@/modules/billing";

export const dynamic = "force-dynamic";

const ONBOARDING_STEPS = [
  { label: "Studio creato", done: true },
  { label: "Titolare invitato", done: true },
  { label: "Primo paziente inserito", done: true },
  { label: "Metodo di pagamento collegato", done: false },
  { label: "Team invitato", done: false },
];

export default async function TodayPage() {
  const tenant = await getDemoTenant();
  if (!tenant) return null;

  const [activePatients, patientLimit, recentPatients, subscription] = await Promise.all([
    countActivePatients(tenant.tenantId),
    getResourceLimit(tenant.tenantId, "activePatients"),
    listPatientsByTenant({ tenantId: tenant.tenantId, limit: 5 }),
    getActiveSubscriptionForTenant(tenant.tenantId),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Ciao, ${tenant.ownerName.split(" ")[0]}`}
        description={tenant.tenantName}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stato configurazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge label="Studio attivo" tone="success" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Abbonamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {subscription ? (
              <>
                <p className="text-lg font-semibold text-foreground">{subscription.plan.name}</p>
                <StatusBadge
                  label={subscription.status === "ACTIVE" ? "Attivo" : subscription.status}
                  tone={subscription.status === "ACTIVE" ? "success" : "warning"}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun abbonamento demo trovato.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pazienti attivi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-semibold tabular-nums text-foreground">{activePatients}</p>
            <UsageMeter label="Limite piano" current={activePatients} limit={patientLimit} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ultimi pazienti inseriti</CardTitle>
            <Link
              href="/app/patients"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Nuovo paziente
            </Link>
          </CardHeader>
          <CardContent>
            {recentPatients.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun paziente inserito.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentPatients.map((patient) => (
                  <li key={patient.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-foreground">
                      {patient.firstName} {patient.lastName}
                    </span>
                    <StatusBadge
                      label={patient.status === "ACTIVE" ? "Attivo" : "Archiviato"}
                      tone={patient.status === "ACTIVE" ? "success" : "neutral"}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Checklist di avvio</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {ONBOARDING_STEPS.map((step) => (
                <li key={step.label} className="flex items-center gap-2.5 text-sm">
                  {step.done ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <span className={step.done ? "text-foreground" : "text-muted-foreground"}>
                    {step.label}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
