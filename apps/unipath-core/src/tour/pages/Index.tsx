import Layout from "@/components/layout/Layout";
import SaaSHero from "@/components/home/SaaSHero";
import SaaSFeatures from "@/components/home/SaaSFeatures";
import CompanyShowcase from "@/components/home/CompanyShowcase";
import PricingPlans from "@/components/home/PricingPlans";
import FaqSection from "@/components/home/FaqSection";
import CtaBanner from "@/components/home/CtaBanner";

const Index = () => {
  return (
    <Layout>
      <SaaSHero />
      <SaaSFeatures />
      <CompanyShowcase />
      <PricingPlans />
      <FaqSection />
      <CtaBanner />
    </Layout>
  );
};

export default Index;
