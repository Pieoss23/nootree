"use client";

import { useMemo, useState } from "react";
import { Search, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState, StatusBadge } from "@/components/shared";
import type { Patient } from "@/modules/patients";
import { setPatientStatusAction } from "./actions";
import { PatientFormDialog } from "./patient-form-dialog";

type PatientsTableProps = {
  patients: Patient[];
};

function PatientRowActions({ patient }: { patient: Patient }) {
  const [editOpen, setEditOpen] = useState(false);
  const isActive = patient.status === "ACTIVE";

  async function toggleStatus() {
    const formData = new FormData();
    formData.set("patientId", patient.id);
    formData.set("status", isActive ? "ARCHIVED" : "ACTIVE");
    await setPatientStatusAction(formData);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Azioni per ${patient.firstName} ${patient.lastName}`}
            />
          }
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setEditOpen(true)}>Modifica</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleStatus()}>
              {isActive ? "Archivia" : "Riattiva"}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <PatientFormDialog mode="edit" patient={patient} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

export function PatientsTable({ patients }: PatientsTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return patients;
    return patients.filter((patient) =>
      `${patient.firstName} ${patient.lastName} ${patient.email ?? ""}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [patients, query]);

  if (patients.length === 0) {
    return (
      <EmptyState
        title="Nessun paziente"
        description="I pazienti inseriti in questo studio compariranno qui."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cerca per nome o email…"
          className="pl-8"
          aria-label="Cerca pazienti"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Azioni</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-medium text-foreground">
                  {patient.firstName} {patient.lastName}
                </TableCell>
                <TableCell className="text-muted-foreground">{patient.email ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{patient.phone ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge
                    label={patient.status === "ACTIVE" ? "Attivo" : "Archiviato"}
                    tone={patient.status === "ACTIVE" ? "success" : "neutral"}
                  />
                </TableCell>
                <TableCell>
                  <PatientRowActions patient={patient} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Nessun paziente corrisponde alla ricerca.
          </p>
        ) : null}
      </div>
    </div>
  );
}
