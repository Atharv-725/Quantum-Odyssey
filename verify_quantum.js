/**
 * Mathematical Verification Script for Quantum Simulation Engine
 * Runs in Node.js, mocking the browser global scope to test correctness.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("=== Quantum Odyssey Mathematical Verification ===");

// 1. Load and evaluate the simulator in a mock window scope
const quantumCode = fs.readFileSync(path.join(__dirname, 'quantum.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(quantumCode, sandbox);

const { Complex, Gates, QuantumState } = sandbox.window;

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`[PASS] ${message}`);
        passedTests++;
    } else {
        console.error(`[FAIL] ${message}`);
        failedTests++;
    }
}

function assertClose(val1, val2, precision = 0.0001, message) {
    const diff = Math.abs(val1 - val2);
    assert(diff <= precision, `${message} (Expected ${val2}, got ${val1}, diff=${diff})`);
}

// --- Test 1: Initial State ---
try {
    const state = new QuantumState(3);
    assert(state.numQubits === 3, "Initial state has 3 qubits");
    assert(state.dim === 8, "Initial state dimension is 8");
    assertClose(state.statevector[0].re, 1.0, 0.0001, "Basis state |000> amplitude real part is 1.0");
    assertClose(state.statevector[0].im, 0.0, 0.0001, "Basis state |000> amplitude imag part is 0.0");
    for (let i = 1; i < 8; i++) {
        assertClose(state.statevector[i].re, 0.0, 0.0001, `Basis state |${i.toString(2).padStart(3, '0')}> is 0.0`);
    }
} catch (e) {
    console.error("Test 1 failed with error:", e);
    failedTests++;
}

// --- Test 2: Single Qubit Gates (Hadamard & Pauli) ---
try {
    const state = new QuantumState(1);
    
    // Apply Hadamard
    state.applyGate(Gates.H, 0); // gives 1/sqrt(2) (|0> + |1>)
    const val = 1 / Math.sqrt(2);
    assertClose(state.statevector[0].re, val, 0.0001, "H |0> -> statevector[0] = 1/sqrt(2)");
    assertClose(state.statevector[1].re, val, 0.0001, "H |0> -> statevector[1] = 1/sqrt(2)");

    // Apply Pauli-X (NOT)
    const stateX = new QuantumState(1);
    stateX.applyGate(Gates.X, 0); // gives |1>
    assertClose(stateX.statevector[0].re, 0.0, 0.0001, "X |0> -> statevector[0] = 0");
    assertClose(stateX.statevector[1].re, 1.0, 0.0001, "X |0> -> statevector[1] = 1");
} catch (e) {
    console.error("Test 2 failed with error:", e);
    failedTests++;
}

// --- Test 3: Controlled-NOT (CNOT) & Bell State ---
try {
    const state = new QuantumState(2);
    state.applyGate(Gates.H, 0);                  // q0 -> superposition
    state.applyControlledGate(Gates.X, 0, 1);    // CNOT control=0, target=1 -> (|00> + |11>)/sqrt(2)

    const prob = state.getProbabilities();
    assertClose(prob[0], 0.5, 0.0001, "Bell state: Probability of |00> is 50%");
    assertClose(prob[3], 0.5, 0.0001, "Bell state: Probability of |11> is 50%");
    assertClose(prob[1], 0.0, 0.0001, "Bell state: Probability of |01> is 0%");
    assertClose(prob[2], 0.0, 0.0001, "Bell state: Probability of |10> is 0%");
} catch (e) {
    console.error("Test 3 failed with error:", e);
    failedTests++;
}

// --- Test 4: Bloch Vector Tracing ---
try {
    const state = new QuantumState(1);
    
    // State |0> Bloch Vector -> Z=1, X=0, Y=0
    let bloch = state.getBlochVector(0);
    assertClose(bloch.x, 0.0, 0.0001, "|0> Bloch vector X = 0");
    assertClose(bloch.y, 0.0, 0.0001, "|0> Bloch vector Y = 0");
    assertClose(bloch.z, 1.0, 0.0001, "|0> Bloch vector Z = 1");

    // State |1> (via X gate) -> Z=-1, X=0, Y=0
    state.applyGate(Gates.X, 0);
    bloch = state.getBlochVector(0);
    assertClose(bloch.z, -1.0, 0.0001, "|1> Bloch vector Z = -1");

    // State |+> (via H gate on |0>) -> Z=0, X=1, Y=0
    const statePlus = new QuantumState(1);
    statePlus.applyGate(Gates.H, 0);
    bloch = statePlus.getBlochVector(0);
    assertClose(bloch.x, 1.0, 0.0001, "|+> Bloch vector X = 1");
    assertClose(bloch.y, 0.0, 0.0001, "|+> Bloch vector Y = 0");
    assertClose(bloch.z, 0.0, 0.0001, "|+> Bloch vector Z = 0");

    // State |+i> (via H then S) -> Z=0, X=0, Y=1
    statePlus.applyGate(Gates.S, 0);
    bloch = statePlus.getBlochVector(0);
    assertClose(bloch.x, 0.0, 0.0001, "|+i> Bloch vector X = 0");
    assertClose(bloch.y, 1.0, 0.0001, "|+i> Bloch vector Y = 1");
    assertClose(bloch.z, 0.0, 0.0001, "|+i> Bloch vector Z = 0");
} catch (e) {
    console.error("Test 4 failed with error:", e);
    failedTests++;
}

// --- Test 5: Entanglement Coherence Collapse (Partial Trace Vector Shrinking) ---
try {
    const state = new QuantumState(2);
    state.applyGate(Gates.H, 0);
    state.applyControlledGate(Gates.X, 0, 1); // Bell state

    // Individual qubits in a Bell state are maximally mixed.
    // The Bloch vector should shrink to exactly (0,0,0).
    const bloch0 = state.getBlochVector(0);
    const bloch1 = state.getBlochVector(1);

    assertClose(bloch0.x, 0.0, 0.0001, "Entangled Q0: Bloch Vector X = 0");
    assertClose(bloch0.y, 0.0, 0.0001, "Entangled Q0: Bloch Vector Y = 0");
    assertClose(bloch0.z, 0.0, 0.0001, "Entangled Q0: Bloch Vector Z = 0");

    assertClose(bloch1.x, 0.0, 0.0001, "Entangled Q1: Bloch Vector X = 0");
    assertClose(bloch1.y, 0.0, 0.0001, "Entangled Q1: Bloch Vector Y = 0");
    assertClose(bloch1.z, 0.0, 0.0001, "Entangled Q1: Bloch Vector Z = 0");
} catch (e) {
    console.error("Test 5 failed with error:", e);
    failedTests++;
}

// --- Test 6: Parameterized Rotations (RX, RY, RZ) ---
try {
    // 1. RX(pi) on |0> -> |1>
    const stateRX = new QuantumState(1);
    const rxMatrix = Gates.Rx(Math.PI);
    stateRX.applyGate(rxMatrix, 0);
    let bloch = stateRX.getBlochVector(0);
    assertClose(bloch.z, -1.0, 0.0001, "RX(pi) |0> -> Bloch vector Z = -1");

    // 2. RY(pi/2) on |0> -> |+>
    const stateRY = new QuantumState(1);
    const ryMatrix = Gates.Ry(Math.PI / 2);
    stateRY.applyGate(ryMatrix, 0);
    bloch = stateRY.getBlochVector(0);
    assertClose(bloch.x, 1.0, 0.0001, "RY(pi/2) |0> -> Bloch vector X = 1");

    // 3. RZ(pi/2) on |+> -> |+i>
    const stateRZ = new QuantumState(1);
    stateRZ.applyGate(Gates.H, 0); // |+>
    const rzMatrix = Gates.Rz(Math.PI / 2);
    stateRZ.applyGate(rzMatrix, 0);
    bloch = stateRZ.getBlochVector(0);
    assertClose(bloch.y, 1.0, 0.0001, "RZ(pi/2) |+> -> Bloch vector Y = 1");
} catch (e) {
    console.error("Test 6 failed with error:", e);
    failedTests++;
}

// --- Test 7: Toffoli Gate (CCNOT) ---
try {
    // 1. CCNOT on |110> -> |111>
    const stateToffoli1 = new QuantumState(3);
    stateToffoli1.applyGate(Gates.X, 0); // q0 = 1
    stateToffoli1.applyGate(Gates.X, 1); // q1 = 1
    // Apply CCNOT (control 0, control 1, target 2)
    stateToffoli1.applyDoubleControlledGate(Gates.X, 0, 1, 2);
    const prob1 = stateToffoli1.getProbabilities();
    // 111 binary is index 7
    assertClose(prob1[7], 1.0, 0.0001, "Toffoli on |110> -> Probability of |111> is 100%");

    // 2. CCNOT on |100> -> |100>
    const stateToffoli2 = new QuantumState(3);
    stateToffoli2.applyGate(Gates.X, 0); // q0 = 1
    stateToffoli2.applyDoubleControlledGate(Gates.X, 0, 1, 2);
    const prob2 = stateToffoli2.getProbabilities();
    // 100 binary is index 1
    assertClose(prob2[1], 1.0, 0.0001, "Toffoli on |100> -> Probability of |100> is 100%");
} catch (e) {
    console.error("Test 7 failed with error:", e);
    failedTests++;
}

console.log("\n=== Test Results Summary ===");
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
