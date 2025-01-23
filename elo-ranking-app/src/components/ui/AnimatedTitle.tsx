import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import '../../index.css';

const CYCLE_TERMS = ['books', 'movies', 'songs', 'places'];

export const AnimatedTitle = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-cycle effect
  useEffect(() => {
    let intervalId;
    if (isAutoPlaying) {
      intervalId = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % CYCLE_TERMS.length);
      }, 2000); // Change every 2 seconds
    }

    return () => clearInterval(intervalId);
  }, [isAutoPlaying]);

  // Manual selection handler
  const handleTermClick = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setIsDropdownOpen(false);
  };

  // Text animation variants (bottom to top)
  const textVariants = {
    hidden: {
      y: 50,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 10,
      },
    },
    exit: {
      y: -50,
      opacity: 0,
    },
  };

  return (
    <div className="relative inline-flex items-center">
      <h1 className="text-4xl font-bold text-rblack mr-2">1V1 for</h1>

      {/* Animated Cycling Term with Dropdown */}
      <div className="relative inline-block">
        <div
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center cursor-pointer hover:bg-gray-100 px-2 py-1 rounded-md"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={currentIndex}
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-4xl font-bold text-sgreen"
            >
              {CYCLE_TERMS[currentIndex]}
            </motion.span>
            <ChevronDown className="ml-2 text-gray-500" size={24} />
          </AnimatePresence>
        </div>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 mt-2 w-full bg-white shadow-lg rounded-md border"
          >
            {CYCLE_TERMS.map((term, index) => (
              <div
                key={term}
                onClick={() => handleTermClick(index)}
                className={`
                  px-4 py-2 cursor-pointer hover:bg-gray-100
                  ${currentIndex === index ? 'bg-blue-50 text-blue-600' : 'text-gray-800'}
                `}
              >
                {term}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AnimatedTitle;
