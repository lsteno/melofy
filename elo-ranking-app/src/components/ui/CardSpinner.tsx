import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CardProps {
  position: [number, number, number];
  rotation: [number, number, number];
  imageUrl: string;
}

const Card: React.FC<CardProps> = ({ position, rotation, imageUrl }) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (loadedTexture) => {
        setTexture(loadedTexture);
        setIsLoading(false);
      },
      undefined,
      (error) => {
        console.error('Error loading texture:', error);
        setIsLoading(false);
      }
    );
  }, [imageUrl]);

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[2, 3, 0.1]} />
        <meshStandardMaterial
          color={isLoading ? '#ffffff' : '#ffffff'}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>
      {texture && (
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[1.8, 2.8]} />
          <meshBasicMaterial map={texture} />
        </mesh>
      )}
    </group>
  );
};

const RotatingCards: React.FC<{ velocity: number }> = ({ velocity }) => {
  const [rotation, setRotation] = useState<number>(0);
  const images = [
    'src/static/images/godfather.jpg',
    'src/static/images/lotr.jpg',
    'src/static/images/pulpfiction.jpg',
    'src/static/images/spiritedaway.jpg',
  ];

  const radius = 3;
  const angleStep = (2 * Math.PI) / images.length;

  useFrame(() => {
    setRotation((prev) => prev + velocity);
  });

  return (
    <>
      {images.map((imageUrl, index) => {
        const angle = index * angleStep + rotation;
        const y = radius * Math.sin(angle);
        const z = radius * Math.cos(angle);
        const cardRotation: [number, number, number] = [-angle, 0, 0];

        return (
          <Card
            key={index}
            position={[0, y, z]}
            rotation={cardRotation}
            imageUrl={imageUrl}
          />
        );
      })}
    </>
  );
};

export const CardSpinner: React.FC = () => {
  const [velocity, setVelocity] = useState<number>(0);
  const isDragging = useRef(false);
  const startMouseX = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startMouseX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      const delta = e.clientX - startMouseX.current;
      setVelocity(delta * 0.009);
      startMouseX.current = e.clientX;
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isDragging.current) {
      const friction = 0.1; // Adjust this for slower/faster deceleration
      interval = setInterval(() => {
        setVelocity((v) => {
          const newVelocity = v * friction;
          if (Math.abs(newVelocity) < 0.1) {
            clearInterval(interval);
            return 0;
          }
          return newVelocity;
        });
      }, 16); // 60 FPS
    }
    return () => clearInterval(interval);
  }, [velocity]);

  return (
    <div
      style={{ width: '100%', height: '100vh' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => (isDragging.current = false)}
    >
      <Canvas
        camera={{
          position: [0, 0, 8],
          fov: 75,
        }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <RotatingCards velocity={velocity} />
      </Canvas>
    </div>
  );
};
