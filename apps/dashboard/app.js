/**
 * MNEMOS | app.js v4.0.5
 * Principal Architecture: Modular Sovereign Intelligence
 */

const API_BASE = window.location.origin;

// -------------------------------------------------------------------------
// 1. DATA GUARDS & UTILITIES
// -------------------------------------------------------------------------

const Guard = {
    numeric: (val, fallback = 0) => {
        if (typeof val !== 'number' || isNaN(val)) return fallback;
        return val;
    },
    percent: (val) => {
        const n = Guard.numeric(val);
        return `${Math.min(100, Math.max(0, n * 100)).toFixed(1)}%`;
    },
    date: (isoString) => {
        try {
            return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) { return '--:--'; }
    },
    safe: (obj, path, fallback = '') => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj) || fallback;
    }
};

// -------------------------------------------------------------------------
// 2. STATE ORCHESTRATION (THE STORE)
// -------------------------------------------------------------------------

const Store = {
    user: JSON.parse(localStorage.getItem('mnemos_user')) || null,
    activeTab: 'chat',
    latency: 0,
    identity: { dna: {}, pulse: { valence: 0, arousal: 0 } },
    memory: { stats: { episodic: 0, semantic: 0, procedural: 0 }, graph: { nodes: [], edges: [] } },
    evolution: { stats: { alignment_score: 0 }, proposals: [] },
    lattice: { status: 'offline', nodes: [] },
    nexus: [],
    loading: {},

    setTab(tab) {
        this.activeTab = tab;
        UI.render();
        if (tab === 'evolution') Sync.syncEvolution();
        if (tab === 'lattice') Sync.syncLattice();
    },

    saveUser(user) {
        this.user = user;
        localStorage.setItem('mnemos_user', JSON.stringify(user));
    },

    logout() {
        localStorage.removeItem('mnemos_user');
        window.location.reload();
    }
};

// -------------------------------------------------------------------------
// 3. SECURE API BRIDGE
// -------------------------------------------------------------------------

const Bridge = {
    async call(endpoint, method = 'GET', body = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (Store.user?.token) headers['Authorization'] = `Bearer ${Store.user.token}`;

        try {
            const res = await fetch(`${API_BASE}/api${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
            });
            if (!res.ok) throw new Error(`API_ERROR: ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error(`[Bridge] ${endpoint} failed:`, e);
            return null;
        }
    }
};

// -------------------------------------------------------------------------
// 4. UI PRIMITIVES & COMPONENTS
// -------------------------------------------------------------------------

const UI = {
    render() {
        const mount = document.getElementById('view-mount');
        if (!Store.user) return this.renderAuth();

        // Update Nav Active States
        document.querySelectorAll('.nav-link').forEach(l => {
            const tabName = l.dataset.tab;
            if (tabName) l.classList.toggle('active', tabName === Store.activeTab);
        });

        // Tab Router
        switch(Store.activeTab) {
            case 'chat': return this.renderChat(mount);
            case 'memory': return this.renderMemory(mount);
            case 'lattice': return this.renderLattice(mount);
            case 'evolution': return this.renderEvolution(mount);
            case 'identity': return this.renderIdentity(mount);
        }
    },

    renderAuth() {
        const dash = document.getElementById('dash-surface');
        const auth = document.getElementById('auth-surface');
        dash.classList.add('hidden');
        auth.classList.remove('hidden');

        auth.innerHTML = `
            <div class="card animate-reveal" style="width: 320px; margin: 100px auto;">
                <h3 class="mono">_auth_handshake</h3>
                <p class="label-tech" style="margin-bottom: 24px;">Initialize digital twin sync</p>
                
                <input type="text" id="username" placeholder="IDENTITY_LOGIN" class="mono" style="width: 100%; padding: 10px; margin-bottom: 8px; border: 1px solid var(--border-technical);">
                <input type="password" id="password" placeholder="VAULT_KEY" class="mono" style="width: 100%; padding: 10px; margin-bottom: 16px; border: 1px solid var(--border-technical);">
                
                <button id="auth-submit" class="nav-link active" style="width: 100%; justify-content: center; border: none;">EX_INIT_CON_SYNC</button>
            </div>
        `;

        document.getElementById('auth-submit').onclick = async () => {
            const u = document.getElementById('username').value;
            const p = document.getElementById('password').value;
            const data = await Bridge.call('/auth/login', 'POST', { username: u, password: p });
            if (data) {
                Store.saveUser({ username: data.username, token: data.token });
                window.location.reload();
            } else {
                alert("IDENTITY_REJECTION: Invalid credentials.");
            }
        };
    },

    renderChat(container) {
        container.innerHTML = `
            <div class="chat-thread">
                <div class="msg-scroller" id="msg-scroller">
                    <div class="msg-bubble assistant animate-reveal">
                        <span class="label-tech">_sys_status</span>
                        <div class="text">MNEMOS instance operational. Awaiting episodic input from user [${Store.user.username}].</div>
                    </div>
                </div>
                
                <div class="input-anchor">
                    <div class="input-field">
                        <textarea id="chat-input" placeholder="Enter signal..."></textarea>
                        <button id="chat-send" class="nav-link active" style="margin-bottom: 0; border: none;">SEND</button>
                    </div>
                </div>
            </div>
        `;

        const input = document.getElementById('chat-input');
        const send = document.getElementById('chat-send');

        const doSend = async () => {
            const text = input.value.trim();
            if (!text) return;
            input.value = '';
            
            this.appendMessage('user', text);
            const data = await Bridge.call('/chat', 'POST', { message: text, userId: Store.user.username });
            if (data) {
                this.appendMessage('assistant', data.content);
                Store.latency = data.processingTrace?.totalTime || 0;
                this.updateStatusBar();
            }
        };

        send.onclick = doSend;
        input.onkeypress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); } };
    },

    appendMessage(role, text) {
        const scroller = document.getElementById('msg-scroller');
        if (!scroller) return;
        const div = document.createElement('div');
        div.className = `msg-bubble ${role} animate-reveal`;
        div.innerHTML = `
            <span class="label-tech">_${role === 'user' ? 'id' : 'sys'}</span>
            <div class="text">${text}</div>
        `;
        scroller.appendChild(div);
        scroller.scrollTop = scroller.scrollHeight;
    },

    renderMemory(container) {
        container.innerHTML = `
            <div class="animate-reveal">
                <div class="section-header">
                    <h3 class="mono">_sem_cortex_audit</h3>
                </div>
                
                <div class="grid-cols-2">
                    <div class="card">
                        <div class="label-tech">Episodic Buffer</div>
                        <div class="metric-val mono">${Store.memory.stats.episodic}</div>
                    </div>
                    <div class="card">
                        <div class="label-tech">Semantic Knowledge</div>
                        <div class="metric-val mono">${Store.memory.stats.semantic}</div>
                    </div>
                </div>

                <div class="card" style="margin-top: 24px;">
                    <div class="label-tech">Neural Relationship Map</div>
                    <canvas id="memory-canvas" style="width: 100%; height: 350px; margin-top: 16px;"></canvas>
                </div>
            </div>
        `;
        this.drawGraph();
    },

    renderEvolution(container) {
        const stats = Store.evolution.stats;
        const score = Guard.numeric(stats.alignment_score);
        
        container.innerHTML = `
            <div class="animate-reveal">
                <div class="section-header">
                    <h3 class="mono">_sys_integrity_evolution</h3>
                </div>

                <div class="grid-cols-2">
                    <div class="card">
                        <div class="label-tech">Integrity Coefficient</div>
                        <div class="metric-val mono">${(score / 100).toFixed(2)}</div>
                        <div class="label-tech" style="margin-top: 8px;">Health: ${score > 90 ? 'SATISFACTORY' : 'DRIFTING'}</div>
                    </div>
                    <div class="card">
                        <div class="label-tech">Consensus Drift</div>
                        <div class="metric-val mono">${(1 - (score / 100)).toFixed(2)}</div>
                    </div>
                </div>

                <div class="card" style="margin-top: 24px;">
                    <div class="label-tech">Autonomous Governance</div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px;">
                        <span class="mono" style="font-size: 0.9rem;">RECURSIVE_INTEGRATION: ${stats.autonomous_governance_enabled ? 'ON' : 'OFF'}</span>
                        <button id="gov-toggle" class="nav-link ${stats.autonomous_governance_enabled ? 'active' : ''}" style="margin: 0; border: none;">TOGGLE</button>
                    </div>
                </div>

                <div class="card" style="margin-top: 24px;">
                    <div class="label-tech">Forensic Shredder</div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px;">
                        <p style="font-size: 0.8rem; opacity: 0.6;">Permanently purge consolidated visual stimulants from local storage.</p>
                        <button id="shred-trigger" class="nav-link" style="margin: 0; border: 1px solid var(--accent-red); color: var(--accent-red);">_purge_assets</button>
                    </div>
                </div>

                <div class="nav-group" style="margin-top: 32px;">
                    <span class="label-tech">Refactoring Proposals</span>
                    <div id="proposal-list" style="margin-top: 12px;"></div>
                </div>
            </div>
        `;

        document.getElementById('gov-toggle').onclick = async () => {
            const newState = !stats.autonomous_governance_enabled;
            await Bridge.call(`/evolution/governance?enabled=${newState}`, 'POST');
            await Sync.syncEvolution();
            UI.render();
        };

        document.getElementById('shred-trigger').onclick = async () => {
            if (!confirm("Permanently shredded media cannot be recovered. Proceed?")) return;
            const data = await Bridge.call(`/evolution/shred?userId=${Store.user.username}`, 'POST');
            alert(data?.shredded_count > 0 ? `Sovereign Purge: ${data.shredded_count} assets destroyed.` : "System already coherent.");
            Sync.syncNexus();
        };

        this.renderProposals();
    },

    renderProposals() {
        const list = document.getElementById('proposal-list');
        if (!list) return;
        if (Store.evolution.proposals.length === 0) {
            list.innerHTML = `<div class="mono" style="font-size: 0.8rem; opacity: 0.5;">No active drift detected. System coherent.</div>`;
            return;
        }

        list.innerHTML = Store.evolution.proposals.map(p => {
            const isIntegrated = p.status === 'integrated';
            return `
                <div class="card" style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                        <div class="label-tech">${p.domain} // ${p.priority}</div>
                        <div class="mono" style="font-size: 0.7rem;">${p.id}</div>
                    </div>
                    <h4 style="margin: 8px 0;">${p.title}</h4>
                    <p style="font-size: 0.85rem; color: var(--ink-secondary);">${p.description}</p>
                    <div class="mono" style="font-size: 0.75rem; background: var(--bg-tertiary); padding: 8px; margin-top: 12px; border-radius: 4px;">${p.suggestion}</div>
                    
                    <button class="nav-link active" 
                            style="width: 100%; justify-content: center; margin-top: 16px; border: none; ${isIntegrated ? 'opacity: 0.5; cursor: default;' : ''}"
                            onclick="Actions.integrateProposal('${p.id}')"
                            ${isIntegrated ? 'disabled' : ''}>
                        ${isIntegrated ? 'INTEGRATED' : 'INTEGRATE_PROPOSAL'}
                    </button>
                </div>
            `;
        }).join('');
    },

    renderLattice(container) {
        container.innerHTML = `
            <div class="animate-reveal">
                <div class="section-header">
                    <h3 class="mono">_neu_swarm_telemery</h3>
                </div>
                <div class="card" style="text-align: center; padding: 60px 0;">
                    <canvas id="lattice-canvas" style="width: 200px; height: 200px; margin: 0 auto;"></canvas>
                    <div class="label-tech" style="margin-top: 24px;">Status: Swarm Operational</div>
                    <div class="mono" style="font-size: 0.8rem; opacity: 0.6; margin-top: 8px;">Active Clusters: ${Store.lattice.nodes.length}</div>
                </div>

                <div style="margin-top: 24px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;">
                    ${Store.lattice.nodes.map(n => `
                        <div class="card" style="padding: 16px; border-left: 2px solid var(--accent-blue);">
                            <div class="label-tech">${n.role}</div>
                            <div class="mono" style="font-size: 0.9rem;">${n.id}</div>
                            <div style="font-size: 0.65rem; color: var(--accent-green); margin-top: 8px;">CONNECTED</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        this.drawLatticeWheel();
    },

    renderIdentity(container) {
        const dna = Store.identity.dna;
        const markers = [
            { label: 'Rationality', val: dna.rationality },
            { label: 'Resonance', val: dna.resonance },
            { label: 'Technical Depth', val: dna.technical_depth },
            { label: 'Formality', val: dna.formality }
        ];

        container.innerHTML = `
            <div class="animate-reveal">
                <div class="section-header">
                    <h3 class="mono">_bio_identity_synthesis</h3>
                </div>
                <div class="card">
                    <div class="label-tech">Behavioral DNA Signatures</div>
                    <div style="margin-top: 24px;">
                        ${markers.map(m => `
                            <div style="margin-bottom: 20px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span class="mono" style="font-size: 0.85rem;">${m.label}</span>
                                    <span class="label-tech">${Guard.percent(m.val)}</span>
                                </div>
                                <div style="height: 4px; background: var(--bg-tertiary); border-radius: 2px;">
                                    <div style="width: ${Guard.percent(m.val)}; height: 100%; background: var(--accent-blue); border-radius: 2px;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="card" style="margin-top: 24px;">
                    <div class="label-tech">Core Identity Blueprint</div>
                    <p style="font-size: 0.9rem; margin-top: 12px; font-style: italic; color: var(--ink-secondary);">
                        System identity is currently maturing through episodic ingestion. 
                        Digital twin synchronization is active. Behavioral markers are being synthesized 
                        from recent semantic consolidation cycles.
                    </p>
                </div>
            </div>
        `;
    },

    updateStatusBar() {
        const latencyEl = document.getElementById('latency-val');
        const userEl = document.getElementById('user-display');
        if (latencyEl) latencyEl.innerText = `SYN: ${Math.round(Store.latency)}MS`;
        if (userEl) userEl.innerText = Store.user?.username ? `USER[${Store.user.username.toUpperCase()}]` : 'PENDING_IDENTITY';
    },

    renderNexus() {
        const feed = document.getElementById('nexus-feed');
        if (!feed) return;
        if (Store.nexus.length === 0) {
            feed.innerHTML = 'Awaiting sensory ingestion...';
            return;
        }
        feed.innerHTML = Store.nexus.map(n => `
            <div onclick="Actions.inspectFact('${n.id}')" style="margin-bottom: 12px; border-left: 2px solid var(--border-technical); padding-left: 10px; cursor: pointer; transition: var(--transition-fast);">
                <div class="label-tech" style="font-size: 0.6rem;">${n.category}</div>
                <div style="font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${n.fact}</div>
            </div>
        `).join('');
    },

    // Visual Helpers
    drawGraph() {
        const canvas = document.getElementById('memory-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const nodes = Store.memory.graph.nodes;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        
        nodes.forEach((n, i) => {
            const angle = (i / nodes.length) * Math.PI * 2;
            const r = 120;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = n.is_locked ? 'var(--accent-blue)' : 'var(--ink-primary)';
            ctx.fill();
        });
    },

    drawLatticeWheel() {
        const canvas = document.getElementById('lattice-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);

        ctx.clearRect(0,0, rect.width, rect.height);
        ctx.beginPath();
        ctx.arc(100, 100, 45, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(100, 100, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'var(--ink-primary)';
        ctx.fill();
    }
};

// -------------------------------------------------------------------------
// 5. GLOBAL ACTIONS
// -------------------------------------------------------------------------

window.Actions = {
    async inspectFact(id) {
        const fact = Store.nexus.find(n => n.id === id) || 
                     Store.memory.graph.nodes.find(n => n.id === id);
        if (!fact) return;
        
        alert(`_sem_inspection:\n\nFact: ${fact.fact}\nCategory: ${fact.category}\nStatus: ${fact.is_locked ? 'LOCKED' : 'SYNCHRONIZED'}`);
    },

    async integrateProposal(id) {
        if (!confirm("Initiate Recursive Self-Improvement for this proposal?")) return;
        
        const res = await Bridge.call(`/meta/integrate/${id}`, 'POST');
        if (res && res.success) {
            alert("RSI Integration Complete. System evolved.");
            await Sync.syncEvolution();
            UI.render();
        } else {
            alert("RSI_FAILURE: Integration could not be completed.");
        }
    }
};

// -------------------------------------------------------------------------
// 6. DATA FETCHERS & ORCHESTRATORS
// -------------------------------------------------------------------------

const Sync = {
    async init() {
        if (!Store.user) return UI.render();
        
        // Initial core data fetch
        await Promise.all([
            this.syncMemory(),
            this.syncIdentity(),
            this.syncLattice(),
            this.syncNexus()
        ]);
        
        UI.render();
        UI.updateStatusBar();
        
        // Start Heartbeat
        this.heartbeat();
    },

    async syncMemory() {
        const stats = await Bridge.call(`/memory/stats?userId=${Store.user.username}`);
        if (stats) Store.memory.stats = stats;
        const graph = await Bridge.call(`/memory/graph?userId=${Store.user.username}`);
        if (graph) Store.memory.graph = graph;
    },

    async syncIdentity() {
        const dna = await Bridge.call(`/identity/dna?userId=${Store.user.username}`);
        if (dna) Store.identity.dna = dna;
        const pulse = await Bridge.call(`/reflect/pulse?userId=${Store.user.username}`);
        if (pulse) Store.identity.pulse = pulse;
    },

    async syncLattice() {
        const status = await Bridge.call('/lattice/status');
        if (status) Store.lattice = status;
    },

    async syncEvolution() {
        const stats = await Bridge.call('/evolution/stats');
        const proposals = await Bridge.call('/meta/proposals');
        if (stats) Store.evolution.stats = stats;
        if (proposals) Store.evolution.proposals = proposals;
    },

    async syncNexus() {
        const feed = await Bridge.call(`/nexus/perceptions?userId=${Store.user.username}`);
        if (feed) Store.nexus = feed;
        UI.renderNexus();
    },

    heartbeat() {
        setInterval(async () => {
            // Background polling for real-time vibe
            await this.syncIdentity();
            await this.syncNexus();
            if (Store.activeTab === 'evolution') await this.syncEvolution();
            UI.updateStatusBar();
        }, 10000);
    }
};

// -------------------------------------------------------------------------
// 7. BOOTSTRAP
// -------------------------------------------------------------------------

window.onload = () => {
    // Navigation binding
    document.querySelectorAll('.nav-link[data-tab]').forEach(link => {
        link.onclick = (e) => {
            const tab = e.target.dataset.tab;
            if (tab) Store.setTab(tab);
        };
    });

    const logout = document.getElementById('logout-trigger');
    if (logout) logout.onclick = () => Store.logout();

    // Start System
    Sync.init();
};
