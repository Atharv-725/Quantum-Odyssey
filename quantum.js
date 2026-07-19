/**
 * Quantum Odyssey - Simulation Engine
 * Handles complex number arithmetic and multi-qubit statevector simulation.
 */

(function (global) {
    // --- Complex Number Utilities ---
    const Complex = {
        zero: () => ({ re: 0, im: 0 }),
        one: () => ({ re: 1, im: 0 }),
        create: (re, im) => ({ re: re || 0, im: im || 0 }),
        
        add: (c1, c2) => ({ re: c1.re + c2.re, im: c1.im + c2.im }),
        sub: (c1, c2) => ({ re: c1.re - c2.re, im: c1.im - c2.im }),
        mul: (c1, c2) => ({
            re: c1.re * c2.re - c1.im * c2.im,
            im: c1.re * c2.im + c1.im * c2.re
        }),
        conj: (c) => ({ re: c.re, im: -c.im }),
        mag2: (c) => c.re * c.re + c.im * c.im,
        mag: (c) => Math.sqrt(c.re * c.re + c.im * c.im),
        phase: (c) => Math.atan2(c.im, c.re), // returns -PI to PI
        
        // e^(i * theta)
        expI: (theta) => ({
            re: Math.cos(theta),
            im: Math.sin(theta)
        })
    };

    // --- Standard Quantum Gate Matrices ---
    const SQRT2_INV = 1 / Math.sqrt(2);
    const Gates = {
        I: [
            [Complex.one(), Complex.zero()],
            [Complex.zero(), Complex.one()]
        ],
        H: [
            [{ re: SQRT2_INV, im: 0 }, { re: SQRT2_INV, im: 0 }],
            [{ re: SQRT2_INV, im: 0 }, { re: -SQRT2_INV, im: 0 }]
        ],
        X: [
            [Complex.zero(), Complex.one()],
            [Complex.one(), Complex.zero()]
        ],
        Y: [
            [Complex.zero(), { re: 0, im: -1 }],
            [{ re: 0, im: 1 }, Complex.zero()]
        ],
        Z: [
            [Complex.one(), Complex.zero()],
            [Complex.zero(), { re: -1, im: 0 }]
        ],
        S: [
            [Complex.one(), Complex.zero()],
            [Complex.zero(), { re: 0, im: 1 }]
        ],
        T: [
            [Complex.one(), Complex.zero()],
            [Complex.zero(), { re: SQRT2_INV, im: SQRT2_INV }]
        ],
        
        // Rotations
        Rx: (theta) => {
            const cos = Math.cos(theta / 2);
            const sin = Math.sin(theta / 2);
            return [
                [{ re: cos, im: 0 }, { re: 0, im: -sin }],
                [{ re: 0, im: -sin }, { re: cos, im: 0 }]
            ];
        },
        Ry: (theta) => {
            const cos = Math.cos(theta / 2);
            const sin = Math.sin(theta / 2);
            return [
                [{ re: cos, im: 0 }, { re: -sin, im: 0 }],
                [{ re: sin, im: 0 }, { re: cos, im: 0 }]
            ];
        },
        Rz: (theta) => {
            const cos = Math.cos(theta / 2);
            const sin = Math.sin(theta / 2);
            return [
                [{ re: cos, im: -sin }, Complex.zero()],
                [Complex.zero(), { re: cos, im: sin }]
            ];
        }
    };

    // --- Quantum State Class ---
    class QuantumState {
        constructor(numQubits) {
            this.numQubits = numQubits;
            this.dim = 1 << numQubits;
            this.statevector = [];
            
            // Initialize to |00...0>
            this.statevector.push(Complex.one());
            for (let i = 1; i < this.dim; i++) {
                this.statevector.push(Complex.zero());
            }
        }

        clone() {
            const copy = new QuantumState(this.numQubits);
            copy.statevector = this.statevector.map(c => ({ re: c.re, im: c.im }));
            return copy;
        }

        /**
         * Applies a 1-qubit gate to a target qubit.
         * @param {Array} gate 2x2 matrix of Complex numbers
         * @param {number} target Qubit index (0-indexed, where 0 is LSB)
         */
        applyGate(gate, target) {
            const nextState = new Array(this.dim);
            const mask = 1 << target;

            for (let i = 0; i < this.dim; i++) {
                if ((i & mask) === 0) {
                    const i0 = i;
                    const i1 = i | mask;
                    
                    const v0 = this.statevector[i0];
                    const v1 = this.statevector[i1];

                    // v0' = g00 * v0 + g01 * v1
                    // v1' = g10 * v0 + g11 * v1
                    nextState[i0] = Complex.add(
                        Complex.mul(gate[0][0], v0),
                        Complex.mul(gate[0][1], v1)
                    );
                    nextState[i1] = Complex.add(
                        Complex.mul(gate[1][0], v0),
                        Complex.mul(gate[1][1], v1)
                    );
                }
            }

            this.statevector = nextState;
            this.normalize();
        }

        /**
         * Applies a controlled 1-qubit gate.
         * @param {Array} gate 2x2 matrix of Complex numbers
         * @param {number} control Qubit index (control)
         * @param {number} target Qubit index (target)
         */
        applyControlledGate(gate, control, target) {
            if (control === target) return;
            const nextState = [...this.statevector];
            const controlMask = 1 << control;
            const targetMask = 1 << target;

            for (let i = 0; i < this.dim; i++) {
                // Apply ONLY if control bit is 1 and we are at target bit = 0 (to process pairs)
                if ((i & controlMask) !== 0 && (i & targetMask) === 0) {
                    const i0 = i;
                    const i1 = i | targetMask;

                    const v0 = this.statevector[i0];
                    const v1 = this.statevector[i1];

                    nextState[i0] = Complex.add(
                        Complex.mul(gate[0][0], v0),
                        Complex.mul(gate[0][1], v1)
                    );
                    nextState[i1] = Complex.add(
                        Complex.mul(gate[1][0], v0),
                        Complex.mul(gate[1][1], v1)
                    );
                }
            }

            this.statevector = nextState;
            this.normalize();
        }

        /**
         * Applies a SWAP gate between two qubits.
         */
        applySwap(q1, q2) {
            if (q1 === q2) return;
            const nextState = new Array(this.dim);
            const mask1 = 1 << q1;
            const mask2 = 1 << q2;

            for (let i = 0; i < this.dim; i++) {
                const bit1 = (i & mask1) !== 0 ? 1 : 0;
                const bit2 = (i & mask2) !== 0 ? 1 : 0;

                if (bit1 !== bit2) {
                    // Swap amplitudes of state i and state with toggled bits
                    const targetIndex = i ^ mask1 ^ mask2;
                    nextState[i] = this.statevector[targetIndex];
                } else {
                    nextState[i] = this.statevector[i];
                }
            }
            this.statevector = nextState;
        }

        /**
         * Applies a double-controlled 1-qubit gate (e.g. Toffoli).
         * @param {Array} gate 2x2 matrix of Complex numbers
         * @param {number} control1 Qubit index (control 1)
         * @param {number} control2 Qubit index (control 2)
         * @param {number} target Qubit index (target)
         */
        applyDoubleControlledGate(gate, control1, control2, target) {
            if (control1 === target || control2 === target || control1 === control2) return;
            const nextState = [...this.statevector];
            const controlMask1 = 1 << control1;
            const controlMask2 = 1 << control2;
            const targetMask = 1 << target;

            for (let i = 0; i < this.dim; i++) {
                // Apply ONLY if both control bits are 1 and we are at target bit = 0
                if ((i & controlMask1) !== 0 && (i & controlMask2) !== 0 && (i & targetMask) === 0) {
                    const i0 = i;
                    const i1 = i | targetMask;

                    const v0 = this.statevector[i0];
                    const v1 = this.statevector[i1];

                    nextState[i0] = Complex.add(
                        Complex.mul(gate[0][0], v0),
                        Complex.mul(gate[0][1], v1)
                    );
                    nextState[i1] = Complex.add(
                        Complex.mul(gate[1][0], v0),
                        Complex.mul(gate[1][1], v1)
                    );
                }
            }

            this.statevector = nextState;
            this.normalize();
        }

        /**
         * Normalize the statevector to guard against numerical drift.
         */
        normalize() {
            let totalMag2 = 0;
            for (let i = 0; i < this.dim; i++) {
                totalMag2 += Complex.mag2(this.statevector[i]);
            }
            if (totalMag2 === 0) return;
            const scale = 1 / Math.sqrt(totalMag2);
            for (let i = 0; i < this.dim; i++) {
                this.statevector[i].re *= scale;
                this.statevector[i].im *= scale;
            }
        }

        /**
         * Calculates state probabilities.
         * @returns {Array<number>} Array of probabilities
         */
        getProbabilities() {
            return this.statevector.map(c => Complex.mag2(c));
        }

        /**
         * Traces out all qubits except the target qubit to obtain its density matrix,
         * then computes the Bloch Sphere vector (x, y, z).
         * @param {number} target Qubit index
         * @returns {Object} {x, y, z}
         */
        getBlochVector(target) {
            const mask = 1 << target;
            let rho00 = 0;
            let rho11 = 0;
            let rho01 = Complex.zero();

            for (let i = 0; i < this.dim; i++) {
                if ((i & mask) === 0) {
                    const i0 = i;
                    const i1 = i | mask;

                    const v0 = this.statevector[i0];
                    const v1 = this.statevector[i1];

                    // rho00 = sum_k v0 * conj(v0) = v0.mag2
                    rho00 += Complex.mag2(v0);
                    // rho11 = sum_k v1 * conj(v1) = v1.mag2
                    rho11 += Complex.mag2(v1);
                    // rho01 = sum_k v0 * conj(v1)
                    rho01 = Complex.add(rho01, Complex.mul(v0, Complex.conj(v1)));
                }
            }

            // Bloch Vector elements:
            // x = 2 * Re(rho01)
            // y = -2 * Im(rho01)
            // z = rho00 - rho11
            const x = 2 * rho01.re;
            const y = -2 * rho01.im;
            const z = rho00 - rho11;

            return { x, y, z };
        }

        /**
         * Perform measurement simulation on a qubit.
         * Collapses statevector based on probabilities.
         * @param {number} target Target qubit index
         * @returns {number} 0 or 1 result
         */
        measure(target) {
            const mask = 1 << target;
            let prob0 = 0;

            for (let i = 0; i < this.dim; i++) {
                if ((i & mask) === 0) {
                    prob0 += Complex.mag2(this.statevector[i]);
                }
            }

            const r = Math.random();
            const result = r < prob0 ? 0 : 1;

            // Collapse the statevector
            const nextState = new Array(this.dim);
            const scale = 1 / Math.sqrt(result === 0 ? prob0 : (1 - prob0));

            for (let i = 0; i < this.dim; i++) {
                const bit = (i & mask) !== 0 ? 1 : 0;
                if (bit === result) {
                    nextState[i] = {
                        re: this.statevector[i].re * scale,
                        im: this.statevector[i].im * scale
                    };
                } else {
                    nextState[i] = Complex.zero();
                }
            }

            this.statevector = nextState;
            return result;
        }
    }

    // Expose classes and helpers to window scope
    global.Complex = Complex;
    global.Gates = Gates;
    global.QuantumState = QuantumState;

})(window);
