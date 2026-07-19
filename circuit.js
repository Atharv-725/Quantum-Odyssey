/**
 * Quantum Odyssey - Circuit Editor
 * Manages the interactive drag-and-drop circuit board grid, gate placement, and connections.
 */

(function (global) {
    class CircuitEditor {
        /**
         * @param {HTMLElement} container The container DOM element for the grid
         * @param {number} numQubits Number of qubits (rows)
         * @param {number} numCols Number of steps (columns)
         * @param {Function} onChange Callback function triggered when circuit changes
         */
        constructor(container, numQubits = 3, numCols = 12, onChange = null) {
            this.container = container;
            this.numQubits = numQubits;
            this.numCols = numCols;
            this.onChange = onChange;
            
            // Grid representation: grid[qubit][step]
            this.grid = Array.from({ length: numQubits }, () => Array(numCols).fill(null));
            
            // Watch resize to keep canvas aligned (only register once per instance)
            window.addEventListener('resize', () => this.resizeCanvas());

            this.initDOM();
        }

        /**
         * Initializes the grid structure in the DOM.
         */
        initDOM() {
            this.container.innerHTML = '';
            this.container.style.display = 'grid';
            this.container.style.gridTemplateRows = `repeat(${this.numQubits}, 1fr)`;
            this.container.classList.add('circuit-grid-container');

            for (let q = 0; q < this.numQubits; q++) {
                const row = document.createElement('div');
                row.classList.add('circuit-row');
                row.dataset.qubit = q;

                // Label for Qubit (e.g. q[0])
                const label = document.createElement('div');
                label.classList.add('qubit-label');
                label.innerHTML = `<span>q<sub>${q}</sub></span>`;
                row.appendChild(label);

                // Wire line background
                const wireLine = document.createElement('div');
                wireLine.classList.add('wire-line');
                row.appendChild(wireLine);

                // Grid cells for this row
                const cellsContainer = document.createElement('div');
                cellsContainer.classList.add('cells-container');
                cellsContainer.style.gridTemplateColumns = `repeat(${this.numCols}, 1fr)`;

                for (let c = 0; c < this.numCols; c++) {
                    const cell = document.createElement('div');
                    cell.classList.add('circuit-cell');
                    cell.dataset.qubit = q;
                    cell.dataset.col = c;
                    
                    // Setup Drag and Drop events
                    cell.addEventListener('dragover', (e) => this.onDragOver(e, cell));
                    cell.addEventListener('dragleave', (e) => this.onDragLeave(e, cell));
                    cell.addEventListener('drop', (e) => this.onDrop(e, cell));
                    
                    cellsContainer.appendChild(cell);
                }
                row.appendChild(cellsContainer);
                this.container.appendChild(row);
            }

            // Create canvas overlay for multi-qubit gate connection lines
            const canvasOverlay = document.createElement('canvas');
            canvasOverlay.classList.add('circuit-canvas-overlay');
            this.container.appendChild(canvasOverlay);
            this.canvas = canvasOverlay;
            this.ctx = canvasOverlay.getContext('2d');
            
            // Small delay to ensure initial layout completes
            setTimeout(() => this.resizeCanvas(), 100);
        }

        resizeCanvas() {
            if (!this.canvas) return;
            const rect = this.container.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.drawConnections();
        }

        clearGrid() {
            this.grid = Array.from({ length: this.numQubits }, () => Array(this.numCols).fill(null));
            this.renderGates();
            this.notifyChange();
        }

        // --- Drag and Drop Handlers ---
        onDragOver(e, cell) {
            e.preventDefault();
            cell.classList.add('drag-hover');
        }

        onDragLeave(e, cell) {
            cell.classList.remove('drag-hover');
        }

        onDrop(e, cell) {
            e.preventDefault();
            cell.classList.remove('drag-hover');
            
            const gateType = e.dataTransfer.getData('text/plain');
            const targetQubit = parseInt(cell.dataset.qubit);
            const col = parseInt(cell.dataset.col);

            this.addGate(gateType, targetQubit, col);
        }

        /**
         * Adds a gate to the grid, handles target resolution for multi-qubit gates.
         */
        addGate(gateType, qubit, col) {
            // Remove existing gate at this spot first
            this.removeGate(qubit, col, false);

            if (['CNOT', 'CZ', 'SWAP'].includes(gateType)) {
                // Find another qubit row that is free at this column
                let partner = null;
                for (let q = 0; q < this.numQubits; q++) {
                    if (q !== qubit && this.grid[q][col] === null) {
                        partner = q;
                        break;
                    }
                }

                if (partner === null) {
                    // No space for a multi-qubit gate in this column
                    return;
                }

                // Place control/target or endpoints
                if (gateType === 'CNOT') {
                    this.grid[qubit][col] = { type: 'CNOT_CTRL', partner: partner };
                    this.grid[partner][col] = { type: 'CNOT_TGT', partner: qubit };
                } else if (gateType === 'CZ') {
                    this.grid[qubit][col] = { type: 'CZ_CTRL', partner: partner };
                    this.grid[partner][col] = { type: 'CZ_TGT', partner: qubit };
                } else if (gateType === 'SWAP') {
                    this.grid[qubit][col] = { type: 'SWAP', partner: partner };
                    this.grid[partner][col] = { type: 'SWAP', partner: qubit };
                }
            } else if (gateType === 'CCNOT') {
                if (this.numQubits < 3) return; // Needs at least 3 qubits
                // Find two other free qubits in this column
                let partners = [];
                for (let q = 0; q < this.numQubits; q++) {
                    if (q !== qubit && this.grid[q][col] === null) {
                        partners.push(q);
                    }
                }
                if (partners.length < 2) return; // Not enough space
                
                const ctrl1 = partners[0];
                const ctrl2 = partners[1];
                this.grid[qubit][col] = { type: 'CCNOT_TGT', partners: [ctrl1, ctrl2] };
                this.grid[ctrl1][col] = { type: 'CCNOT_CTRL', partner: qubit };
                this.grid[ctrl2][col] = { type: 'CCNOT_CTRL', partner: qubit };
            } else if (['RX', 'RY', 'RZ'].includes(gateType)) {
                let angleStr = prompt(`Enter angle for ${gateType} (in radians, e.g. pi, pi/2, 0.5):`, "pi/2");
                if (angleStr === null) return; // User cancelled
                
                // Parse angle expression
                function parseAngle(str) {
                    if (!str) return 0;
                    const normalized = str.trim().toLowerCase();
                    if (normalized === 'pi') return Math.PI;
                    if (normalized.includes('pi')) {
                        let formula = normalized.replace(/pi/g, Math.PI.toString());
                        try {
                            return Function('"use strict";return (' + formula + ')')();
                        } catch (e) {
                            return Math.PI;
                        }
                    }
                    const val = parseFloat(normalized);
                    return isNaN(val) ? 0 : val;
                }
                
                let angleVal = parseAngle(angleStr);
                this.grid[qubit][col] = { type: gateType, angle: angleVal, angleLabel: angleStr };
            } else {
                // Single qubit gate
                this.grid[qubit][col] = { type: gateType };
            }

            this.renderGates();
            this.notifyChange();
        }

        /**
         * Removes a gate from the grid and cleans up its partner if it's a multi-qubit gate.
         */
        removeGate(qubit, col, triggerNotify = true) {
            const gate = this.grid[qubit][col];
            if (!gate) return;

            // Clear partner for linked gates
            if (gate.partner !== undefined) {
                this.grid[gate.partner][col] = null;
            }
            if (gate.partners !== undefined) {
                gate.partners.forEach(p => {
                    this.grid[p][col] = null;
                });
            }
            if (gate.type === 'CCNOT_CTRL') {
                for (let q = 0; q < this.numQubits; q++) {
                    const g = this.grid[q][col];
                    if (g && (g.type === 'CCNOT_CTRL' || g.type === 'CCNOT_TGT')) {
                        this.grid[q][col] = null;
                    }
                }
            }

            this.grid[qubit][col] = null;
            
            if (triggerNotify) {
                this.renderGates();
                this.notifyChange();
            }
        }

        // --- Render UI elements ---
        renderGates() {
            // Remove old gate DOM elements
            const cells = this.container.querySelectorAll('.circuit-cell');
            cells.forEach(cell => {
                cell.innerHTML = '';
                cell.className = 'circuit-cell'; // reset classes
                
                const q = parseInt(cell.dataset.qubit);
                const c = parseInt(cell.dataset.col);
                const gate = this.grid[q][c];

                if (gate) {
                    const gateEl = document.createElement('div');
                    gateEl.classList.add('gate-block', `gate-${gate.type.toLowerCase().split('_')[0]}`);
                    gateEl.title = 'Click to remove';
                    
                    // Display text inside gate block
                    let label = gate.type;
                    if (gate.type === 'CNOT_CTRL') label = '●';
                    else if (gate.type === 'CNOT_TGT') label = '⊕';
                    else if (gate.type === 'CZ_CTRL') label = '●';
                    else if (gate.type === 'CZ_TGT') label = '●';
                    else if (gate.type === 'SWAP') label = '×';
                    else if (gate.type === 'CCNOT_CTRL') label = '●';
                    else if (gate.type === 'CCNOT_TGT') label = '⊕';
                    else if (['RX', 'RY', 'RZ'].includes(gate.type)) {
                        label = `${gate.type.charAt(0)}${gate.type.slice(1).toLowerCase()}(${gate.angleLabel || 'θ'})`;
                    }
                    
                    gateEl.textContent = label;
                    
                    // Remove on click
                    gateEl.addEventListener('click', () => this.removeGate(q, c));

                    cell.appendChild(gateEl);
                    cell.classList.add('has-gate');
                }
            });

            // Redraw CNOT/CZ/SWAP links on the canvas overlay
            this.drawConnections();
        }

        /**
         * Draws connecting lines for multi-qubit gates on the canvas.
         */
        drawConnections() {
            if (!this.canvas || !this.ctx) return;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            for (let c = 0; c < this.numCols; c++) {
                for (let q = 0; q < this.numQubits; q++) {
                    const gate = this.grid[q][c];
                    // To avoid drawing lines twice, only draw from the higher row (smaller row index) to the partner
                    if (gate && gate.partner !== undefined && q < gate.partner) {
                        const cell1 = this.container.querySelector(`.circuit-cell[data-qubit="${q}"][data-col="${c}"]`);
                        const cell2 = this.container.querySelector(`.circuit-cell[data-qubit="${gate.partner}"][data-col="${c}"]`);
                        
                        if (cell1 && cell2) {
                            const rect1 = cell1.getBoundingClientRect();
                            const rect2 = cell2.getBoundingClientRect();
                            const containerRect = this.container.getBoundingClientRect();

                            // Get coordinates relative to the circuit board container
                            const x = rect1.left + rect1.width / 2 - containerRect.left;
                            const y1 = rect1.top + rect1.height / 2 - containerRect.top;
                            const y2 = rect2.top + rect2.height / 2 - containerRect.top;

                            // Draw connecting line
                            this.ctx.beginPath();
                            this.ctx.moveTo(x, y1);
                            this.ctx.lineTo(x, y2);
                            
                            // Style matching gate type
                            if (gate.type.startsWith('CNOT')) {
                                this.ctx.strokeStyle = '#8b5cf6'; // Purple
                                this.ctx.lineWidth = 2.5;
                            } else if (gate.type.startsWith('CZ')) {
                                this.ctx.strokeStyle = '#4f46e5'; // Indigo
                                this.ctx.lineWidth = 2.5;
                            } else if (gate.type === 'SWAP') {
                                this.ctx.strokeStyle = '#0ea5e9'; // Sky blue
                                this.ctx.lineWidth = 2;
                            }
                            this.ctx.stroke();
                        }
                    } else if (gate && gate.type === 'CCNOT_TGT') {
                        const allQubits = [q, ...gate.partners];
                        const minQ = Math.min(...allQubits);
                        const maxQ = Math.max(...allQubits);
                        
                        const cell1 = this.container.querySelector(`.circuit-cell[data-qubit="${minQ}"][data-col="${c}"]`);
                        const cell2 = this.container.querySelector(`.circuit-cell[data-qubit="${maxQ}"][data-col="${c}"]`);
                        
                        if (cell1 && cell2) {
                            const rect1 = cell1.getBoundingClientRect();
                            const rect2 = cell2.getBoundingClientRect();
                            const containerRect = this.container.getBoundingClientRect();

                            const x = rect1.left + rect1.width / 2 - containerRect.left;
                            const y1 = rect1.top + rect1.height / 2 - containerRect.top;
                            const y2 = rect2.top + rect2.height / 2 - containerRect.top;

                            this.ctx.beginPath();
                            this.ctx.moveTo(x, y1);
                            this.ctx.lineTo(x, y2);
                            this.ctx.strokeStyle = '#8b5cf6'; // Purple
                            this.ctx.lineWidth = 2.5;
                            this.ctx.stroke();
                        }
                    }
                }
            }
        }

        notifyChange() {
            if (this.onChange) {
                this.onChange(this.grid);
            }
        }

        /**
         * Load a pre-structured grid representing an algorithm.
         */
        loadCircuit(presetGrid) {
            this.grid = Array.from({ length: this.numQubits }, () => Array(this.numCols).fill(null));
            for (let q = 0; q < this.numQubits; q++) {
                for (let c = 0; c < this.numCols; c++) {
                    if (presetGrid[q] && presetGrid[q][c]) {
                        this.grid[q][c] = { ...presetGrid[q][c] };
                    }
                }
            }
            this.renderGates();
            this.notifyChange();
        }

        /**
         * Dynamically update the number of qubits and adjust the grid.
         */
        setNumQubits(numQubits) {
            const oldGrid = this.grid;
            this.numQubits = numQubits;
            
            // Create a new grid and copy over existing gates if they fit
            this.grid = Array.from({ length: numQubits }, () => Array(this.numCols).fill(null));
            for (let q = 0; q < Math.min(oldGrid.length, numQubits); q++) {
                for (let c = 0; c < this.numCols; c++) {
                    const gate = oldGrid[q][c];
                    // Keep the gate if:
                    // 1. It is a single-qubit gate, OR
                    // 2. It is a multi-qubit gate and both control and target are within the new qubit range
                    if (gate) {
                        if (gate.partner !== undefined) {
                            if (gate.partner < numQubits) {
                                this.grid[q][c] = { ...gate };
                            }
                        } else {
                            this.grid[q][c] = { ...gate };
                        }
                    }
                }
            }
            
            this.initDOM();
            this.renderGates();
            this.notifyChange();
        }
    }

    global.CircuitEditor = CircuitEditor;
})(window);
