import { CheckCircle2 } from "lucide-react";
import { PageHeader, StatusBadge, UsageMeter } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getDemoTenant } from "@/lib/demo-tenant";
import { getActiveSubscriptionForTenant } from "@/modules/billing";
import { countActivePatients } from "@/modules/patients";
import { getResourceLimit } from "@/modules/entitlements";
import { PLAN_DEFINITIONS, FEATURE_DEFINITIONS, RESOURCE_KEYS } from "@/config/plans";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const tenant = await getDemoTenant();
  if (!tenant) return null;

  const [subscription, activePatients, patientLimit] = await Promise.all([
    getActiveSubscriptionForTenant(tenant.tenantId),
    countActivePatients(tenant.tenantId),
    getResourceLimit(tenant.tenantId, RESOURCE_KEYS.ACTIVE_PATIENTS),
  ]);

  const planDefinition = subscription
    ? Object.values(PLAN_DEFINITIONS).find((plan) => plan.key === subscription.plan.key)
    : null;

  return (
    <div className="space-y-8">
      <PageHeader title="Abbonamento" description="Piano attivo e funzionalità incluse." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Piano attuale</CardTitle>
            {subscription ? (
              <StatusBadge
                label={subscription.status === "ACTIVE" ? "Attivo" : subscription.status}
                tone={subscription.status === "ACTIVE" ? "success" : "warning"}
              />
            ) : null}
          </CardHeader>
          <CardContent className="space-y-6">
            {subscription ? (
              <>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{subscription.plan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Rinnovo il{" "}
                    {subscription.currentPeriodEnd.toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {subscription.cancelAtPeriodEnd ? " (cancellazione programmata)" : ""}
                  </p>
                </div>

                <UsageMeter label="Pazienti attivi" current={activePatients} limit={patientLimit} />

                {planDefinition ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Funzionalità incluse</p>
                    <ul className="space-y-1.5">
                      {planDefinition.features.map((featureKey) => (
                        <li key={featureKey} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />
                          <span className="text-foreground">
                            {FEATURE_DEFINITIONS[featureKey].name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun abbonamento demo trovato.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestione fatturazione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Il Customer Portal di Stripe permetterà di aggiornare il metodo di pagamento e
              scaricare le fatture.
            </p>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button disabled className="w-full">
                    Apri Customer Portal
                  </Button>
                }
              />
              <TooltipContent>Non ancora disponibile in questa milestone.</TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
