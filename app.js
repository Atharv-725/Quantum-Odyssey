/**
 * Quantum Odyssey - App Orchestrator
 * Coordinates UI inputs, simulator runs, visual updates, quests, and exports.
 */

(function () {
    // --- App State ---
    let editor = null;
    let blochSphere = null;
    let selectedQubit = 0;
    let activeTab = 'qiskit';
    let currentGrid = null;
    let lastSimulatedState = null;
    let isEditingCode = false;
    let currentSelectedQuestId = 'quest-superposition';

    // --- Sandbox Quests List ---
    const sandboxQuests = [
        // Category 1: Quantum Fundamentals
        { id: 'quest-superposition', title: '1. Superposition Spark', desc: 'Put qubit 0 into the |+⟩ state.', category: 'Fundamentals', solution: 'superposition', isAuto: true },
        { id: 'quest-entangle', title: '2. Entangled Twins', desc: 'Create a Bell state between q₀ and q₁.', category: 'Fundamentals', solution: 'entangle', isAuto: true },
        { id: 'quest-phase', title: '3. Phase Spinner', desc: 'Put qubit 0 into the |−i⟩ state.', category: 'Fundamentals', solution: 'phase', isAuto: true },
        { id: 'quest-teleport', title: '4. Teleportation Leap', desc: 'Teleport a state from q₀ to q₂.', category: 'Fundamentals', solution: 'teleportation', isAuto: true },
        { id: 'quest-pauli', title: '5. Pauli Playground', desc: 'Put q₀ in |1⟩ and q₁ in |−⟩.', category: 'Fundamentals', solution: 'pauli', isAuto: true },
        { id: 'quest-ghz', title: '6. Entangled Trio (GHZ)', desc: 'Create GHZ state on q₀, q₁, q₂.', category: 'Fundamentals', solution: 'ghz', isAuto: true },
        { id: 'quest-swap', title: '7. Swap Shop', desc: 'Swap states of q₀ and q₁.', category: 'Fundamentals', solution: 'swap', isAuto: true },
        { id: 'quest-double-h', title: '8. Double Hadamard', desc: 'Apply H twice to q₀, returning it to |0⟩.', category: 'Fundamentals', solution: 'double-h', isAuto: false },
        { id: 'quest-phase-flip', title: '9. Phase Flip (Z)', desc: 'Put q₀ in |+⟩, apply Z, check if it is |−⟩.', category: 'Fundamentals', solution: 'phase-flip', isAuto: false },
        { id: 'quest-state1', title: '10. State |1⟩ Prep', desc: 'Put q₀ in state |1⟩ using only one gate.', category: 'Fundamentals', solution: 'state1', isAuto: false },
        { id: 'quest-state-minus', title: '11. State |−⟩ Prep', desc: 'Put q₀ in state |−⟩ starting from |0⟩.', category: 'Fundamentals', solution: 'state-minus', isAuto: false },
        { id: 'quest-state-plus-i', title: '12. State |+i⟩ Prep', desc: 'Put q₀ in state |+i⟩ starting from |0⟩.', category: 'Fundamentals', solution: 'state-plus-i', isAuto: false },
        { id: 'quest-state-minus-i', title: '13. State |−i⟩ Prep', desc: 'Put q₀ in state |−i⟩ starting from |0⟩.', category: 'Fundamentals', solution: 'state-minus-i', isAuto: false },
        { id: 'quest-cz-test', title: '14. Controlled-Z Test', desc: 'Prep |+⟩ on q₀ and q₁, apply CZ, inspect state.', category: 'Fundamentals', solution: 'cz-test', isAuto: false },
        { id: 'quest-h-z-h', title: '15. Hadamard-Z Sandwich', desc: 'Put q₀ in |0⟩, apply H, Z, H, verify it is |1⟩.', category: 'Fundamentals', solution: 'h-z-h', isAuto: false },

        // Category 2: Classic Algorithms
        { id: 'quest-dj-const', title: '16. Deutsch Constant', desc: 'Verify constant oracle response.', category: 'Classic Algorithms', solution: 'deutsch', isAuto: false },
        { id: 'quest-dj-bal', title: '17. Deutsch Balanced', desc: 'Verify balanced oracle response.', category: 'Classic Algorithms', solution: 'deutsch_jozsa', isAuto: false },
        { id: 'quest-bv-11', title: '18. Bernstein-Vazirani (11)', desc: 'Find hidden bitstring "11" using 2 qubits.', category: 'Classic Algorithms', solution: 'bernstein_vazirani', isAuto: false },
        { id: 'quest-bv-101', title: '19. Bernstein-Vazirani (101)', desc: 'Find hidden bitstring "101" using 3 qubits.', category: 'Classic Algorithms', solution: 'bernstein_vazirani', isAuto: false },
        { id: 'quest-simon-11', title: '20. Simon Periodicity (11)', desc: 'Test Simon\'s algorithm for period 11.', category: 'Classic Algorithms', solution: 'simon', isAuto: false },
        { id: 'quest-grover-oracle', title: '21. Grover Oracle Prep', desc: 'Design oracle marking the state |111⟩.', category: 'Classic Algorithms', solution: 'grover', isAuto: false },
        { id: 'quest-grover-diffuser', title: '22. Grover Diffuser', desc: 'Add diffuser to amplify state |111⟩.', category: 'Classic Algorithms', solution: 'grover', isAuto: false },
        { id: 'quest-shor-factor', title: '23. Shor\'s Factoring', desc: 'Configure Shor\'s order-finding circuit.', category: 'Classic Algorithms', solution: 'shor', isAuto: false },

        // Category 3: Mathematical Transforms
        { id: 'quest-qft-2q', title: '24. QFT (2-Qubit)', desc: 'Build a 2-qubit QFT circuit.', category: 'Mathematical Transforms', solution: 'qft', isAuto: false },
        { id: 'quest-qft-3q', title: '25. QFT (3-Qubit)', desc: 'Build a 3-qubit QFT circuit.', category: 'Mathematical Transforms', solution: 'qft', isAuto: false },
        { id: 'quest-iqft-2q', title: '26. Inverse QFT (2-Qubit)', desc: 'Build a 2-qubit IQFT circuit.', category: 'Mathematical Transforms', solution: 'qft', isAuto: false },
        { id: 'quest-qpe-rot', title: '27. QPE Phase Rotation', desc: 'Run QPE on a T-gate rotation.', category: 'Mathematical Transforms', solution: 'qpe', isAuto: false },
        { id: 'quest-hhl-inv', title: '28. HHL Matrix Inversion', desc: 'Prep vectors for HHL system solver.', category: 'Mathematical Transforms', solution: 'hhl', isAuto: false },

        // Category 4: Quantum Protocols & Security
        { id: 'quest-bb84-rect', title: '29. BB84 Rectilinear', desc: 'Prepare and measure in rectilinear basis.', category: 'Quantum Protocols', solution: 'bb84', isAuto: false },
        { id: 'quest-bb84-diag', title: '30. BB84 Diagonal', desc: 'Prepare and measure in diagonal basis.', category: 'Quantum Protocols', solution: 'bb84', isAuto: false },
        { id: 'quest-bb84-eve', title: '31. BB84 Eavesdropper', desc: 'Intercept, measure, and re-send diagonal state.', category: 'Quantum Protocols', solution: 'bb84', isAuto: false },
        { id: 'quest-superdense-00', title: '32. Superdense Encoding (00)', desc: 'Encode bits "00" into a Bell pair.', category: 'Quantum Protocols', solution: 'superdense', isAuto: false },
        { id: 'quest-superdense-01', title: '33. Superdense Encoding (01)', desc: 'Encode bits "01" into a Bell pair.', category: 'Quantum Protocols', solution: 'superdense', isAuto: false },
        { id: 'quest-superdense-10', title: '34. Superdense Encoding (10)', desc: 'Encode bits "10" into a Bell pair.', category: 'Quantum Protocols', solution: 'superdense', isAuto: false },
        { id: 'quest-superdense-11', title: '35. Superdense Encoding (11)', desc: 'Encode bits "11" into a Bell pair.', category: 'Quantum Protocols', solution: 'superdense', isAuto: false },

        // Category 5: Advanced Simulation & Optimization
        { id: 'quest-trotter-xx', title: '36. Trotter Step (XX)', desc: 'Simulate XX interaction for 1 step.', category: 'Advanced Simulation', solution: 'trotter', isAuto: false },
        { id: 'quest-trotter-zz', title: '37. Trotter Step (ZZ)', desc: 'Simulate ZZ interaction for 1 step.', category: 'Advanced Simulation', solution: 'trotter', isAuto: false },
        { id: 'quest-amp-decay', title: '38. Amplitude Decay', desc: 'Model noise-like decay on Bloch sphere.', category: 'Advanced Simulation', solution: 'vqe', isAuto: false },
        { id: 'quest-phase-decay', title: '39. Phase Decay', desc: 'Model dephasing using auxiliary qubits.', category: 'Advanced Simulation', solution: 'vqe', isAuto: false },
        { id: 'quest-qwalk-step', title: '40. Quantum Walk Step', desc: 'Implement one discrete quantum walk step.', category: 'Advanced Simulation', solution: 'walks', isAuto: false },
        { id: 'quest-vqe-ansatz', title: '41. VQE Ansatz Prep', desc: 'Build ansatz circuit for VQE.', category: 'Advanced Simulation', solution: 'vqe', isAuto: false },
        { id: 'quest-qaoa-cost', title: '42. QAOA Cost Unitary', desc: 'Apply cost unitary for Max-Cut problem.', category: 'Advanced Simulation', solution: 'qaoa', isAuto: false },
        { id: 'quest-qaoa-mixer', title: '43. QAOA Mixer Unitary', desc: 'Apply the mixer unitary layer.', category: 'Advanced Simulation', solution: 'qaoa', isAuto: false },
        { id: 'quest-qsvm-feature', title: '44. QSVM Feature Map', desc: 'Map classical data into quantum states.', category: 'Advanced Simulation', solution: 'qsvm', isAuto: false },
        { id: 'quest-qpca-swap', title: '45. QPCA Swap Test', desc: 'Perform Swap Test to check state overlap.', category: 'Advanced Simulation', solution: 'qpca', isAuto: false },
        { id: 'quest-t-gate-phase', title: '46. T Gate Phase Rotation', desc: 'Verify 45-degree rotation on Bloch Sphere.', category: 'Fundamentals', solution: 't-gate-phase', isAuto: false },
        { id: 'quest-s-gate-phase', title: '47. S Gate Phase Rotation', desc: 'Verify 90-degree rotation on Bloch Sphere.', category: 'Fundamentals', solution: 's-gate-phase', isAuto: false },
        { id: 'quest-t-dagger-alt', title: '48. T-dagger Alternative', desc: 'Prep |+⟩, apply T seven times to model T†.', category: 'Fundamentals', solution: 't-dagger-alt', isAuto: false },
        { id: 'quest-identity-gate', title: '49. Identity Gate (I)', desc: 'Verify applying Identity leaves qubit unchanged.', category: 'Fundamentals', solution: 'identity-gate', isAuto: false },
        { id: 'quest-w-state', title: '50. W-State Prep', desc: 'Entangle 3 qubits such that only one is |1⟩.', category: 'Fundamentals', solution: 'w-state', isAuto: false }
    ];

    let completedQuests = new Set();
    try {
        const saved = localStorage.getItem('completed_quests');
        if (saved) {
            completedQuests = new Set(JSON.parse(saved));
        }
    } catch (e) {
        console.warn('Failed to load completed quests from localStorage', e);
    }

    function saveCompletedQuests() {
        try {
            localStorage.setItem('completed_quests', JSON.stringify([...completedQuests]));
        } catch (e) {
            console.warn('Failed to save completed quests to localStorage', e);
        }
    }

    // --- DOM Elements ---
    const resetBtn = document.getElementById('btn-reset');
    const blochCoords = {
        x: document.getElementById('coord-x'),
        y: document.getElementById('coord-y'),
        z: document.getElementById('coord-z')
    };
    const stateAnalysisGrid = document.getElementById('state-analysis-grid');
    const codeOutput = document.getElementById('code-output');
    const copyCodeBtn = document.getElementById('btn-copy-code');
    const tabQiskit = document.getElementById('tab-qiskit');
    const tabQasm = document.getElementById('tab-qasm');

    // --- Initialize ---
    window.addEventListener('DOMContentLoaded', () => {
        // 1. Setup Bloch Sphere
        const canvas = document.getElementById('bloch-canvas');
        blochSphere = new BlochSphere(canvas);

        // 2. Setup Circuit Editor
        const board = document.getElementById('circuit-board');
        editor = new CircuitEditor(board, 3, 12, onCircuitChange);

        // 3. Setup Drag Toolbox items
        setupToolbox();

        // 4. Setup Event Listeners
        setupEventListeners();

        // Populate quests panel dynamically
        renderQuestsUI();

        // Initialize Bloch sphere qubit selector UI
        updateQubitSelectorUI(editor.numQubits);

        // 5. Run Initial Simulation
        onCircuitChange(editor.grid);
    });

    function setupToolbox() {
        const draggableGates = document.querySelectorAll('.gate-draggable');
        draggableGates.forEach(gate => {
            gate.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', gate.dataset.gate);
                e.dataTransfer.effectAllowed = 'copy';
            });
        });
    }

    function setupEventListeners() {
        // Qubit selector for Bloch Sphere (using event delegation for dynamically created elements)
        const qubitSelectorContainer = document.querySelector('.qubit-selector');
        if (qubitSelectorContainer) {
            qubitSelectorContainer.addEventListener('change', (e) => {
                if (e.target.name === 'bloch-qubit') {
                    selectedQubit = parseInt(e.target.value);
                    updateBlochSphereDisplay();
                }
            });
        }

        // Qubit selector dropdown
        const qubitSelect = document.getElementById('select-qubits');
        if (qubitSelect) {
            qubitSelect.addEventListener('change', (e) => {
                const numQubits = parseInt(e.target.value);
                editor.setNumQubits(numQubits);
                updateQubitSelectorUI(numQubits);
            });
        }

        // Reset Button
        resetBtn.addEventListener('click', () => {
            isEditingCode = false;
            editor.clearGrid();
        });

        // Preset algorithms dropdown load
        const selectPreset = document.getElementById('select-preset');
        if (selectPreset) {
            selectPreset.addEventListener('change', () => {
                const presetName = selectPreset.value;
                if (presetName) {
                    loadPreset(presetName);
                }
            });
        }

        // Tabs
        tabQiskit.addEventListener('click', () => setTab('qiskit'));
        tabQasm.addEventListener('click', () => setTab('qasm'));

        // Copy Code
        copyCodeBtn.addEventListener('click', copyCodeToClipboard);

        // Listen for canvas resizing
        window.addEventListener('resize', () => {
            if (blochSphere) blochSphere.resize();
        });

        // Code editor manual editing
        if (codeOutput) {
            codeOutput.addEventListener('input', () => {
                isEditingCode = true;
                parseCodeToCircuit(codeOutput.value);
            });
            codeOutput.addEventListener('blur', () => {
                isEditingCode = false;
                updateCodeExport();
            });
        }

        // Reset editing state on visual editor interaction
        const board = document.getElementById('circuit-board');
        if (board) {
            board.addEventListener('mousedown', () => {
                isEditingCode = false;
            });
        }

        // Quest dropdown selector change
        const selectQuest = document.getElementById('select-quest');
        if (selectQuest) {
            selectQuest.addEventListener('change', () => {
                currentSelectedQuestId = selectQuest.value;
                updateActiveQuestPanel();
            });
        }

        // Active Quest Details card interactions (toggle checkmark, load solution)
        const activeQuestContainer = document.getElementById('active-quest-container');
        if (activeQuestContainer) {
            activeQuestContainer.addEventListener('click', (e) => {
                // Check if solution button clicked
                const btn = e.target.closest('#active-quest-solution-btn');
                if (btn) {
                    loadQuestSolution(currentSelectedQuestId);
                    return;
                }
                
                // Toggle completion if clicking the circle checkbox or details area
                const toggleArea = e.target.closest('.quest-status-icon') || e.target.closest('.quest-details');
                if (toggleArea) {
                    toggleQuestCompletion(currentSelectedQuestId);
                }
            });
        }
    }

    function setTab(tab) {
        activeTab = tab;
        tabQiskit.classList.toggle('active', tab === 'qiskit');
        tabQasm.classList.toggle('active', tab === 'qasm');
        updateCodeExport();
    }

    // --- Preset Algorithms Library ---
    function loadPreset(name) {
        const presetGrids = {
            bell: [
                [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 1 }, null, null, null, null, null, null, null, null, null, null],
                [null, { type: 'CNOT_TGT', partner: 0 }, null, null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null]
            ],
            teleportation: [
                [{ type: 'X' }, { type: 'H' }, { type: 'S' }, { type: 'CNOT_CTRL', partner: 1 }, { type: 'H' }, null, { type: 'CZ_CTRL', partner: 2 }, null, null, null, null, null],
                [null, null, { type: 'H' }, { type: 'CNOT_CTRL', partner: 2 }, { type: 'CNOT_TGT', partner: 0 }, { type: 'CNOT_CTRL', partner: 2 }, null, null, null, null, null, null],
                [null, null, null, { type: 'CNOT_TGT', partner: 1 }, null, { type: 'CNOT_TGT', partner: 1 }, { type: 'CZ_TGT', partner: 0 }, null, null, null, null, null]
            ],
            deutsch: [
                [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 1 }, { type: 'H' }, { type: 'MEASURE' }, null, null, null, null, null, null, null, null],
                [{ type: 'X' }, { type: 'H' }, { type: 'CNOT_TGT', partner: 0 }, { type: 'H' }, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null]
            ],
            deutsch_jozsa: [
                [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 2 }, { type: 'H' }, { type: 'MEASURE' }, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 2 }, { type: 'H' }, { type: 'MEASURE' }, null, null, null, null, null, null, null, null],
                [{ type: 'X' }, { type: 'H' }, { type: 'CNOT_TGT', partner: 0 }, { type: 'CNOT_TGT', partner: 1 }, { type: 'H' }, null, null, null, null, null, null, null]
            ],
            superdense: [
                [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 1 }, { type: 'X' }, { type: 'Z' }, { type: 'CNOT_CTRL', partner: 1 }, { type: 'H' }, { type: 'MEASURE' }, null, null, null, null, null],
                [null, { type: 'CNOT_TGT', partner: 0 }, null, null, { type: 'CNOT_TGT', partner: 0 }, null, { type: 'MEASURE' }, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null]
            ],
            bb84: [
                [{ type: 'X' }, { type: 'H' }, null, null, null, null, null, null, null, null, null, null],
                [null, { type: 'H' }, { type: 'MEASURE' }, null, null, null, null, null, null, null, null, null]
            ],
            bernstein_vazirani: [
                [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 2 }, { type: 'H' }, { type: 'MEASURE' }, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 2 }, { type: 'H' }, { type: 'MEASURE' }, null, null, null, null, null, null, null, null],
                [{ type: 'X' }, { type: 'H' }, { type: 'CNOT_TGT', partner: 0 }, { type: 'CNOT_TGT', partner: 1 }, { type: 'H' }, null, null, null, null, null, null, null]
            ],
            simon: [
                [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 2 }, { type: 'H' }, { type: 'MEASURE' }, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, null, { type: 'H' }, { type: 'MEASURE' }, null, null, null, null, null, null, null, null],
                [null, { type: 'CNOT_TGT', partner: 0 }, null, null, null, null, null, null, null, null, null, null]
            ],
            grover: [
                [{ type: 'H' }, { type: 'CZ_CTRL', partner: 2 }, { type: 'H' }, { type: 'X' }, { type: 'CZ_CTRL', partner: 1 }, { type: 'X' }, { type: 'H' }, null, null, null, null, null],
                [{ type: 'H' }, { type: 'CZ_CTRL', partner: 2 }, { type: 'H' }, { type: 'X' }, { type: 'CZ_TGT', partner: 0 }, { type: 'X' }, { type: 'H' }, null, null, null, null, null],
                [{ type: 'H' }, { type: 'CZ_TGT', partner: 0 }, { type: 'H' }, { type: 'X' }, { type: 'CZ_TGT', partner: 1 }, { type: 'X' }, { type: 'H' }, null, null, null, null, null]
            ],
            shor: [
                [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 3 }, null, null, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 4 }, null, null, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, null, null, null, null, null, null, null, null, null, null, null],
                [null, { type: 'CNOT_TGT', partner: 0 }, { type: 'SWAP', partner: 4 }, null, null, null, null, null, null, null, null, null],
                [null, { type: 'CNOT_TGT', partner: 1 }, { type: 'SWAP', partner: 3 }, null, null, null, null, null, null, null, null, null]
            ],
            qft: [
                [{ type: 'H' }, { type: 'CZ_CTRL', partner: 1 }, { type: 'CZ_CTRL', partner: 2 }, { type: 'SWAP', partner: 2 }, null, null, null, null, null, null, null, null],
                [null, { type: 'CZ_TGT', partner: 0 }, { type: 'H' }, { type: 'CZ_CTRL', partner: 2 }, null, null, null, null, null, null, null, null],
                [null, null, { type: 'CZ_TGT', partner: 0 }, { type: 'CZ_TGT', partner: 1 }, { type: 'H' }, { type: 'SWAP', partner: 0 }, null, null, null, null, null, null]
            ],
            qpe: [
                [{ type: 'H' }, { type: 'CZ_CTRL', partner: 2 }, { type: 'H' }, { type: 'CZ_CTRL', partner: 1 }, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, null, { type: 'CZ_CTRL', partner: 2 }, { type: 'CZ_TGT', partner: 0 }, { type: 'H' }, null, null, null, null, null, null, null],
                [{ type: 'X' }, null, null, null, null, null, null, null, null, null, null, null]
            ],
            hhl: [
                [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 2 }, null, null, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'CZ_CTRL', partner: 2 }, null, null, null, null, null, null, null, null, null, null],
                [{ type: 'X' }, { type: 'H' }, { type: 'CNOT_TGT', partner: 0 }, { type: 'CZ_TGT', partner: 1 }, { type: 'H' }, null, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'CZ_CTRL', partner: 2 }, { type: 'H' }, null, null, null, null, null, null, null, null, null]
            ],
            vqe: [
                [{ type: 'H' }, { type: 'S' }, { type: 'CNOT_CTRL', partner: 1 }, { type: 'T' }, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'T' }, { type: 'CNOT_TGT', partner: 0 }, { type: 'CNOT_CTRL', partner: 2 }, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'S' }, null, { type: 'CNOT_TGT', partner: 1 }, null, null, null, null, null, null, null, null]
            ],
            qaoa: [
                [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 1 }, { type: 'Z' }, { type: 'CNOT_TGT', partner: 1 }, { type: 'H' }, { type: 'S' }, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'CNOT_TGT', partner: 0 }, { type: 'CNOT_CTRL', partner: 2 }, { type: 'Z' }, { type: 'CNOT_TGT', partner: 2 }, { type: 'H' }, { type: 'T' }, null, null, null, null, null],
                [{ type: 'H' }, null, { type: 'CNOT_TGT', partner: 1 }, null, null, { type: 'H' }, { type: 'S' }, null, null, null, null, null]
            ],
            walks: [
                [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 1 }, { type: 'CZ_CTRL', partner: 2 }, null, null, null, null, null, null, null, null, null],
                [null, { type: 'CNOT_TGT', partner: 0 }, { type: 'SWAP', partner: 2 }, null, null, null, null, null, null, null, null, null],
                [null, null, { type: 'CZ_TGT', partner: 0 }, { type: 'SWAP', partner: 1 }, null, null, null, null, null, null, null, null]
            ],
            amp_amp: [
                [{ type: 'H' }, { type: 'X' }, { type: 'CZ_CTRL', partner: 1 }, { type: 'X' }, { type: 'H' }, { type: 'CNOT_CTRL', partner: 2 }, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'X' }, { type: 'CZ_TGT', partner: 0 }, { type: 'X' }, { type: 'H' }, { type: 'CNOT_TGT', partner: 2 }, null, null, null, null, null, null],
                [{ type: 'H' }, null, null, null, null, { type: 'CNOT_TGT', partner: 0 }, { type: 'H' }, null, null, null, null, null]
            ],
            amp_est: [
                [{ type: 'H' }, { type: 'CZ_CTRL', partner: 3 }, { type: 'H' }, null, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'CZ_CTRL', partner: 3 }, { type: 'H' }, { type: 'CZ_CTRL', partner: 0 }, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'CZ_CTRL', partner: 3 }, { type: 'H' }, { type: 'SWAP', partner: 0 }, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'X' }, null, null, null, null, null, null, null, null, null, null]
            ],
            counting: [
                [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 3 }, null, null, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'CZ_CTRL', partner: 3 }, null, null, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'SWAP', partner: 3 }, null, null, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'X' }, { type: 'CNOT_TGT', partner: 0 }, { type: 'CZ_TGT', partner: 1 }, { type: 'SWAP', partner: 2 }, null, null, null, null, null, null, null]
            ],
            annealing: [
                [{ type: 'H' }, { type: 'CZ_CTRL', partner: 1 }, { type: 'H' }, { type: 'X' }, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'CZ_TGT', partner: 0 }, { type: 'CZ_CTRL', partner: 2 }, { type: 'H' }, { type: 'X' }, null, null, null, null, null, null, null],
                [{ type: 'H' }, null, { type: 'CZ_TGT', partner: 1 }, { type: 'H' }, { type: 'X' }, null, null, null, null, null, null, null]
            ],
            qabc: [
                [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 1 }, { type: 'MEASURE' }, null, null, null, null, null, null, null, null, null],
                [null, { type: 'CNOT_TGT', partner: 0 }, { type: 'CNOT_CTRL', partner: 2 }, null, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, null, { type: 'CNOT_TGT', partner: 1 }, { type: 'MEASURE' }, null, null, null, null, null, null, null, null]
            ],
            qsvm: [
                [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 1 }, { type: 'H' }, { type: 'MEASURE' }, null, null, null, null, null, null, null, null],
                [{ type: 'X' }, { type: 'CNOT_TGT', partner: 0 }, { type: 'SWAP', partner: 2 }, null, null, null, null, null, null, null, null, null],
                [{ type: 'H' }, { type: 'S' }, { type: 'SWAP', partner: 1 }, null, null, null, null, null, null, null, null, null]
            ],
            qpca: [
                [{ type: 'H' }, { type: 'SWAP', partner: 1 }, null, null, null, null, null, null, null, null, null, null],
                [null, { type: 'SWAP', partner: 0 }, { type: 'CNOT_CTRL', partner: 2 }, null, null, null, null, null, null, null, null, null],
                [null, null, { type: 'CNOT_TGT', partner: 1 }, { type: 'SWAP', partner: 3 }, null, null, null, null, null, null, null, null],
                [null, null, null, { type: 'SWAP', partner: 2 }, null, null, null, null, null, null, null, null]
            ],
            trotter: [
                [{ type: 'CNOT_CTRL', partner: 1 }, { type: 'Z' }, { type: 'CNOT_TGT', partner: 1 }, null, null, null, null, null, null, null, null, null],
                [{ type: 'CNOT_TGT', partner: 0 }, { type: 'CNOT_CTRL', partner: 2 }, { type: 'Z' }, { type: 'CNOT_TGT', partner: 2 }, null, null, null, null, null, null, null, null],
                [null, { type: 'CNOT_TGT', partner: 1 }, null, null, null, null, null, null, null, null, null, null]
            ]
        };

        if (presetGrids[name]) {
            isEditingCode = false;
            const requiredQubits = presetGrids[name].length;
            
            // Auto-scale editor if current qubit count is less than the preset's requirements
            if (editor.numQubits < requiredQubits) {
                const qubitSelect = document.getElementById('select-qubits');
                if (qubitSelect) {
                    qubitSelect.value = requiredQubits.toString();
                }
                editor.setNumQubits(requiredQubits);
                updateQubitSelectorUI(requiredQubits);
            }
            editor.loadCircuit(presetGrids[name]);
        }
    }

    // --- Quest Solutions ---
    const questSolutions = {
        'quest-superposition': [
            [{ type: 'H' }, null, null, null, null, null, null, null, null, null, null, null]
        ],
        'quest-entangle': [
            [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 1 }, null, null, null, null, null, null, null, null, null, null],
            [null, { type: 'CNOT_TGT', partner: 0 }, null, null, null, null, null, null, null, null, null, null]
        ],
        'quest-phase': [
            [{ type: 'H' }, { type: 'S' }, null, null, null, null, null, null, null, null, null, null]
        ],
        'quest-teleport': [
            [{ type: 'X' }, { type: 'H' }, { type: 'S' }, { type: 'CNOT_CTRL', partner: 1 }, { type: 'H' }, null, { type: 'CZ_CTRL', partner: 2 }, null, null, null, null, null],
            [null, null, { type: 'H' }, { type: 'CNOT_CTRL', partner: 2 }, { type: 'CNOT_TGT', partner: 0 }, { type: 'CNOT_CTRL', partner: 2 }, null, null, null, null, null, null],
            [null, null, null, { type: 'CNOT_TGT', partner: 1 }, null, { type: 'CNOT_TGT', partner: 1 }, { type: 'CZ_TGT', partner: 0 }, null, null, null, null, null]
        ],
        'quest-pauli': [
            [{ type: 'X' }, null, null, null, null, null, null, null, null, null, null, null],
            [{ type: 'X' }, { type: 'H' }, null, null, null, null, null, null, null, null, null, null]
        ],
        'quest-ghz': [
            [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 1 }, null, null, null, null, null, null, null, null, null, null],
            [null, { type: 'CNOT_TGT', partner: 0 }, { type: 'CNOT_CTRL', partner: 2 }, null, null, null, null, null, null, null, null, null],
            [null, null, { type: 'CNOT_TGT', partner: 1 }, null, null, null, null, null, null, null, null, null]
        ],
        'quest-swap': [
            [{ type: 'X' }, { type: 'SWAP', partner: 1 }, null, null, null, null, null, null, null, null, null, null],
            [null, { type: 'SWAP', partner: 0 }, null, null, null, null, null, null, null, null, null, null]
        ],
        'quest-double-h': [
            [{ type: 'H' }, { type: 'H' }, null, null, null, null, null, null, null, null, null, null]
        ],
        'quest-phase-flip': [
            [{ type: 'H' }, { type: 'Z' }, null, null, null, null, null, null, null, null, null, null]
        ],
        'quest-state1': [
            [{ type: 'X' }, null, null, null, null, null, null, null, null, null, null, null]
        ],
        'quest-state-minus': [
            [{ type: 'H' }, null, null, null, null, null, null, null, null, null, null, null]
        ],
        'quest-state-plus-i': [
            [{ type: 'H' }, { type: 'S' }, null, null, null, null, null, null, null, null, null, null]
        ],
        'quest-state-minus-i': [
            [{ type: 'H' }, { type: 'S' }, { type: 'Z' }, null, null, null, null, null, null, null, null, null]
        ],
        'quest-cz-test': [
            [{ type: 'H' }, { type: 'CZ_CTRL', partner: 1 }, null, null, null, null, null, null, null, null, null, null],
            [{ type: 'H' }, { type: 'CZ_TGT', partner: 0 }, null, null, null, null, null, null, null, null, null, null]
        ],
        'quest-h-z-h': [
            [{ type: 'H' }, { type: 'Z' }, { type: 'H' }, null, null, null, null, null, null, null, null, null]
        ],
        'quest-t-gate-phase': [
            [{ type: 'H' }, { type: 'T' }, null, null, null, null, null, null, null, null, null, null]
        ],
        'quest-s-gate-phase': [
            [{ type: 'H' }, { type: 'S' }, null, null, null, null, null, null, null, null, null, null]
        ],
        'quest-t-dagger-alt': [
            [{ type: 'H' }, { type: 'T' }, { type: 'T' }, { type: 'T' }, { type: 'T' }, { type: 'T' }, { type: 'T' }, { type: 'T' }, null, null, null, null]
        ],
        'quest-identity-gate': [
            [{ type: 'H' }, null, null, null, null, null, null, null, null, null, null, null]
        ],
        'quest-w-state': [
            [{ type: 'H' }, { type: 'CNOT_CTRL', partner: 1 }, null, null, null, null, null, null, null, null, null, null],
            [null, { type: 'CNOT_TGT', partner: 0 }, { type: 'H' }, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null]
        ]
    };

    function loadQuestSolution(questId) {
        isEditingCode = false;
        let gridToLoad = questSolutions[questId];
        
        if (!gridToLoad) {
            // Find quest object in our list of 50
            const q = sandboxQuests.find(quest => quest.id === questId);
            if (q && q.solution) {
                loadPreset(q.solution);
                return;
            }
        }
        
        if (gridToLoad) {
            const requiredQubits = gridToLoad.length;
            
            // Auto-scale editor if current qubit count is less than the quest's requirements
            if (editor.numQubits < requiredQubits) {
                const qubitSelect = document.getElementById('select-qubits');
                if (qubitSelect) {
                    qubitSelect.value = requiredQubits.toString();
                }
                editor.setNumQubits(requiredQubits);
                updateQubitSelectorUI(requiredQubits);
            }
            editor.loadCircuit(gridToLoad);
        }
    }

    // --- Simulation Trigger ---
    function onCircuitChange(grid) {
        currentGrid = grid;
        
        // 1. Create fresh state vector
        const state = new QuantumState(editor.numQubits);
        
        // Track applied gates to avoid double multi-qubit runs in one column
        for (let col = 0; col < editor.numCols; col++) {
            const processed = new Set();
            
            // First pass: apply single qubit gates
            for (let q = 0; q < editor.numQubits; q++) {
                const gate = grid[q][col];
                if (gate && !gate.type.includes('_')) {
                    if (['H', 'X', 'Y', 'Z', 'S', 'T'].includes(gate.type)) {
                        state.applyGate(Gates[gate.type], q);
                    } else if (['RX', 'RY', 'RZ'].includes(gate.type)) {
                        const key = gate.type.charAt(0) + gate.type.slice(1).toLowerCase();
                        const rotMatrix = Gates[key](gate.angle || 0);
                        state.applyGate(rotMatrix, q);
                    } else if (gate.type === 'MEASURE') {
                        state.measure(q);
                    }
                }
            }

            // Second pass: apply multi-qubit gates
            for (let q = 0; q < editor.numQubits; q++) {
                const gate = grid[q][col];
                if (gate && !processed.has(q)) {
                    if (gate.partner !== undefined) {
                        if (gate.type === 'CNOT_CTRL') {
                            state.applyControlledGate(Gates.X, q, gate.partner);
                            processed.add(q);
                            processed.add(gate.partner);
                        } else if (gate.type === 'CZ_CTRL') {
                            state.applyControlledGate(Gates.Z, q, gate.partner);
                            processed.add(q);
                            processed.add(gate.partner);
                        } else if (gate.type === 'SWAP') {
                            // Ensure we only SWAP once
                            if (q < gate.partner) {
                                state.applySwap(q, gate.partner);
                            }
                            processed.add(q);
                            processed.add(gate.partner);
                        }
                    } else if (gate.partners !== undefined && gate.type === 'CCNOT_TGT') {
                        const ctrl1 = gate.partners[0];
                        const ctrl2 = gate.partners[1];
                        state.applyDoubleControlledGate(Gates.X, ctrl1, ctrl2, q);
                        processed.add(q);
                        processed.add(ctrl1);
                        processed.add(ctrl2);
                    }
                }
            }
        }

        lastSimulatedState = state;

        // 2. Update UI
        updateBlochSphereDisplay();
        updateStateVectorAnalysis();
        updateCodeExport();
        checkQuests();
    }

    // --- UI Update Functions ---
    function updateQubitSelectorUI(numQubits) {
        const container = document.querySelector('.qubit-selector');
        if (!container) return;
        container.innerHTML = '';

        const subscripts = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

        for (let q = 0; q < numQubits; q++) {
            const label = document.createElement('label');
            label.classList.add('radio-label');

            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'bloch-qubit';
            input.value = q;
            if (q === selectedQubit) {
                input.checked = true;
            }

            const span = document.createElement('span');
            span.innerHTML = `q${subscripts[q] || q}`;

            label.appendChild(input);
            label.appendChild(span);
            container.appendChild(label);
        }

        // Guard selectedQubit range
        if (selectedQubit >= numQubits) {
            selectedQubit = 0;
            const firstInput = container.querySelector('input[name="bloch-qubit"]');
            if (firstInput) firstInput.checked = true;
        }
    }

    function updateBlochSphereDisplay() {
        if (!lastSimulatedState || !blochSphere) return;

        const vec = lastSimulatedState.getBlochVector(selectedQubit);
        blochSphere.setVector(vec.x, vec.y, vec.z);

        // Update coordinates label
        blochCoords.x.textContent = vec.x.toFixed(2);
        blochCoords.y.textContent = vec.y.toFixed(2);
        blochCoords.z.textContent = vec.z.toFixed(2);
    }

    function updateStateVectorAnalysis() {
        if (!lastSimulatedState || !stateAnalysisGrid) return;

        const probs = lastSimulatedState.getProbabilities();
        stateAnalysisGrid.innerHTML = '';

        for (let i = 0; i < lastSimulatedState.dim; i++) {
            // Label in binary matching computational basis (e.g. |010>)
            const binary = i.toString(2).padStart(editor.numQubits, '0');
            const amp = lastSimulatedState.statevector[i];
            const prob = probs[i];
            const phaseVal = Complex.phase(amp); // in radians

            // Create container card
            const item = document.createElement('div');
            item.classList.add('state-item');

            // Label
            const lbl = document.createElement('span');
            lbl.classList.add('state-lbl-label');
            lbl.innerHTML = `|${binary}⟩`;
            item.appendChild(lbl);

            // Phasor circle representation
            const phasor = document.createElement('div');
            phasor.classList.add('phasor-container');

            // Glowing Amplitude Fill
            const fill = document.createElement('div');
            fill.classList.add('phasor-fill');
            // Size fill based on magnitude (amplitude = sqrt(prob))
            const size = Math.round(Math.sqrt(prob) * 44); // Max size inside 48px circle is 44px
            fill.style.width = `${size}px`;
            fill.style.height = `${size}px`;
            phasor.appendChild(fill);

            // Rotating hand representing phase angle
            const hand = document.createElement('div');
            hand.classList.add('phasor-hand');
            // Rotate matching angle (CSS rotation is clockwise, phase is counter-clockwise math-wise)
            // Match angle: 0 rad points straight up (-y direction)
            const deg = -phaseVal * (180 / Math.PI);
            hand.style.transform = `rotate(${deg}deg)`;
            
            const dot = document.createElement('div');
            dot.classList.add('phasor-dot');
            hand.appendChild(dot);
            
            phasor.appendChild(hand);
            item.appendChild(phasor);

            // Probability Value
            const val = document.createElement('span');
            val.classList.add('probability-value');
            val.textContent = `${(prob * 100).toFixed(0)}%`;
            item.appendChild(val);

            // Probability Bar indicator
            const barContainer = document.createElement('div');
            barContainer.classList.add('probability-bar-container');
            const bar = document.createElement('div');
            bar.classList.add('probability-bar');
            bar.style.width = `${prob * 100}%`;
            barContainer.appendChild(bar);
            item.appendChild(barContainer);

            stateAnalysisGrid.appendChild(item);
        }
    }

    function updateCodeExport() {
        if (!currentGrid || !codeOutput) return;

        // Skip auto-generation while the user is actively typing in the developer export pane
        if (isEditingCode) return;

        let code = '';
        if (activeTab === 'qiskit') {
            code = generateQiskitCode();
        } else {
            code = generateQasmCode();
        }
        codeOutput.value = code;
    }

    // --- Code Compiler / Parser Engine ---
    function parseCodeToCircuit(text) {
        const lines = text.split('\n');
        let numQubits = editor.numQubits; // default to current
        
        // 1. Detect number of qubits
        if (activeTab === 'qiskit') {
            for (const line of lines) {
                const match = line.match(/QuantumCircuit\(\s*(\d+)/);
                if (match) {
                    numQubits = parseInt(match[1]);
                    break;
                }
            }
        } else {
            for (const line of lines) {
                const match = line.match(/qreg\s+q\s*\[\s*(\d+)\s*\]\s*;/);
                if (match) {
                    numQubits = parseInt(match[1]);
                    break;
                }
            }
        }
        
        // Validate numQubits range (1 to 5)
        if (numQubits < 1) numQubits = 1;
        if (numQubits > 5) numQubits = 5;
        
        // Update selector UI and editor count if changed
        if (numQubits !== editor.numQubits) {
            editor.numQubits = numQubits;
            const qubitSelect = document.getElementById('select-qubits');
            if (qubitSelect) {
                qubitSelect.value = numQubits.toString();
            }
            updateQubitSelectorUI(numQubits);
        }
        
        // 2. Initialize empty grid
        const numCols = editor.numCols;
        const grid = Array.from({ length: numQubits }, () => Array(numCols).fill(null));
        
        // Helper to schedule gate
        function scheduleGate(gateType, qubits, extra = null) {
            // Validate all qubits are within bounds
            if (qubits.some(q => q >= numQubits)) return;
            
            let col = 0;
            for (; col < numCols; col++) {
                let free = true;
                for (const q of qubits) {
                    if (grid[q][col] !== null) {
                        free = false;
                        break;
                    }
                }
                if (free) break;
            }
            
            if (col < numCols) {
                if (qubits.length === 1) {
                    if (['RX', 'RY', 'RZ'].includes(gateType) && extra) {
                        grid[qubits[0]][col] = { type: gateType, angle: extra.angle, angleLabel: extra.angleLabel };
                    } else {
                        grid[qubits[0]][col] = { type: gateType };
                    }
                } else if (qubits.length === 2) {
                    const q0 = qubits[0];
                    const q1 = qubits[1];
                    if (gateType === 'CNOT') {
                        grid[q0][col] = { type: 'CNOT_CTRL', partner: q1 };
                        grid[q1][col] = { type: 'CNOT_TGT', partner: q0 };
                    } else if (gateType === 'CZ') {
                        grid[q0][col] = { type: 'CZ_CTRL', partner: q1 };
                        grid[q1][col] = { type: 'CZ_TGT', partner: q0 };
                    } else if (gateType === 'SWAP') {
                        grid[q0][col] = { type: 'SWAP', partner: q1 };
                        grid[q1][col] = { type: 'SWAP', partner: q0 };
                    }
                } else if (qubits.length === 3 && gateType === 'CCNOT') {
                    const c1 = qubits[0];
                    const c2 = qubits[1];
                    const t = qubits[2];
                    grid[t][col] = { type: 'CCNOT_TGT', partners: [c1, c2] };
                    grid[c1][col] = { type: 'CCNOT_CTRL', partner: t };
                    grid[c2][col] = { type: 'CCNOT_CTRL', partner: t };
                }
            }
        }
        
        // Helper to parse angle strings from code
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

        // 3. Parse and schedule gates
        for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine || cleanLine.startsWith('#') || cleanLine.startsWith('//')) continue;
            
            if (activeTab === 'qiskit') {
                // Rotation gates: qc.rx(angle, qubit)
                let match = cleanLine.match(/qc\.(rx|ry|rz)\(\s*([^,]+)\s*,\s*(\d+)\s*\)/i);
                if (match) {
                    const gateName = match[1].toUpperCase();
                    const angleStr = match[2];
                    const qIdx = parseInt(match[3]);
                    const angleVal = parseAngle(angleStr);
                    scheduleGate(gateName, [qIdx], { angle: angleVal, angleLabel: angleStr });
                    continue;
                }

                // Single qubit gates
                match = cleanLine.match(/qc\.h\(\s*(\d+)\s*\)/);
                if (match) { scheduleGate('H', [parseInt(match[1])]); continue; }
                
                match = cleanLine.match(/qc\.x\(\s*(\d+)\s*\)/);
                if (match) { scheduleGate('X', [parseInt(match[1])]); continue; }
                
                match = cleanLine.match(/qc\.y\(\s*(\d+)\s*\)/);
                if (match) { scheduleGate('Y', [parseInt(match[1])]); continue; }
                
                match = cleanLine.match(/qc\.z\(\s*(\d+)\s*\)/);
                if (match) { scheduleGate('Z', [parseInt(match[1])]); continue; }
                
                match = cleanLine.match(/qc\.s\(\s*(\d+)\s*\)/);
                if (match) { scheduleGate('S', [parseInt(match[1])]); continue; }
                
                match = cleanLine.match(/qc\.t\(\s*(\d+)\s*\)/);
                if (match) { scheduleGate('T', [parseInt(match[1])]); continue; }
                
                match = cleanLine.match(/qc\.measure\(\s*(\d+)\s*,\s*\d+\s*\)/);
                if (match) { scheduleGate('MEASURE', [parseInt(match[1])]); continue; }
                
                // CCNOT (Toffoli): qc.ccx(ctrl1, ctrl2, target)
                match = cleanLine.match(/qc\.ccx\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
                if (match) {
                    scheduleGate('CCNOT', [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]);
                    continue;
                }

                // Multi qubit gates
                match = cleanLine.match(/qc\.cx\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
                if (match) { scheduleGate('CNOT', [parseInt(match[1]), parseInt(match[2])]); continue; }
                
                match = cleanLine.match(/qc\.cz\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
                if (match) { scheduleGate('CZ', [parseInt(match[1]), parseInt(match[2])]); continue; }
                
                match = cleanLine.match(/qc\.swap\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
                if (match) { scheduleGate('SWAP', [parseInt(match[1]), parseInt(match[2])]); continue; }
            } else {
                // OpenQASM
                // Rotation gates: rx(angle) q[qubit];
                let match = cleanLine.match(/^(rx|ry|rz)\(\s*([^)]+)\s*\)\s*q\s*\[\s*(\d+)\s*\]\s*;/i);
                if (match) {
                    const gateName = match[1].toUpperCase();
                    const angleStr = match[2];
                    const qIdx = parseInt(match[3]);
                    const angleVal = parseAngle(angleStr);
                    scheduleGate(gateName, [qIdx], { angle: angleVal, angleLabel: angleStr });
                    continue;
                }

                // Single qubit gates
                match = cleanLine.match(/^h\s+q\s*\[\s*(\d+)\s*\]\s*;/);
                if (match) { scheduleGate('H', [parseInt(match[1])]); continue; }
                
                match = cleanLine.match(/^x\s+q\s*\[\s*(\d+)\s*\]\s*;/);
                if (match) { scheduleGate('X', [parseInt(match[1])]); continue; }
                
                match = cleanLine.match(/^y\s+q\s*\[\s*(\d+)\s*\]\s*;/);
                if (match) { scheduleGate('Y', [parseInt(match[1])]); continue; }
                
                match = cleanLine.match(/^z\s+q\s*\[\s*(\d+)\s*\]\s*;/);
                if (match) { scheduleGate('Z', [parseInt(match[1])]); continue; }
                
                match = cleanLine.match(/^s\s+q\s*\[\s*(\d+)\s*\]\s*;/);
                if (match) { scheduleGate('S', [parseInt(match[1])]); continue; }
                
                match = cleanLine.match(/^t\s+q\s*\[\s*(\d+)\s*\]\s*;/);
                if (match) { scheduleGate('T', [parseInt(match[1])]); continue; }
                
                match = cleanLine.match(/^measure\s+q\s*\[\s*(\d+)\s*\]\s*->\s*c\s*\[\s*\d+\s*\]\s*;/);
                if (match) { scheduleGate('MEASURE', [parseInt(match[1])]); continue; }
                
                // CCNOT (Toffoli): ccx q[ctrl1], q[ctrl2], q[target];
                match = cleanLine.match(/^ccx\s+q\s*\[\s*(\d+)\s*\]\s*,\s*q\s*\[\s*(\d+)\s*\]\s*,\s*q\s*\[\s*(\d+)\s*\]\s*;/);
                if (match) {
                    scheduleGate('CCNOT', [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]);
                    continue;
                }

                // Multi qubit gates
                match = cleanLine.match(/^cx\s+q\s*\[\s*(\d+)\s*\]\s*,\s*q\s*\[\s*(\d+)\s*\]\s*;/);
                if (match) { scheduleGate('CNOT', [parseInt(match[1]), parseInt(match[2])]); continue; }
                
                match = cleanLine.match(/^cz\s+q\s*\[\s*(\d+)\s*\]\s*,\s*q\s*\[\s*(\d+)\s*\]\s*;/);
                if (match) { scheduleGate('CZ', [parseInt(match[1]), parseInt(match[2])]); continue; }
                
                match = cleanLine.match(/^swap\s+q\s*\[\s*(\d+)\s*\]\s*,\s*q\s*\[\s*(\d+)\s*\]\s*;/);
                if (match) { scheduleGate('SWAP', [parseInt(match[1]), parseInt(match[2])]); continue; }
            }
        }
        
        // 4. Update the editor's grid and re-render visual elements
        editor.grid = grid;
        editor.initDOM();
        editor.renderGates();
        
        // 5. Run simulation and update UI
        onCircuitChange(grid);
    }

    function generateQiskitCode() {
        let code = `from qiskit import QuantumCircuit\n\n`;
        code += `# Initialize quantum circuit with ${editor.numQubits} qubits and ${editor.numQubits} classical bits\n`;
        code += `qc = QuantumCircuit(${editor.numQubits}, ${editor.numQubits})\n\n`;

        for (let col = 0; col < editor.numCols; col++) {
            const processed = new Set();
            
            // Single Qubit Gates
            for (let q = 0; q < editor.numQubits; q++) {
                const gate = currentGrid[q][col];
                if (gate && !gate.type.includes('_')) {
                    if (gate.type === 'MEASURE') {
                        code += `qc.measure(${q}, ${q})\n`;
                    } else if (['RX', 'RY', 'RZ'].includes(gate.type)) {
                        const angleVal = gate.angleLabel || (gate.angle !== undefined ? gate.angle.toString() : '0');
                        code += `qc.${gate.type.toLowerCase()}(${angleVal}, ${q})\n`;
                    } else {
                        code += `qc.${gate.type.toLowerCase()}(${q})\n`;
                    }
                }
            }

            // Multi Qubit Gates
            for (let q = 0; q < editor.numQubits; q++) {
                const gate = currentGrid[q][col];
                if (gate && !processed.has(q)) {
                    if (gate.partner !== undefined) {
                        if (gate.type === 'CNOT_CTRL') {
                            code += `qc.cx(${q}, ${gate.partner})\n`;
                            processed.add(q);
                            processed.add(gate.partner);
                        } else if (gate.type === 'CZ_CTRL') {
                            code += `qc.cz(${q}, ${gate.partner})\n`;
                            processed.add(q);
                            processed.add(gate.partner);
                        } else if (gate.type === 'SWAP' && q < gate.partner) {
                            code += `qc.swap(${q}, ${gate.partner})\n`;
                            processed.add(q);
                            processed.add(gate.partner);
                        }
                    } else if (gate.partners !== undefined && gate.type === 'CCNOT_TGT') {
                        const ctrl1 = gate.partners[0];
                        const ctrl2 = gate.partners[1];
                        code += `qc.ccx(${ctrl1}, ${ctrl2}, ${q})\n`;
                        processed.add(q);
                        processed.add(ctrl1);
                        processed.add(ctrl2);
                    }
                }
            }
        }
        
        code += `\n# Draw the circuit\nprint(qc.draw(output='text'))`;
        return code;
    }

    function generateQasmCode() {
        let code = `OPENQASM 2.0;\n`;
        code += `include "qelib1.inc";\n\n`;
        code += `qreg q[${editor.numQubits}];\n`;
        code += `creg c[${editor.numQubits}];\n\n`;

        for (let col = 0; col < editor.numCols; col++) {
            const processed = new Set();
            
            // Single Qubit Gates
            for (let q = 0; q < editor.numQubits; q++) {
                const gate = currentGrid[q][col];
                if (gate && !gate.type.includes('_')) {
                    if (gate.type === 'MEASURE') {
                        code += `measure q[${q}] -> c[${q}];\n`;
                    } else if (['RX', 'RY', 'RZ'].includes(gate.type)) {
                        const angleVal = gate.angleLabel || (gate.angle !== undefined ? gate.angle.toString() : '0');
                        code += `${gate.type.toLowerCase()}(${angleVal}) q[${q}];\n`;
                    } else if (gate.type === 'S') {
                        code += `s q[${q}];\n`;
                    } else if (gate.type === 'T') {
                        code += `t q[${q}];\n`;
                    } else {
                        code += `${gate.type.toLowerCase()} q[${q}];\n`;
                    }
                }
            }

            // Multi Qubit Gates
            for (let q = 0; q < editor.numQubits; q++) {
                const gate = currentGrid[q][col];
                if (gate && !processed.has(q)) {
                    if (gate.partner !== undefined) {
                        if (gate.type === 'CNOT_CTRL') {
                            code += `cx q[${q}], q[${gate.partner}];\n`;
                            processed.add(q);
                            processed.add(gate.partner);
                        } else if (gate.type === 'CZ_CTRL') {
                            code += `cz q[${q}], q[${gate.partner}];\n`;
                            processed.add(q);
                            processed.add(gate.partner);
                        } else if (gate.type === 'SWAP' && q < gate.partner) {
                            code += `swap q[${q}], q[${gate.partner}];\n`;
                            processed.add(q);
                            processed.add(gate.partner);
                        }
                    } else if (gate.partners !== undefined && gate.type === 'CCNOT_TGT') {
                        const ctrl1 = gate.partners[0];
                        const ctrl2 = gate.partners[1];
                        code += `ccx q[${ctrl1}], q[${ctrl2}], q[${q}];\n`;
                        processed.add(q);
                        processed.add(ctrl1);
                        processed.add(ctrl2);
                    }
                }
            }
        }
        return code;
    }

    function copyCodeToClipboard() {
        if (!codeOutput) return;
        const text = codeOutput.value;
        navigator.clipboard.writeText(text).then(() => {
            const icon = copyCodeBtn.querySelector('i');
            icon.className = 'fa-solid fa-check';
            icon.style.color = '#10b981';
            
            setTimeout(() => {
                icon.className = 'fa-regular fa-copy';
                icon.style.color = '';
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy code: ', err);
        });
    }

    // --- Quest Validation System ---
    function checkQuests() {
        if (!lastSimulatedState) return;

        // 1. Superposition Quest (qubit 0 in |+> state)
        // |+> vector is x=1, y=0, z=0
        const vec0 = lastSimulatedState.getBlochVector(0);
        const isSuperposition = Math.abs(vec0.x - 1.0) < 0.05 && Math.abs(vec0.y) < 0.05 && Math.abs(vec0.z) < 0.05;
        updateQuestStatus('quest-superposition', isSuperposition);

        // 2. Entanglement Quest (Bell state between q0 and q1)
        const probs = lastSimulatedState.getProbabilities();
        const isEntangled = editor.numQubits >= 2 && Math.abs(probs[0] - 0.5) < 0.05 && Math.abs(probs[3] - 0.5) < 0.05;
        updateQuestStatus('quest-entangle', isEntangled);

        // 3. Phase Quest (qubit 0 in |-i> state)
        // |-i> has x=0, y=-1, z=0
        const isPhaseRight = Math.abs(vec0.x) < 0.05 && Math.abs(vec0.y - (-1.0)) < 0.05 && Math.abs(vec0.z) < 0.05;
        updateQuestStatus('quest-phase', isPhaseRight);

        // 4. Teleportation Leap Quest (state from q0 is teleported to q2)
        let isTeleported = false;
        if (editor.numQubits >= 3) {
            let hasEntangledWire = false;
            let hasBellMeasurement = false;
            let hasCoherentCorrection = false;

            for (let col = 0; col < editor.numCols; col++) {
                const isH1 = currentGrid[1] && currentGrid[1][col] && currentGrid[1][col].type === 'H';
                if (!hasEntangledWire) {
                    if (isH1) {
                        for (let c2 = col + 1; c2 < editor.numCols; c2++) {
                            if (currentGrid[1][c2] && currentGrid[1][c2].type === 'CNOT_CTRL' && currentGrid[1][c2].partner === 2) {
                                hasEntangledWire = true;
                                break;
                            }
                        }
                    }
                }

                if (hasEntangledWire && !hasBellMeasurement) {
                    const isCnot01 = currentGrid[0][col] && currentGrid[0][col].type === 'CNOT_CTRL' && currentGrid[0][col].partner === 1;
                    if (isCnot01) {
                        for (let c2 = col + 1; c2 < editor.numCols; c2++) {
                            if (currentGrid[0][c2] && currentGrid[0][c2].type === 'H') {
                                hasBellMeasurement = true;
                                break;
                            }
                        }
                    }
                }

                if (hasBellMeasurement && !hasCoherentCorrection) {
                    const isCnot12_corr = currentGrid[1][col] && currentGrid[1][col].type === 'CNOT_CTRL' && currentGrid[1][col].partner === 2;
                    const isCz02_corr = currentGrid[0][col] && currentGrid[0][col].type === 'CZ_CTRL' && currentGrid[0][col].partner === 2;

                    if (isCnot12_corr || isCz02_corr) {
                        let cnotFound = false;
                        let czFound = false;
                        for (let c2 = col; c2 < editor.numCols; c2++) {
                            if (currentGrid[1][c2] && currentGrid[1][c2].type === 'CNOT_CTRL' && currentGrid[1][c2].partner === 2) cnotFound = true;
                            if (currentGrid[0][c2] && currentGrid[0][c2].type === 'CZ_CTRL' && currentGrid[0][c2].partner === 2) czFound = true;
                        }
                        if (cnotFound && czFound) {
                            hasCoherentCorrection = true;
                        }
                    }
                }
            }
            isTeleported = hasEntangledWire && hasBellMeasurement && hasCoherentCorrection;
        }
        updateQuestStatus('quest-teleport', isTeleported);

        // 5. Pauli Playground Quest (q₀ in |1⟩ and q₁ in |−⟩)
        const vec1 = editor.numQubits >= 2 ? lastSimulatedState.getBlochVector(1) : null;
        const isPauliPlayground = vec1 && 
                                  Math.abs(vec0.z - (-1.0)) < 0.05 && 
                                  Math.abs(vec1.x - (-1.0)) < 0.05 && 
                                  Math.abs(vec1.z) < 0.05;
        updateQuestStatus('quest-pauli', isPauliPlayground);

        // 6. GHZ State Quest (GHZ on q₀, q₁, q₂)
        const isGHZ = editor.numQubits >= 3 && 
                      Math.abs(probs[0] - 0.5) < 0.05 && 
                      Math.abs(probs[7] - 0.5) < 0.05;
        updateQuestStatus('quest-ghz', isGHZ);

        // 7. Swap Shop Quest (Swap q₀ and q₁)
        let isSwapped = false;
        if (editor.numQubits >= 2) {
            for (let col = 0; col < editor.numCols; col++) {
                const gate0 = currentGrid[0][col];
                const gate1 = currentGrid[1][col];
                if (gate0 && gate0.type === 'SWAP' && gate0.partner === 1 &&
                    gate1 && gate1.type === 'SWAP' && gate1.partner === 0) {
                    isSwapped = true;
                    break;
                }
            }
        }
        updateQuestStatus('quest-swap', isSwapped);
    }

    function updateQuestStatus(id, isCompleted) {
        if (isCompleted) {
            completedQuests.add(id);
        } else {
            const qObj = sandboxQuests.find(q => q.id === id);
            if (qObj && qObj.isAuto) {
                completedQuests.delete(id);
            }
        }
        updateQuestUIState(id, isCompleted);
        saveCompletedQuests();
    }

    function toggleQuestCompletion(questId) {
        if (completedQuests.has(questId)) {
            completedQuests.delete(questId);
            updateQuestUIState(questId, false);
        } else {
            completedQuests.add(questId);
            updateQuestUIState(questId, true);
        }
        saveCompletedQuests();
    }

    function updateQuestUIState(questId, isCompleted) {
        // 1. Sync dropdown option color
        const selectQuest = document.getElementById('select-quest');
        if (selectQuest) {
            const option = selectQuest.querySelector(`option[value="${questId}"]`);
            if (option) {
                option.style.color = isCompleted ? '#10b981' : '';
            }
        }

        // 2. Sync active panel if this is the currently active quest
        if (questId === currentSelectedQuestId) {
            const panel = document.getElementById('active-quest-container');
            if (panel) {
                const isCurrentlyCompleted = panel.classList.contains('completed');
                if (isCompleted !== isCurrentlyCompleted) {
                    panel.classList.toggle('completed', isCompleted);
                    const icon = panel.querySelector('.quest-status-icon i');
                    if (icon) {
                        icon.className = isCompleted ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle';
                    }
                    if (isCompleted) {
                        panel.style.transform = 'scale(1.03)';
                        panel.style.borderColor = '#10b981';
                        setTimeout(() => {
                            panel.style.transform = '';
                            panel.style.borderColor = '';
                        }, 600);
                    }
                }
            }
        }
    }

    function updateActiveQuestPanel() {
        const panel = document.getElementById('active-quest-container');
        if (!panel) return;

        const q = sandboxQuests.find(quest => quest.id === currentSelectedQuestId);
        if (!q) return;

        const isCompleted = completedQuests.has(q.id);
        panel.className = `active-quest-panel${isCompleted ? ' completed' : ''}`;
        panel.innerHTML = `
            <div class="quest-status-icon" style="cursor: pointer;" title="Toggle Completion">
                <i class="${isCompleted ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}"></i>
            </div>
            <div class="quest-details">
                <div class="quest-header-flex">
                    <span class="quest-title">${q.title}</span>
                    <button class="quest-solution-btn" id="active-quest-solution-btn" title="Load Solution">
                        <i class="fa-solid fa-lightbulb"></i>
                    </button>
                </div>
                <p class="quest-desc">${q.desc}</p>
            </div>
        `;
    }

    function renderQuestsUI() {
        const selectQuest = document.getElementById('select-quest');
        if (!selectQuest) return;

        selectQuest.innerHTML = '';

        // Group quests by category
        const categories = {};
        sandboxQuests.forEach(q => {
            if (!categories[q.category]) {
                categories[q.category] = [];
            }
            categories[q.category].push(q);
        });

        for (const [catName, quests] of Object.entries(categories)) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = catName;

            quests.forEach(q => {
                const isCompleted = completedQuests.has(q.id);
                const option = document.createElement('option');
                option.value = q.id;
                option.textContent = q.title;
                if (isCompleted) {
                    option.style.color = '#10b981';
                }
                optgroup.appendChild(option);
            });

            selectQuest.appendChild(optgroup);
        }

        // Set the active value and initial active details view
        selectQuest.value = currentSelectedQuestId;
        updateActiveQuestPanel();
    }
})();
