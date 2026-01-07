import { Toaster } from "sonner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        richColors
        position="top-right"
        closeButton
        duration={4000}
        toastOptions={{
          style: { maxWidth: '400px' },
        }}
      />
    </>
  )
}
