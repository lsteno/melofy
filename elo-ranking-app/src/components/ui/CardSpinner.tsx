'use client';

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

const Card = ({ position, rotation, text }) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[2, 3, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <Text
        position={[0, 0, 0.06]}
        fontSize={0.2}
        color="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
};

const RotatingCards = () => {
  const [rotation, setRotation] = useState(0);

  useFrame((state, delta) => {
    setRotation((prev) => prev + delta);
  });

  const cards = [
    'Create Lists',
    'Rank Items',
    'Share Results',
    'Discover Trends',
  ];

  const radius = 5;
  const angleStep = (2 * Math.PI) / cards.length;

  return (
    <>
      {cards.map((text, index) => {
        const angle = index * angleStep + rotation;
        const y = radius * Math.sin(angle);
        const z = radius * Math.cos(angle);
        return (
          <Card
            key={index}
            position={[0, y, z]}
            rotation={[angle, 0, 0]}
            text={text}
          />
        );
      })}
    </>
  );
};

export const CardSpinner = () => (
  <Canvas camera={{ position: [0, 0, 10] }}>
    <ambientLight intensity={0.5} />
    <pointLight position={[10, 10, 10]} />
    <RotatingCards />
  </Canvas>
);
