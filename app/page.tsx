import Navbar from '@/components/layout/navbar';
import HeroSection from '@/components/heroSection';
import FoodCategorySection from '@/components/foodCategorySection';
import WhyChooseUs from '@/components/whyChooseUsSection';
import AppPromo from '@/components/appPromoSection';
import Stats from '@/components/statsSection';
import BlogSection from '@/components/blogSection';
import NewsletterSection from '@/components/newsLetterSection';
import Footer from '@/components/layout/footer';

const HomePage = () => {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <FoodCategorySection />
      <WhyChooseUs />
      <AppPromo />
      <Stats />
      <BlogSection />
      <NewsletterSection />
      <Footer />
    </div>
  );
};

export default HomePage;