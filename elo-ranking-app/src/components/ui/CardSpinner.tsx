import { useState, useEffect } from 'react';
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
      {/* Card base */}
      <mesh>
        <boxGeometry args={[2, 3, 0.1]} />
        <meshStandardMaterial
          color={isLoading ? '#cccccc' : '#ffffff'}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>

      {/* Card front with image */}
      {texture && (
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[1.8, 2.8]} />
          <meshBasicMaterial map={texture} />
        </mesh>
      )}
    </group>
  );
};

const RotatingCards: React.FC = () => {
  const [rotation, setRotation] = useState<number>(0);

  useFrame((state) => {
    // Control the rotation speed
    setRotation(state.clock.getElapsedTime() * 0.5);
  });

  const images = [
    'src/static/images/godfather.jpg',
    'src/static/images/lotr.jpg',
    'src/static/images/pulpfiction.jpg',
    'src/static/images/spiritedaway.jpg',
  ];

  // Radius of our cylinder
  const radius = 5;
  const angleStep = (2 * Math.PI) / images.length;

  return (
    <>
      {images.map((imageUrl, index) => {
        // Calculate the current angle for this card
        const angle = index * angleStep + rotation;

        // Calculate position on the cylinder surface
        // As the cylinder rolls forward (towards -z):
        // - y position follows a circle in the y-z plane
        // - z position follows the same circle
        const y = radius * Math.sin(angle);
        const z = radius * Math.cos(angle);

        // The key to the rolling cylinder effect:
        // - We rotate around the X axis only
        // - The rotation angle matches the position angle
        // This makes each card maintain its orientation relative to the cylinder surface
        const cardRotation: [number, number, number] = [
          -angle, // Rotate around X axis to match cylinder rotation
          0, // No rotation around Y axis
          0, // No rotation around Z axis
        ];

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
  return (
    <div style={{ width: '100%', height: '100vh', background: '#111827' }}>
      <Canvas
        camera={{
          position: [0, 0, 8], // Position camera to the side to see the rolling motion
          fov: 75,
        }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <RotatingCards />
      </Canvas>
    </div>
  );
};
