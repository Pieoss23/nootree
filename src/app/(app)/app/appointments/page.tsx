import Link from "next/link";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared";
import { getActiveTenant } from "@/lib/active-tenant";
import {
  listAppointmentsByTenantInRange,
  getAgendaRange,
  getWeekRange,
  getMonthGridRange,
  parseIsoDateOrToday,
  toIsoDateString,
  addDays,
} from "@/modules/appointments";
import { listPatientsByTenant } from "@/modules/patients";
import { listMembershipsByTenant } from "@/modules/memberships";
import { AgendaList } from "./agenda-list";
import { WeekGrid } from "./week-grid";
import { MonthGrid } from "./month-grid";
import { NewAppointmentButton } from "./new-appointment-button";
import type { PatientOption, StaffOption } from "./appointment-form-dialog";

export const dynamic = "force-dynamic";

const VIEWS = ["agenda", "week", "month"] as const;
type View = (typeof VIEWS)[number];

const VIEW_LABELS: Record<View, string> = { agenda: "Agenda", week: "Settimana", month: "Mese" };

function parseView(value: string | undefined): View {
  return (VIEWS as readonly string[]).includes(value ?? "") ? (value as View) : "agenda";
}

/** Data di navigazione prev/next: il delta dipende dalla vista attiva. */
function shiftDate(date: Date, view: View, direction: 1 | -1): Date {
  if (view === "week") return addDays(date, 7 * direction);
  if (view === "month") return new Date(date.getFullYear(), date.getMonth() + direction, 1);
  return addDays(date, 14 * direction);
}

function viewHref(view: View, date: Date): string {
  return `/app/appointments?view=${view}&date=${toIsoDateString(date)}`;
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const { view: viewParam, date: dateParam } = await searchParams;
  const view = parseView(viewParam);
  const referenceDate = parseIsoDateOrToday(dateParam);

  const tenant = await getActiveTenant();
  if (!tenant) return null;

  const week = getWeekRange(referenceDate);
  const month = getMonthGridRange(referenceDate);
  const range =
    view === "week" ? week : view === "month" ? month : getAgendaRange(referenceDate, 14);

  const [appointments, allPatients, memberships] = await Promise.all([
    listAppointmentsByTenantInRange({
      tenantId: tenant.tenantId,
      from: range.from,
      to: range.to,
    }),
    listPatientsByTenant({ tenantId: tenant.tenantId }),
    listMembershipsByTenant(tenant.tenantId),
  ]);

  const patientOptions: PatientOption[] = allPatients
    .filter((patient) => patient.status === "ACTIVE")
    .map((patient) => ({ id: patient.id, label: `${patient.firstName} ${patient.lastName}` }));
  const staffOptions: StaffOption[] = memberships
    .filter((membership) => membership.status === "ACTIVE")
    .map((membership) => ({
      userId: membership.user.id,
      label: membership.user.name ?? membership.user.email,
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Appuntamenti dei pazienti dello studio."
        actions={
          <NewAppointmentButton
            patients={patientOptions}
            staff={staffOptions}
            defaultDate={referenceDate}
          />
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {VIEWS.map((v) => (
            <Link
              key={v}
              href={viewHref(v, referenceDate)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                v === view
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {VIEW_LABELS[v]}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Link
            href={viewHref(view, shiftDate(referenceDate, view, -1))}
            className="rounded-md border border-border px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ← Precedente
          </Link>
          <Link
            href={viewHref(view, new Date())}
            className="rounded-md border border-border px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Oggi
          </Link>
          <Link
            href={viewHref(view, shiftDate(referenceDate, view, 1))}
            className="rounded-md border border-border px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Successivo →
          </Link>
        </div>
      </div>

      {view === "agenda" ? (
        <AgendaList appointments={appointments} patients={patientOptions} staff={staffOptions} />
      ) : view === "week" ? (
        <WeekGrid
          days={week.days}
          appointments={appointments}
          patients={patientOptions}
          staff={staffOptions}
        />
      ) : (
        <MonthGrid weeks={month.weeks} appointments={appointments} referenceDate={referenceDate} />
      )}
    </div>
  );
}
