import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';
import { Experience } from '../components/property/Experience';
import { Overlay } from '../components/property/Overlay';
import { useTheme } from '../components/context';

function App() {
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="absolute z-50 inset-0 bg-white dark:bg-secondary-950">
      {loading ? (
        <div className="absolute z-50 inset-0 w-full h-full flex justify-center items-center text-primary-700 text-xl md:text-3xl text-center font-bold ">
          Please wait...
        </div>
      ) : null}
      <Leva hidden />
      <Overlay />
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 30 }}>
        <color attach="background" args={[theme === 'light' ? '#232323' : '#0b1120']} />
        <Experience />
      </Canvas>
    </div>
  );
}

export default App;
