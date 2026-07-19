/**
 * Quantum Odyssey - Bloch Sphere Renderer
 * Renders an interactive 3D Bloch Sphere using HTML5 Canvas and orthographic projection.
 */

(function (global) {
    class BlochSphere {
        /**
         * @param {HTMLCanvasElement} canvas The canvas element to render on
         * @param {Object} options Configuration options
         */
        constructor(canvas, options = {}) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            
            // Sphere configuration
            this.radiusRatio = options.radiusRatio || 0.75; // Sphere radius relative to canvas size
            this.yaw = options.yaw !== undefined ? options.yaw : -0.6; // Rotation around vertical axis
            this.pitch = options.pitch !== undefined ? options.pitch : 0.4; // Rotation around horizontal axis
            
            // Colors
            this.colors = {
                sphere: '#161c2d',
                gridFront: 'rgba(79, 70, 229, 0.25)',
                gridBack: 'rgba(79, 70, 229, 0.08)',
                axis: '#4f5e7f',
                axisFront: '#7f93bf',
                vector: '#4f46e5',
                vectorGlow: 'rgba(79, 70, 229, 0.2)',
                text: '#a5aab5',
                textActive: '#4f46e5'
            };

            // Vector state (current and target for animation)
            this.currentV = { x: 0, y: 0, z: 1 };
            this.targetV = { x: 0, y: 0, z: 1 };
            this.animating = false;

            this.setupInteraction();
            this.resize();
        }

        resize() {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            // Use parent size or default to layout
            this.width = rect.width || 300;
            this.height = rect.height || 300;
            
            // Set high DPI display support
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = this.width * dpr;
            this.canvas.height = this.height * dpr;
            this.canvas.style.width = this.width + 'px';
            this.canvas.style.height = this.height + 'px';
            
            this.ctx.scale(dpr, dpr);
            
            this.cx = this.width / 2;
            this.cy = this.height / 2;
            this.r = Math.min(this.width, this.height) * this.radiusRatio / 2;
            
            this.draw();
        }

        /**
         * Sets target Bloch vector and starts animation.
         * @param {number} x Bloch x coordinate (-1 to 1)
         * @param {number} y Bloch y coordinate (-1 to 1)
         * @param {number} z Bloch z coordinate (-1 to 1)
         */
        setVector(x, y, z) {
            this.targetV = { x, y, z };
            
            // If not animating, start loop
            if (!this.animating) {
                this.animating = true;
                this.animate();
            }
        }

        animate() {
            const dx = this.targetV.x - this.currentV.x;
            const dy = this.targetV.y - this.currentV.y;
            const dz = this.targetV.z - this.currentV.z;
            
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (dist < 0.005) {
                this.currentV = { ...this.targetV };
                this.animating = false;
                this.draw();
                return;
            }

            // Lerp state vector towards target
            this.currentV.x += dx * 0.12;
            this.currentV.y += dy * 0.12;
            this.currentV.z += dz * 0.12;
            
            this.draw();
            requestAnimationFrame(() => this.animate());
        }

        // --- 3D Projection Engine ---
        /**
         * Projects 3D Bloch coordinates to 2D screen coordinates
         * Bloch axes:
         *   z_b: vertical (+1 is |0>, -1 is |1>)
         *   y_b: horizontal right (+1 is |+i>, -1 is |-i>)
         *   x_b: depth front (+1 is |+>, -1 is |->)
         * Maps to math coords: x = y_b, y = z_b, z = x_b
         */
        project(xb, yb, zb) {
            // Map Bloch to math coordinates
            const x = yb;
            const y = zb;
            const z = xb;

            // 1. Rotate around vertical Y axis (yaw)
            const cosY = Math.cos(this.yaw);
            const sinY = Math.sin(this.yaw);
            const x1 = x * cosY - z * sinY;
            const z1 = x * sinY + z * cosY;
            const y1 = y;

            // 2. Rotate around horizontal X axis (pitch)
            const cosP = Math.cos(this.pitch);
            const sinP = Math.sin(this.pitch);
            const x2 = x1;
            const y2 = y1 * cosP - z1 * sinP;
            const z2 = y1 * sinP + z1 * cosP;

            // Orthographic projection to screen coordinates
            return {
                x: this.cx + x2 * this.r,
                y: this.cy - y2 * this.r,
                depth: z2 // depth parameter (>0 is closer to viewer)
            };
        }

        // --- Interactive Dragging ---
        setupInteraction() {
            let isDragging = false;
            let lastX = 0;
            let lastY = 0;

            const onStart = (e) => {
                isDragging = true;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                lastX = clientX;
                lastY = clientY;
            };

            const onMove = (e) => {
                if (!isDragging) return;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                
                const dx = clientX - lastX;
                const dy = clientY - lastY;
                
                // Adjust yaw and pitch sensitivity
                this.yaw += dx * 0.007;
                this.pitch += dy * 0.007;
                
                // Clamp pitch to avoid gimbal lock/flip upside down
                this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch));

                lastX = clientX;
                lastY = clientY;
                this.draw();
            };

            const onEnd = () => {
                isDragging = false;
            };

            this.canvas.addEventListener('mousedown', onStart);
            this.canvas.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);

            this.canvas.addEventListener('touchstart', onStart, { passive: true });
            this.canvas.addEventListener('touchmove', onMove, { passive: true });
            window.addEventListener('touchend', onEnd);
        }

        // --- Drawing Pipeline ---
        draw() {
            this.ctx.clearRect(0, 0, this.width, this.height);

            // Draw sphere background shadow
            this.ctx.beginPath();
            this.ctx.arc(this.cx, this.cy, this.r, 0, Math.PI * 2);
            this.ctx.fillStyle = this.colors.sphere;
            this.ctx.fill();

            // Render Sphere details in depth order:
            // 1. Back parts of grid circles (depth < 0)
            // 2. Axes
            // 3. Front parts of grid circles (depth > 0)
            // 4. State vector arrow
            // 5. Labels and outlines

            this.drawGrid(false); // Back grid
            this.drawAxes();
            this.drawGrid(true);  // Front grid
            this.drawStateVector();
            this.drawOutline();
        }

        drawOutline() {
            this.ctx.beginPath();
            this.ctx.arc(this.cx, this.cy, this.r, 0, Math.PI * 2);
            this.ctx.strokeStyle = this.colors.axis;
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
        }

        drawAxes() {
            const axes = [
                { name: 'X', from: [-1, 0, 0], to: [1, 0, 0], labelPos: [1.2, 0, 0], labelP: '|+⟩', labelM: '|−⟩', labelMPos: [-1.2, 0, 0] },
                { name: 'Y', from: [0, -1, 0], to: [0, 1, 0], labelPos: [0, 1.2, 0], labelP: '|+i⟩', labelM: '|−i⟩', labelMPos: [0, -1.2, 0] },
                { name: 'Z', from: [0, 0, -1], to: [0, 0, 1], labelPos: [0, 0, 1.25], labelP: '|0⟩', labelM: '|1⟩', labelMPos: [0, 0, -1.25] }
            ];

            axes.forEach(axis => {
                const pFrom = this.project(axis.from[0], axis.from[1], axis.from[2]);
                const pTo = this.project(axis.to[0], axis.to[1], axis.to[2]);
                
                // Draw axis line (fade back axis, highlight front axis)
                const isFront = (pFrom.depth + pTo.depth) / 2 > 0;
                this.ctx.beginPath();
                this.ctx.moveTo(pFrom.x, pFrom.y);
                this.ctx.lineTo(pTo.x, pTo.y);
                this.ctx.strokeStyle = isFront ? this.colors.axisFront : this.colors.axis;
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([4, 4]); // Dashed axes inside sphere
                this.ctx.stroke();
                this.ctx.setLineDash([]); // Reset line dash

                // Draw positive labels
                const pLabelP = this.project(axis.labelPos[0], axis.labelPos[1], axis.labelPos[2]);
                this.ctx.font = '12px "Outfit", "Inter", sans-serif';
                this.ctx.fillStyle = axis.name === 'Z' ? this.colors.textActive : this.colors.text;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(axis.labelP, pLabelP.x, pLabelP.y);

                // Draw negative labels
                const pLabelM = this.project(axis.labelMPos[0], axis.labelMPos[1], axis.labelMPos[2]);
                this.ctx.fillStyle = axis.name === 'Z' ? this.colors.textActive : this.colors.text;
                this.ctx.fillText(axis.labelM, pLabelM.x, pLabelM.y);
            });
        }

        /**
         * Draws 3D circles (equator and meridians)
         * @param {boolean} frontOnly If true, draws segments closer to viewer; if false, draws background segments
         */
        drawGrid(frontOnly) {
            const steps = 60;
            const drawCircle3D = (getPoint) => {
                this.ctx.beginPath();
                let drawing = false;

                for (let i = 0; i <= steps; i++) {
                    const angle = (i / steps) * Math.PI * 2;
                    const pt = getPoint(angle);
                    const projected = this.project(pt[0], pt[1], pt[2]);

                    const isFront = projected.depth >= 0;
                    if (isFront === frontOnly) {
                        if (!drawing) {
                            this.ctx.moveTo(projected.x, projected.y);
                            drawing = true;
                        } else {
                            this.ctx.lineTo(projected.x, projected.y);
                        }
                    } else {
                        if (drawing) {
                            this.ctx.stroke();
                            drawing = false;
                        }
                    }
                }
                if (drawing) {
                    this.ctx.stroke();
                }
            };

            this.ctx.strokeStyle = frontOnly ? this.colors.gridFront : this.colors.gridBack;
            this.ctx.lineWidth = 1;

            // 1. Equator (X-Y plane): z_b = 0
            drawCircle3D(angle => [Math.cos(angle), Math.sin(angle), 0]);

            // 2. Meridian 1 (X-Z plane): y_b = 0
            drawCircle3D(angle => [Math.cos(angle), 0, Math.sin(angle)]);

            // 3. Meridian 2 (Y-Z plane): x_b = 0
            drawCircle3D(angle => [0, Math.cos(angle), Math.sin(angle)]);
        }

        drawStateVector() {
            const origin = this.project(0, 0, 0);
            const tip = this.project(this.currentV.x, this.currentV.y, this.currentV.z);
            
            // Draw projection guidelines (dashed lines from vector tip to axis/planes)
            const xyProj = this.project(this.currentV.x, this.currentV.y, 0);
            const zProj = this.project(0, 0, this.currentV.z);

            this.ctx.beginPath();
            this.ctx.moveTo(tip.x, tip.y);
            this.ctx.lineTo(xyProj.x, xyProj.y);
            this.ctx.moveTo(tip.x, tip.y);
            this.ctx.lineTo(zProj.x, zProj.y);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([2, 3]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // Draw a dot on the projection plane
            this.ctx.beginPath();
            this.ctx.arc(xyProj.x, xyProj.y, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 245, 255, 0.4)';
            this.ctx.fill();

            // Draw vector glow
            this.ctx.beginPath();
            this.ctx.moveTo(origin.x, origin.y);
            this.ctx.lineTo(tip.x, tip.y);
            this.ctx.strokeStyle = this.colors.vectorGlow;
            this.ctx.lineWidth = 6;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();

            // Draw main vector arrow
            this.ctx.beginPath();
            this.ctx.moveTo(origin.x, origin.y);
            this.ctx.lineTo(tip.x, tip.y);
            this.ctx.strokeStyle = this.colors.vector;
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();

            // Draw vector arrowhead
            // Calculate arrow angle in 2D
            const dx = tip.x - origin.x;
            const dy = tip.y - origin.y;
            const len = Math.sqrt(dx*dx + dy*dy);
            
            if (len > 10) {
                const angle2D = Math.atan2(dy, dx);
                const arrowSize = 7;
                
                this.ctx.beginPath();
                this.ctx.moveTo(tip.x, tip.y);
                this.ctx.lineTo(
                    tip.x - arrowSize * Math.cos(angle2D - Math.PI / 6),
                    tip.y - arrowSize * Math.sin(angle2D - Math.PI / 6)
                );
                this.ctx.lineTo(
                    tip.x - arrowSize * Math.cos(angle2D + Math.PI / 6),
                    tip.y - arrowSize * Math.sin(angle2D + Math.PI / 6)
                );
                this.ctx.closePath();
                this.ctx.fillStyle = this.colors.vector;
                this.ctx.fill();
            }
        }
    }

    global.BlochSphere = BlochSphere;
})(window);
