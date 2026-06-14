import React from 'react'
import{ Canvas} from "@react-three/fiber";
import { OrbitControls } from '@react-three/drei';
import {useMediaQuery} from "react-responsive";
import { Room } from '../../sections/Room.jsx'
import Herolights from "./Herolights.jsx";
import Particles  from "./particles.jsx";


const HeroExperience = () => {
    const isTablet=useMediaQuery({query:'(min-width: 1024px)'});
    const isMobile=useMediaQuery({query:'(min-width: 768px)'});
    return (
      <Canvas camera={{ position: [2, 1.5, 10], fov: 40 }}>


          <OrbitControls
          enablePan={false}
          enableZoom={!isTablet}
          maxDistance={27}
          minDistance={5}
          minPolarAngle={Math.PI/5}
          maxPolarAngle={Math.PI/2}
          />

          <Herolights/>
          <Particles count={70}/>
<group
  scale={isMobile ? 0.9 : 1.3}
  position={[0, -1.5, 0]}
  rotation={[0, -Math.PI / 6, 0]}
>

    <Room />
</group>

      </Canvas>
    )
}
export default HeroExperience
