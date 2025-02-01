import { CardSpinner } from '@/components/ui/CardSpinner';
import { AnimatedTitle } from '../components/ui/AnimatedTitle';
import '../index.css';

const movies1 = [
  'src/static/images/godfather.jpg',
  'src/static/images/lotr.jpg',
  'src/static/images/pulpfiction.jpg',
  'src/static/images/spiritedaway.jpg',
];
const movies2 = [
  'src/static/images/fightclub.jpg',
  'src/static/images/paradiso.jpg',
  'src/static/images/samurai.jpg',
  'src/static/images/psycho.jpg',
];

export const HomePage = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16 text-center">
        <AnimatedTitle />
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Create and share ranked lists of anything. From movies to sports
          teams, books to restaurants - rank what matters to you!
        </p>
        <div className="flex justify-center space-x-4 mb-8"></div>
      </div>
    </main>
  );
};
