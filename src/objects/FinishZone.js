import * as THREE from 'three';
import { ShallowBasin } from './ShallowBasin.js';
export class FinishZone {
  constructor(scene,physics,position){this.position=position;this.triggerRadius=.78;const mat=new THREE.MeshStandardMaterial({color:0xffd35a,emissive:0x8f5a00,emissiveIntensity:1.4});this.basin=new ShallowBasin(scene,physics,position,{radius:1.55,innerRadius:.74,depth:.09,segments:12,color:0xc99532,emissive:0x8f5a00,emissiveIntensity:.8});this.mesh=new THREE.Mesh(new THREE.TorusGeometry(this.triggerRadius,.06,8,32),mat);this.mesh.rotation.x=Math.PI/2;this.mesh.position.set(position.x,position.y+.03,position.z);scene.add(this.mesh);}
  contains(p){return Math.hypot(p.x-this.position.x,p.z-this.position.z)<this.triggerRadius&&Math.abs(p.y-this.position.y)<1.5;}
}
