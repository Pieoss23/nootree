"use server";

import { authIdentityService } from "@/modules/identity";

export async function signOutAction() {
  await authIdentityService.signOut();
}
