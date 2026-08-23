import * as THREE from 'three';
export class FinishZone {
  constructor(scene, position) { this.position=position; const mat=new THREE.MeshStandardMaterial({color:0xffd35a,emissive:0x8f5a00,emissiveIntensity:1.4}); this.mesh=new THREE.Mesh(new THREE.CylinderGeometry(2,2,.12,32),mat); this.mesh.position.set(position.x,position.y,position.z); scene.add(this.mesh); }
  contains(p) { return Math.hypot(p.x-this.position.x,p.z-this.position.z)<2.1 && Math.abs(p.y-this.position.y)<1.5; }
}
