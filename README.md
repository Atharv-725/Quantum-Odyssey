# Quantum Odyssey ⚛️

An interactive, premium visual quantum simulator and sandbox built purely with HTML, Vanilla CSS, and ES6 JavaScript. Master quantum computing concepts visually through drag-and-drop circuit design, real-time state analysis, and built-in interactive sandbox challenges.

👉 **Live Demo**: [https://atharv-725.github.io/Quantum-Odyssey/](https://atharv-725.github.io/Quantum-Odyssey/)

---

## Features 🚀

### 1. Interactive Circuit Board
* **Visual Grid Editor**: Drag-and-drop gates directly onto qubit wires.
* **Qubit Sandbox Selector**: Dynamically configure layouts from 1 to 5 qubits.
* **Full Gate Toolbox**:
  * **Hadamard (H)** — Creates superposition states.
  * **Pauli Gates (X, Y, Z)** — Bit flips and phase flips.
  * **Phase Shifting (S, T)** — $\pi/2$ and $\pi/4$ phase controls.
  * **Two-Qubit Operators (CNOT, CZ, SWAP)** — Entangles and swaps qubit states.
  * **Toffoli (CCNOT)** — Reversible 3-qubit logic (AND-gate equivalent).
  * **Rotation Gates (RX, RY, RZ)** — Parameterized rotations with formula parsing (e.g., `pi`, `pi/2`).
  * **Measurement (M)** — Projects quantum states into classical registers.

### 2. State & Visual Analytics
* **3D Bloch Sphere Monitor**: Rotates in 3D to show individual qubit statevectors.
* **Phasor Amplitude Graphs**: Displays real-time complex amplitude heights and phase rotation angles.
* **Probability Visualizers**: Computes and displays measurement probabilities for all basis states.

### 3. Bidirectional Developer Translation
* **Qiskit Code Export**: Real-time translation of visually designed circuits into executable Qiskit Python code.
* **OpenQASM 2.0 Import/Export**: Instantly import or export standard OpenQASM 2.0 scripts.

### 4. Educational Algorithms Library
Includes a dropdown selection to instantly load and visualize key quantum algorithms:
* Deutsch-Jozsa, Bernstein-Vazirani, Simon's Algorithm
* Grover's Search & Amplitude Amplification
* Shor's Factoring, QFT, and Quantum Phase Estimation (QPE)
* Variational Quantum Eigensolver (VQE) & QAOA
* Quantum Walks, Support Vector Machines (QSVM), and QPCA
* Trotter-Suzuki Simulation, Quantum Counting, and BB84

### 5. Interactive Sandbox Quests
* Includes 50 progressive tasks to test your quantum design skills.
* The dropdown items **dynamically turn green** the moment your circuit matches the mathematical target solution!

---

## Project Structure 📁

```text
├── index.html          # Application structure & user interface
├── style.css           # Premium dark-mode glassmorphic design system
├── app.js              # State manager, event bindings & code translator
├── circuit.js          # Interactive circuit board, grid scheduler & drag/drop logic
├── bloch.js            # 3D Bloch sphere vector canvas graphics
├── quantum.js          # Linear algebra simulator (vector multiplication, Kronecker products)
└── verify_quantum.js   # Mathematical test suite for simulator verification
```

---

## Getting Started locally 💻

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Atharv-725/Quantum-Odyssey.git
   cd Quantum-Odyssey
   ```

2. **Run a local server**:
   Since the app uses standard ES6 modules, it needs to be served via HTTP.
   * Using Python:
     ```bash
     python -m http.server 8000
     ```
   * Using Node.js:
     ```bash
     npx http-server
     ```
   Open `http://localhost:8000` in your web browser.

3. **Run tests**:
   Verify the simulator mathematics:
   ```bash
   node verify_quantum.js
   ```

---

## Deployment 🌐

To deploy your own copy of the app:
1. Go to your repository settings on GitHub.
2. Select **Pages** from the sidebar.
3. Under **Build and deployment**, select the `main` branch as your source and click **Save**.
4. Your site will be live at `https://<your-username>.github.io/Quantum-Odyssey/`.

---

## Author ✍️
Built with ❤️ by **Dorle**.
