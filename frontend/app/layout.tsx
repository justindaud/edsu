import "@/app/globals.css"
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EDSU House Art Gallery",
  description: 'Edsu house menggabungkan warisan sejarah dengan ekspresi budaya kontemporer. Terletak di wilayah utara Yogyakarta dalam kompleks Pulang ke Uttara, Sebagai akronim dari "Eat Dat Shit Up", nama ini mewakili eksplorasi seni tanpa batas.',
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}> ) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}