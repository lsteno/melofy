'use client';

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Plane } from '@react-three/drei';

const Card = ({ position, rotation, texture }) => {
  return (
    <group position={position} rotation={rotation}>
      <Plane args={[3, 2]}>
        <meshStandardMaterial map={texture} />
      </Plane>
    </group>
  );
};

const RotatingCards = () => {
  const [rotation, setRotation] = useState(0);

  useFrame((state, delta) => {
    setRotation((prev) => prev + delta);
  });

  const images = [
    '../static/images/godfather.jpg',
    '../static/images/lotr.jpg',
    '../static/images/pulpfiction.jpg',
    '../static/images/spiritedaway.jpg',
  ];

  const textures = useLoader(TextureLoader, images);

  const radius = 5;
  const angleStep = (2 * Math.PI) / images.length;

  return (
    <>
      {textures.map((texture, index) => {
        const angle = index * angleStep + rotation;
        const x = radius * Math.sin(angle);
        const z = radius * Math.cos(angle);
        return (
          <Card
            key={index}
            position={[x, 0, z]}
            rotation={[0, angle, 0]}
            texture={texture}
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
