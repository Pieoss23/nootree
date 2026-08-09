"use client";

import { useState, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MeasurementFormDialog } from "./measurement-form-dialog";

export function MeasurementsSection({
  patientId,
  children,
}: {
  patientId: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Misurazioni</CardTitle>
          <CardDescription>Storico peso, altezza e dati BIA.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          Aggiungi misurazione
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <MeasurementFormDialog patientId={patientId} open={open} onOpenChange={setOpen} />
    </Card>
  );
}
