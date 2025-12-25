import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white border border-gray-200 shadow-2xl",
            headerTitle: "text-black",
            headerSubtitle: "text-gray-600",
            socialButtonsBlockButton: "bg-white border-gray-300 text-black hover:bg-gray-50",
            socialButtonsBlockButtonText: "text-black",
            dividerLine: "bg-gray-300",
            dividerText: "text-gray-600",
            formFieldLabel: "text-black",
            formFieldInput: "bg-white border-gray-300 text-black placeholder:text-gray-400",
            formButtonPrimary: "bg-black text-white hover:bg-gray-900",
            footerActionLink: "text-black hover:text-gray-700",
            identityPreviewText: "text-black",
            identityPreviewEditButton: "text-black",
            footer: "hidden",
            footerPages: "hidden",
            formFooter: "hidden",
          },
        }}
      />
    </div>
  );
}

