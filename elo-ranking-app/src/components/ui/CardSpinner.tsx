import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CardProps {
  position: [number, number, number];
  rotation: [number, number, number];
  imageUrl: string;
  angle: number;
}

const Card: React.FC<CardProps> = ({ position, rotation, imageUrl, angle }) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const meshRef = useRef<THREE.Mesh>(null);

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

  if (!texture || isLoading) return null;

  // Create a curved geometry for the card
  const segments = 32; // Controls the smoothness of the curve
  const radius = 3; // Match the rotation radius
  const cardWidth = 1.5;
  const cardHeight = 2;
  // Adjust arc length for vertical curvature
  const arcLength = cardHeight / radius;

  // Generate vertices for curved surface
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    for (let j = 0; j <= segments; j++) {
      // Calculate position on curved surface
      const u = i / segments;
      const v = j / segments;
      // Adjust curve calculation for vertical bending
      const theta = arcLength * (v - 0.5);

      // Swap x and y coordinates to curve vertically instead of horizontally
      const x = cardWidth * (u - 0.5);
      const y = radius * Math.sin(theta);
      const z = -radius * (1 - Math.cos(theta));

      vertices.push(x, y, z);
      // Keep UVs mapped normally for correct texture display
      uvs.push(u, v);

      // Generate triangle indices
      if (i < segments && j < segments) {
        const current = i * (segments + 1) + j;
        const next = current + (segments + 1);

        indices.push(current, next, current + 1);
        indices.push(current + 1, next, next + 1);
      }
    }
  }

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const RotatingCards: React.FC<{
  velocity: number;
  isDragging: boolean;
  onSnapComplete: () => void;
}> = ({ velocity, isDragging, onSnapComplete }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [rotation, setRotation] = useState(0);
  const lastRotation = useRef(rotation);

  const images = [
    'src/static/images/godfather.jpg',
    'src/static/images/lotr.jpg',
    'src/static/images/pulpfiction.jpg',
    'src/static/images/spiritedaway.jpg',
  ];

  const radius = 3;
  const angleStep = (2 * Math.PI) / images.length;

  useFrame(() => {
    if (!isDragging && Math.abs(velocity) < 0.001) {
      const currentAngle = rotation % (2 * Math.PI);
      const targetAngle = Math.round(currentAngle / angleStep) * angleStep;
      const diff = targetAngle - currentAngle;

      if (Math.abs(diff) > 0.01) {
        const newRotation = rotation + diff * 0.1;
        setRotation(newRotation);
        lastRotation.current = newRotation;
      } else {
        onSnapComplete();
      }
    } else {
      const newRotation = lastRotation.current + velocity;
      setRotation(newRotation);
      lastRotation.current = newRotation;
    }
  });

  return (
    <group ref={groupRef}>
      {images.map((imageUrl, index) => {
        const angle = index * angleStep + rotation;
        const y = radius * Math.sin(angle);
        const z = radius * Math.cos(angle);
        const cardRotation: [number, number, number] = [-angle, 0, 0];

        return (
          <Card
            key={imageUrl}
            position={[0, y, z]}
            rotation={cardRotation}
            imageUrl={imageUrl}
            angle={angle}
          />
        );
      })}
    </group>
  );
};

export const CardSpinner: React.FC = () => {
  const [velocity, setVelocity] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);
  const isDragging = useRef(false);
  const startMouseX = useRef(0);
  const lastMouseX = useRef(0);
  const lastUpdateTime = useRef(Date.now());
  const velocityRef = useRef(0);
  const frameRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startMouseX.current = e.clientX;
    lastMouseX.current = e.clientX;
    lastUpdateTime.current = Date.now();
    cancelAnimationFrame(frameRef.current);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastUpdateTime.current;

      // Only update velocity if enough time has passed
      if (deltaTime > 16) {
        // Approximately 60fps
        const delta = e.clientX - lastMouseX.current;
        // Calculate velocity based on time difference for more consistent motion
        velocityRef.current = (delta * 0.03) / (deltaTime / 16);
        setVelocity(velocityRef.current);
        lastMouseX.current = e.clientX;
        lastUpdateTime.current = currentTime;
      }
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    applyFriction();
  };

  const applyFriction = () => {
    const friction = 0.99;
    const minVelocity = 0.01;

    const animate = () => {
      if (!isDragging.current && Math.abs(velocityRef.current) > minVelocity) {
        velocityRef.current *= friction;
        setVelocity(velocityRef.current);
        frameRef.current = requestAnimationFrame(animate);
      } else if (!isDragging.current) {
        velocityRef.current = 0;
        setVelocity(0);
        setIsSnapping(true);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="w-full h-screen cursor-grab active:cursor-grabbing"
    >
      <Canvas camera={{ position: [0, 0, 6], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <RotatingCards
          velocity={velocity}
          isDragging={isDragging.current}
          onSnapComplete={() => setIsSnapping(false)}
        />
      </Canvas>
    </div>
  );
};

export default CardSpinner;
