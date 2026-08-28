import * as THREE from 'three';
export class Seesaw {
  constructor(scene, physics, position) {
    const R=physics.RAPIER, size={x:2.4,y:.22,z:6.2};
    this.body=physics.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(position.x,position.y,position.z).setLinearDamping(.8).setAngularDamping(2.2));
    physics.world.createCollider(R.ColliderDesc.cuboid(size.x/2,size.y/2,size.z/2).setDensity(2).setFriction(1.2),this.body);
    const anchor=physics.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(position.x,position.y,position.z));
    // A damped, limited hinge gives weight response without detachment or flips.
    const data=R.JointData.revolute({x:0,y:0,z:0},{x:0,y:0,z:0},{x:1,y:0,z:0});
    this.joint=physics.world.createImpulseJoint(data,anchor,this.body,true); this.joint.setLimits(-.05,.05); this.joint.configureMotorPosition(0,120,16);
    this.mesh=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z),new THREE.MeshStandardMaterial({color:0xd98b4c,roughness:.75})); this.mesh.castShadow=this.mesh.receiveShadow=true; scene.add(this.mesh);
    const supportSize={x:2.2,y:.9,z:5.5}, supportPosition={x:position.x,y:.45,z:position.z};
    const support=new THREE.Mesh(new THREE.BoxGeometry(supportSize.x,supportSize.y,supportSize.z),new THREE.MeshStandardMaterial({color:0x45536c,roughness:.9})); support.position.set(supportPosition.x,supportPosition.y,supportPosition.z); support.castShadow=support.receiveShadow=true; scene.add(support);
    const supportBody=physics.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(supportPosition.x,supportPosition.y,supportPosition.z));
    physics.world.createCollider(R.ColliderDesc.cuboid(supportSize.x/2,supportSize.y/2,supportSize.z/2).setFriction(1.2),supportBody);
    const pivot=new THREE.Mesh(new THREE.CylinderGeometry(.45,.6,2.4,20),new THREE.MeshStandardMaterial({color:0x56667d})); pivot.rotation.z=Math.PI/2; pivot.position.set(position.x,position.y-.45,position.z); scene.add(pivot);
  }
  sync(){const p=this.body.translation(),q=this.body.rotation();this.mesh.position.set(p.x,p.y,p.z);this.mesh.quaternion.set(q.x,q.y,q.z,q.w);}
}
