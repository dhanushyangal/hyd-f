import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 sm:py-12 pt-24 sm:pt-28">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "bg-white border border-gray-200 shadow-2xl w-full",
              headerTitle: "text-black text-xl sm:text-2xl",
              headerSubtitle: "text-gray-600 text-sm sm:text-base",
              socialButtonsBlockButton: "bg-white border-gray-300 text-black hover:bg-gray-50 text-sm sm:text-base",
              socialButtonsBlockButtonText: "text-black",
              dividerLine: "bg-gray-300",
              dividerText: "text-gray-600 text-xs sm:text-sm",
              formFieldLabel: "text-black text-sm sm:text-base",
              formFieldInput: "bg-white border-gray-300 text-black placeholder:text-gray-400 text-sm sm:text-base",
              formButtonPrimary: "bg-black text-white hover:bg-gray-900 text-sm sm:text-base",
              footerActionLink: "text-black hover:text-gray-700 text-sm sm:text-base",
              identityPreviewText: "text-black text-sm sm:text-base",
              identityPreviewEditButton: "text-black text-sm sm:text-base",
              footer: "hidden",
              footerPages: "hidden",
              formFooter: "hidden",
            },
          }}
        />
      </div>
    </div>
  );
}

