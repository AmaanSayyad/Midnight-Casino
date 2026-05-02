import localFont from "next/font/local";
import "@/styles/globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar.js";
import Footer from "@/components/Footer";
import GlobalWalletManager from "@/components/GlobalWalletManager";
import NetworkSwitcher from "@/components/NetworkSwitcher";


const outfit = localFont({
  src: "../../public/Outfit/Outfit-VariableFont_wght.ttf",
  variable: "--font-outfit",
  display: "swap",
});

export const metadata = {
  title: "Midnight Casino",
  description: "Midnight Casino",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Midnight%20Logo%20Pack/02_Symbol/Midnight-RGB_Symbol-White.svg" />
      </head>
      <body 
        className={`${outfit.variable} font-sans overflow-x-hidden w-full`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <GlobalWalletManager />
          <NetworkSwitcher />
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
