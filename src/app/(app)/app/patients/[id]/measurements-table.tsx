import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { calculateBmi, type PatientMeasurement } from "@/modules/patients";
import { deleteMeasurementAction } from "./actions";

function formatNumber(value: number | null, unit: string): string {
  return value === null ? "—" : `${value}${unit}`;
}

export function MeasurementsTable({
  patientId,
  measurements,
}: {
  patientId: string;
  measurements: PatientMeasurement[];
}) {
  if (measurements.length === 0) {
    return (
      <EmptyState
        title="Nessuna misurazione"
        description="Le pesate registrate per questo paziente compariranno qui."
      />
    );
  }

  const firstId = measurements[0].id;
  const lastId = measurements[measurements.length - 1].id;

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Peso</TableHead>
            <TableHead>Altezza</TableHead>
            <TableHead>BMI</TableHead>
            <TableHead>Massa grassa</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="w-10">
              <span className="sr-only">Azioni</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...measurements].reverse().map((measurement) => {
            const bmi = calculateBmi(measurement.weightKg, measurement.heightCm);
            const isFirst = measurement.id === firstId;
            const isLast = measurement.id === lastId;
            return (
              <TableRow key={measurement.id}>
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {new Date(measurement.measuredAt).toLocaleDateString("it-IT")}
                    {isFirst && isLast ? null : isFirst ? (
                      <StatusBadge label="Prima pesata" tone="neutral" />
                    ) : isLast ? (
                      <StatusBadge label="Ultima pesata" tone="success" />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{formatNumber(measurement.weightKg, " kg")}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatNumber(measurement.heightCm, " cm")}
                </TableCell>
                <TableCell className="text-muted-foreground">{bmi ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatNumber(measurement.bodyFatPercent, "%")}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {measurement.notes ?? "—"}
                </TableCell>
                <TableCell>
                  <form action={deleteMeasurementAction}>
                    <input type="hidden" name="patientId" value={patientId} />
                    <input type="hidden" name="measurementId" value={measurement.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Elimina misurazione"
                    >
                      ×
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
