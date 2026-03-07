import { SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Hero from "../components/sections/Hero";
import Footer from "../components/layout/Footer";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/app/studio");

  return (
    <>
      <SignedOut>
        <Hero />
      </SignedOut>
      <Footer />
    </>
  );
}
