"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, StatusBadge } from "@/components/shared";
import type { Patient } from "./types";

type PatientsTableProps = {
  patients: Patient[];
};

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
