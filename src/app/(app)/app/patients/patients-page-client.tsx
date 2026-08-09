"use client";

import { useState } from "react";
import { PageHeader, UsageMeter } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { Patient } from "@/modules/patients";
import { PatientFormDialog } from "./patient-form-dialog";
import { PatientsTable } from "./patients-table";

type PatientsPageClientProps = {
  patients: Patient[];
  activePatients: number;
  patientLimit: number | null;
};

export function PatientsPageClient({
  patients,
  activePatients,
  patientLimit,
}: PatientsPageClientProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pazienti"
        description="Anagrafica pazienti dello studio."
        actions={
          <PatientFormDialog
            mode="create"
            open={createOpen}
            onOpenChange={setCreateOpen}
            trigger={<Button>Nuovo paziente</Button>}
          />
        }
      />

      <div className="max-w-xs">
        <UsageMeter label="Pazienti attivi" current={activePatients} limit={patientLimit} />
      </div>

      <PatientsTable patients={patients} />
    </div>
  );
}
