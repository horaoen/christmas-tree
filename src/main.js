import './style.css';
import { setupScene } from './webgl/scene.js';

document.querySelector('#app').innerHTML = `
  <h1>3D 粒子圣诞树</h1>
  <canvas id="three-canvas"></canvas>
`;

setupScene(document.querySelector('#three-canvas'));
