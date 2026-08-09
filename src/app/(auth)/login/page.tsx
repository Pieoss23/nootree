"use client";

import { useActionState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requestMagicLink, type RequestMagicLinkState } from "./actions";

const initialState: RequestMagicLinkState = { status: "idle" };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(requestMagicLink, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accedi</CardTitle>
        <CardDescription>
          Inserisci la tua email per ricevere un link di accesso. Non è richiesta alcuna password.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="nome@studio.it" required />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Invio in corso…" : "Invia link di accesso"}
          </Button>
        </form>

        {state.status === "sent" ? (
          <Alert>
            <AlertTitle>Link richiesto</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        {state.status === "error" ? (
          <Alert variant="destructive">
            <AlertTitle>Non è stato possibile procedere</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
