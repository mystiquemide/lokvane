import "./globals.css";
export const metadata = { title: "Lokvane", description: "Fix what Etsy auto-translation gets wrong, market by market." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
