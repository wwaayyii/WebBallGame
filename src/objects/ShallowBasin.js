import * as THREE from 'three';
export class ShallowBasin {
  constructor(scene,physics,position,{radius=1.5,innerRadius=.7,depth=.11,segments=12,color=0x60758e,emissive=0,emissiveIntensity=0}={}){
    this.position={...position};this.radius=radius;this.innerRadius=innerRadius;this.depth=depth;const R=physics.RAPIER;
    const material=new THREE.MeshStandardMaterial({color,emissive,emissiveIntensity,roughness:.82});
    const center=new THREE.Mesh(new THREE.CylinderGeometry(innerRadius,innerRadius,.08,segments),material);center.position.set(position.x,position.y-.04,position.z);center.receiveShadow=true;scene.add(center);
    let body=physics.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(center.position.x,center.position.y,center.position.z));physics.world.createCollider(R.ColliderDesc.cylinder(.04,innerRadius).setFriction(1.3),body);
    const radial=radius-innerRadius+.08,mid=innerRadius+(radius-innerRadius)/2,width=2*Math.PI*mid/segments*1.08,slope=Math.atan2(depth,radius-innerRadius);
    for(let i=0;i<segments;i++){const angle=i*Math.PI*2/segments,mesh=new THREE.Mesh(new THREE.BoxGeometry(width,.08,radial),material);mesh.position.set(position.x+Math.sin(angle)*mid,position.y+depth/2-.04,position.z+Math.cos(angle)*mid);const yaw=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle),tilt=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-slope);mesh.quaternion.multiplyQuaternions(yaw,tilt);mesh.receiveShadow=true;scene.add(mesh);const p=mesh.position,q=mesh.quaternion;body=physics.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(p.x,p.y,p.z).setRotation(q));physics.world.createCollider(R.ColliderDesc.cuboid(width/2,.04,radial/2).setFriction(1.3),body);}
    this.slopeDegrees=THREE.MathUtils.radToDeg(slope);
  }
}
