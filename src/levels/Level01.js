import * as THREE from 'three';
import { ShallowBasin } from '../objects/ShallowBasin.js';
import { Checkpoint } from '../objects/Checkpoint.js'; import { FinishZone } from '../objects/FinishZone.js'; import { Seesaw } from '../objects/Seesaw.js'; import { TransformPad } from '../objects/TransformPad.js';
import { WindZone } from '../objects/WindZone.js';
export class Level01 {
  constructor(scene, physics) { this.scene=scene; this.physics=physics; this.platforms=[]; this.build(); }
  box(pos,size,color=0x62748e,rotX=0) { const R=this.physics.RAPIER; const mesh=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z),new THREE.MeshStandardMaterial({color,roughness:.82})); mesh.position.set(pos.x,pos.y,pos.z); mesh.rotation.x=rotX; mesh.castShadow=mesh.receiveShadow=true; this.scene.add(mesh); const q=mesh.quaternion; const body=this.physics.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(pos.x,pos.y,pos.z).setRotation({x:q.x,y:q.y,z:q.z,w:q.w})); this.physics.world.createCollider(R.ColliderDesc.cuboid(size.x/2,size.y/2,size.z/2).setFriction(1.3),body); this.platforms.push(mesh); }
  build() {
    this.box({x:0,y:0,z:7},{x:8,y:1,z:7},0x60758e);
    this.spawnBasin = new ShallowBasin(this.scene,this.physics,{x:0,y:.54,z:8},{radius:1.4,innerRadius:.72,depth:.08,segments:12,color:0x6f849c});
    this.transformPads = [new TransformPad(this.scene,this.physics,{x:-2.5,y:.56,z:5.8},'wood'),new TransformPad(this.scene,this.physics,{x:-2.5,y:.56,z:8.8},'stone'),new TransformPad(this.scene,this.physics,{x:2.5,y:.56,z:8.8},'paper')];
    // Meet the spawn platform flush: a partial bridge left ball-sized slots
    // on either side of its entrance.
    this.box({x:11,y:0,z:7},{x:14,y:1,z:7},0x5b7891);
    this.box({x:11,y:1,z:3.65},{x:14,y:1,z:.3},0x87a8b6);
    this.box({x:11,y:1,z:10.35},{x:14,y:1,z:.3},0x87a8b6);
    this.box({x:18.15,y:1,z:7},{x:.3,y:1,z:7},0x87a8b6);
    this.windZone = new WindZone(this.scene);
    this.box({x:0,y:0,z:0},{x:4.5,y:.8,z:8});
    this.box({x:0,y:.7,z:-7},{x:4.5,y:.7,z:8},0x71829a,.14); this.box({x:0,y:1.28,z:-13},{x:3.2,y:.55,z:5});
    this.box({x:0,y:1.28,z:-19},{x:1.75,y:.45,z:7},0x8899aa); this.box({x:0,y:1.28,z:-24},{x:4.5,y:.55,z:3.5});
    this.checkpoint=new Checkpoint(this.scene,this.physics,{x:0,y:1.595,z:-24});
    this.seesaw=new Seesaw(this.scene,this.physics,{x:0,y:1.52,z:-28.875});
    this.box({x:0,y:1.28,z:-34},{x:4.5,y:.55,z:4}); this.box({x:0,y:1.28,z:-39},{x:8,y:.7,z:7},0x5f7893);
    this.finish=new FinishZone(this.scene,this.physics,{x:0,y:1.665,z:-39});
  }
}
