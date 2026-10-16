import type { Metadata } from "next";
import { AccountView } from "@/components/store/account-view";

export const metadata: Metadata = { title: "Mi cuenta | IV Bags" };

export default function AccountPage() {
  return <AccountView />;
}
