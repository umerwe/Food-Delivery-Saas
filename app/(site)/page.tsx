'use client';
import HeroSection from '@/components/heroSection';
import FoodCategorySection from '@/components/foodCategorySection';
import WhyChooseUs from '@/components/whyChooseUsSection';
import AppPromo from '@/components/appPromoSection';
import Stats from '@/components/statsSection';
import BlogSection from '@/components/blogSection';
import NewsletterSection from '@/components/newsLetterSection';
import Footer from '@/components/layout/footer';
import { useAuth } from '@/hooks/useAuth';
import RequiredBranchSelectionModal from '@/components/forms/RequiredBranchSelectionModal';

const HomePage = () => {
  const { user, token } = useAuth();
 
  return (
    <div>
      <HeroSection />
      <section id="categories">
        <FoodCategorySection />
      </section>
      <WhyChooseUs />
      <AppPromo />
      <Stats />
      <BlogSection />
      <NewsletterSection />
      <Footer isHome={true} />
        {user && token && !user?.branchId && (
        <RequiredBranchSelectionModal />
      )}
    </div>
  );
};

export default HomePage;