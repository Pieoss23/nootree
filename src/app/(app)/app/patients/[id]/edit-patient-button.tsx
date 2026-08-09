"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Patient } from "@/modules/patients";
import { PatientFormDialog } from "../patient-form-dialog";

export function EditPatientButton({ patient }: { patient: Patient }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Modifica dati
      </Button>
      <PatientFormDialog mode="edit" patient={patient} open={open} onOpenChange={setOpen} />
    </>
  );
}
