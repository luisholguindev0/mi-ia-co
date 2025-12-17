import dynamic from "next/dynamic";
import { Hero } from "@/components/sections/hero";
import { Preloader } from "@/components/layout/preloader";

// Lazy load below-the-fold components
const TrustSignals = dynamic(() => import("@/components/sections/trust-signals").then((mod) => mod.TrustSignals));
const Services = dynamic(() => import("@/components/sections/services").then((mod) => mod.Services));
const Process = dynamic(() => import("@/components/sections/process").then((mod) => mod.Process));
const Projects = dynamic(() => import("@/components/sections/projects").then((mod) => mod.Projects));
const FAQ = dynamic(() => import("@/components/sections/faq").then((mod) => mod.FAQ));
const Footer = dynamic(() => import("@/components/sections/footer").then((mod) => mod.Footer));
const BentoGrid = dynamic(() => import("@/components/sections/bento-grid").then((mod) => mod.BentoGrid));
const GrowthCatalyst = dynamic(() => import("@/components/sections/growth-catalyst").then((mod) => mod.GrowthCatalyst));
const GlobalReach = dynamic(() => import("@/components/sections/global-reach").then((mod) => mod.GlobalReach));
const Insights = dynamic(() => import("@/components/sections/insights").then((mod) => mod.Insights));
const RoiCalculator = dynamic(() => import("@/components/sections/roi-calculator").then((mod) => mod.RoiCalculator));
const AuditTerminal = dynamic(() => import("@/components/sections/audit-terminal").then((mod) => mod.AuditTerminal));
const ClientPortalDemo = dynamic(() => import("@/components/sections/client-portal-demo").then((mod) => mod.ClientPortalDemo));

export default function Home() {
    return (
        <main className="relative w-full min-h-screen bg-black overflow-x-hidden">
            <Preloader />

            <Hero />

            <TrustSignals />

            <AuditTerminal />

            <Services />

            <GrowthCatalyst />

            <BentoGrid />

            <ClientPortalDemo />

            <div id="process">
                <Process />
            </div>

            <div id="projects">
                <Projects />
            </div>

            <RoiCalculator />

            <GlobalReach />

            <Insights />

            <div id="faq">
                <FAQ />
            </div>

            <Footer />
        </main>
    );
}
