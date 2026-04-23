import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Featured from "@/components/Featured";
import Promo from "@/components/Promo";
import Pricing from "@/components/Pricing";
import Signup from "@/components/Signup";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Featured />
      <Promo />
      <Pricing />
      <Signup />
      <Footer />
    </main>
  );
};

export default Index;