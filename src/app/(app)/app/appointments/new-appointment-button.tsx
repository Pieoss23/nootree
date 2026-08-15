"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AppointmentFormDialog,
  type PatientOption,
  type StaffOption,
} from "./appointment-form-dialog";

type NewAppointmentButtonProps = {
  patients: PatientOption[];
  staff: StaffOption[];
  defaultDate?: Date;
};

export function NewAppointmentButton({ patients, staff, defaultDate }: NewAppointmentButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <AppointmentFormDialog
      mode="create"
      patients={patients}
      staff={staff}
      defaultDate={defaultDate}
      open={open}
      onOpenChange={setOpen}
      trigger={<Button>Nuovo appuntamento</Button>}
    />
  );
}
