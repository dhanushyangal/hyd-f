"use client";

import { UserButton } from "@clerk/nextjs";
import { HelpCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { useSupport } from "@/context/SupportContext";

type UserButtonWithHelpProps = {
  afterSignOutUrl?: string;
  appearance?: ComponentProps<typeof UserButton>["appearance"];
};

/** Clerk profile menu with a Help action that opens support/feedback. */
export function UserButtonWithHelp({
  afterSignOutUrl = "/",
  appearance,
}: UserButtonWithHelpProps) {
  const { openSupport } = useSupport();

  return (
    <UserButton afterSignOutUrl={afterSignOutUrl} appearance={appearance}>
      <UserButton.MenuItems>
        <UserButton.Action
          label="Help"
          labelIcon={<HelpCircle className="h-4 w-4" strokeWidth={2} />}
          onClick={() => openSupport("issue")}
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}
