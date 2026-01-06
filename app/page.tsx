import Navbar from '@/components/layout/navbar';
import HeroSection from '@/components/heroSection';
import FoodCategorySection from '@/components/foodCategorySection';

const HomePage = () => {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <FoodCategorySection />
    </div>
  );
};

export default HomePage;