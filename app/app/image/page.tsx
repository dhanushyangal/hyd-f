import { redirect } from "next/navigation";

export default function ImagePage() {
  redirect("/app/assets?tab=images");
}
