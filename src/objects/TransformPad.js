import * as THREE from 'three';
import { ShallowBasin } from './ShallowBasin.js';
const PAD_STYLE={wood:{color:0xb97842,emissive:0x4b1d08},stone:{color:0x777d83,emissive:0x242a30},paper:{color:0xeee5ce,emissive:0x635d50}};
export class TransformPad {
  constructor(scene,physics,position,type){this.position=position;this.type=type;this.radius=1.15;this.triggerRadius=.64;this.inside=false;const style=PAD_STYLE[type];this.basin=new ShallowBasin(scene,physics,position,{radius:this.radius,innerRadius:.62,depth:.06,segments:12,color:style.color,emissive:style.emissive,emissiveIntensity:.65});this.mesh=new THREE.Group();this.mesh.position.set(position.x,position.y,position.z);scene.add(this.mesh);const ring=new THREE.Mesh(new THREE.TorusGeometry(this.triggerRadius,.045,8,32),new THREE.MeshBasicMaterial({color:style.color}));ring.rotation.x=Math.PI/2;ring.position.y=.025;this.mesh.add(ring);}
  update(p,onEnter){const dx=p.x-this.position.x,dz=p.z-this.position.z,nowInside=dx*dx+dz*dz<=this.triggerRadius*this.triggerRadius&&Math.abs(p.y-this.position.y)<1.5;if(nowInside&&!this.inside)onEnter(this.type);this.inside=nowInside;}
}
