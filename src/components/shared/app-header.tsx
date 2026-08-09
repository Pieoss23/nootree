"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NavLinks } from "./nav-links";
import { NAV_ITEMS } from "./nav-items";
import { UserMenu } from "./user-menu";

type AppHeaderProps = {
  userName: string;
  userEmail: string;
};

export function AppHeader({ userName, userEmail }: AppHeaderProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const currentItem =
    [...NAV_ITEMS].reverse().find((item) => pathname.startsWith(item.href)) ?? NAV_ITEMS[0];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Apri navigazione"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="size-4" aria-hidden />
          </Button>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>nootree</SheetTitle>
            </SheetHeader>
            <div className="px-3">
              <NavLinks onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{currentItem.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <UserMenu name={userName} email={userEmail} />
    </header>
  );
}
