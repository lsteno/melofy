import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Define our component props interfaces
interface CardSpinnerProps {
  imageUrls: string[];
}

interface CardProps {
  position: [number, number, number];
  rotation: [number, number, number];
  imageUrl: string;
  angle: number;
  velocity: number; // Add velocity prop to control curvature
}

const Card: React.FC<CardProps> = ({
  position,
  rotation,
  imageUrl,
  angle,
  velocity,
}) => {
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

  // Calculate curvature factor with a minimum of 0.5 (50%)
  // Scale the remaining 50% based on velocity
  const minCurvature = 1;
  const dynamicCurvature =
    Math.min(Math.abs(velocity) * 2, 1) * (1 - minCurvature);
  const curvatureFactor = minCurvature + dynamicCurvature;

  const segments = 32;
  const radius = 3;
  const cardWidth = 1.5;
  const cardHeight = 2;
  // Scale arc length by curvature factor
  const arcLength = (cardHeight / radius) * curvatureFactor;

  // Generate vertices for dynamically curved surface
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    for (let j = 0; j <= segments; j++) {
      const u = i / segments;
      const v = j / segments;
      const theta = arcLength * (v - 0.5);

      // Interpolate between flat and curved positions, maintaining minimum curvature
      const x = cardWidth * (u - 0.5);
      const flatY = cardHeight * (v - 0.5);
      const curvedY = radius * Math.sin(theta);
      const y = flatY * (1 - curvatureFactor) + curvedY * curvatureFactor;

      const flatZ = 0;
      const curvedZ = -radius * (1 - Math.cos(theta));
      const z = flatZ * (1 - curvatureFactor) + curvedZ * curvatureFactor;

      vertices.push(x, y, z);
      uvs.push(u, v);

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
  imageUrls: string[];
  velocity: number;
  isDragging: boolean;
  onSnapComplete: () => void;
}> = ({ imageUrls, velocity, isDragging, onSnapComplete }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [rotation, setRotation] = useState(0);
  const lastRotation = useRef(rotation);

  const radius = 3;
  const angleStep = (2 * Math.PI) / imageUrls.length;

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
      {imageUrls.map((imageUrl, index) => {
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
            velocity={velocity} // Pass velocity to control card curvature
          />
        );
      })}
    </group>
  );
};

export const CardSpinner: React.FC<CardSpinnerProps> = ({ imageUrls }) => {
  const [velocity, setVelocity] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const lastUpdateTime = useRef(Date.now());
  const velocityRef = useRef(0);
  const frameRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    lastPos.current = { x: e.clientX, y: e.clientY };
    lastUpdateTime.current = Date.now();
    cancelAnimationFrame(frameRef.current);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastUpdateTime.current;

      if (deltaTime > 16) {
        const deltaY = lastPos.current.y - e.clientY;
        velocityRef.current = (deltaY * 0.003) / (deltaTime / 16);
        setVelocity(velocityRef.current);

        lastPos.current = { x: e.clientX, y: e.clientY };
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
        <RotatingCards
          imageUrls={imageUrls}
          velocity={velocity}
          isDragging={isDragging.current}
          onSnapComplete={() => setIsSnapping(false)}
        />
      </Canvas>
    </div>
  );
};

export default CardSpinner;
