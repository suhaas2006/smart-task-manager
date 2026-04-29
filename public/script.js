const API_URL = 'http://localhost:3000';

const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
document.getElementById('deadline').value = now.toISOString().slice(0, 16);

async function refreshAll() {
    await Promise.all([
        loadInsights(),
        loadSuggested(),
        loadTasks(),
        loadRawHeap(),
        loadHistory()
    ]);
}

async function loadInsights() {
    try {
        const res = await fetch(`${API_URL}/insights`);
        const data = await res.json();
        document.getElementById('insightsPanel').innerHTML = `
            <div class="insight-card">
                <div class="insight-val">${data.totalTasks}</div>
                <div style="font-size:0.8em; color:#888;">Total Tasks</div>
            </div>
            <div class="insight-card">
                <div class="insight-val" style="color:var(--danger-color);">${data.overdueTasks}</div>
                <div style="font-size:0.8em; color:#888;">Overdue</div>
            </div>
            <div class="insight-card" style="grid-column: span 2;">
                <div class="insight-val" style="color:var(--urgent-color);">${data.tasksDueIn24Hours}</div>
                <div style="font-size:0.8em; color:#888;">Due in 24 Hours</div>
            </div>
            ${data.nextUrgentTask ? `
            <div class="insight-card" style="grid-column: span 2; border: 1px solid var(--primary-color);">
                <div style="font-size:0.8em; color:var(--primary-color); text-transform: uppercase;">Highest Priority Task</div>
                <div style="font-size:1.1em; font-weight:bold; margin-top:5px;">${data.nextUrgentTask.title}</div>
            </div>` : ''}
        `;
    } catch (e) {
        console.error("Error loading insights", e);
    }
}

async function loadSuggested() {
    try {
        const res = await fetch(`${API_URL}/suggest-task`);
        const data = await res.json();
        renderTasksList(data.tasks, document.getElementById('suggestedTasks'), false);
    } catch (e) {
        console.error("Error loading suggested tasks", e);
    }
}

async function loadTasks() {
    try {
        const res = await fetch(`${API_URL}/tasks`);
        const data = await res.json();
        renderTasksList(data.tasks, document.getElementById('taskList'), true);
    } catch (e) {
        console.error("Error loading tasks", e);
    }
}

async function loadHistory() {
    try {
        const res = await fetch(`${API_URL}/history`);
        const data = await res.json();
        const hist = data.history.slice().reverse(); // Show latest completed first
        const container = document.getElementById('historyList');
        container.innerHTML = '';
        
        if (hist.length === 0) {
            container.innerHTML = '<p style="color:#666;">No completed tasks yet.</p>';
            return;
        }

        hist.forEach(task => {
            const div = document.createElement('div');
            div.className = 'task-item';
            div.innerHTML = `
                <div>
                    <div style="text-decoration: line-through;">${task.title}</div>
                    <div style="font-size:0.8em; color:#888;">Completed: ${new Date(task.completedAt).toLocaleString()}</div>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (e) {
        console.error("Error loading history", e);
    }
}

async function loadRawHeap() {
    try {
        const res = await fetch(`${API_URL}/raw-heap`);
        const data = await res.json();
        renderTree(data.nodes);
    } catch (e) {
        console.error("Error loading raw heap", e);
    }
}

function renderTasksList(tasks, container, showDelete) {
    container.innerHTML = '';
    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<p style="color:#666;">No tasks found.</p>';
        return;
    }
    
    tasks.forEach((task, index) => {
        if (!task) return;
        const div = document.createElement('div');
        div.className = `task-item ${task.priority === 1 ? 'urgent' : ''} ${index === 0 && showDelete ? 'highest-priority' : ''}`;
        div.id = `task-${task.id}`;
        const dateStr = new Date(task.deadline).toLocaleString();
        
        div.innerHTML = `
            <div>
                <div style="font-weight:bold;">${task.title}</div>
                <div style="font-size:0.8em; color:#888;">Priority: ${task.priority} | Due: ${dateStr}</div>
            </div>
            ${showDelete ? `<button class="btn-delete" onclick="deleteTask(${task.id})">Complete</button>` : ''}
        `;
        container.appendChild(div);
    });
}

function renderTree(nodes) {
    const container = document.getElementById('heapVisualizer');
    container.innerHTML = '';
    
    if (!nodes || nodes.length === 0) {
        container.innerHTML = '<p style="color:#666;">Heap is empty.</p>';
        return;
    }

    // Build levels mapping 1D array to 2D tree structure
    const levels = [];
    nodes.forEach((node, i) => {
        const depth = Math.floor(Math.log2(i + 1));
        if (!levels[depth]) levels[depth] = [];
        levels[depth].push(node);
    });

    levels.forEach((levelNodes, depth) => {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'tree-level';
        
        levelNodes.forEach(node => {
            const isRoot = node === nodes[0];
            const isUrgent = node.priority === 1;
            const nodeDiv = document.createElement('div');
            nodeDiv.className = `tree-node ${isRoot ? 'root' : ''} ${isUrgent ? 'urgent' : ''}`;
            nodeDiv.textContent = `${node.id}`;
            nodeDiv.setAttribute('data-prio', `P:${node.priority}`);
            levelDiv.appendChild(nodeDiv);
        });
        
        container.appendChild(levelDiv);
    });
}

document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const priority = document.getElementById('priority').value;
    const deadline = document.getElementById('deadline').value;

    await fetch(`${API_URL}/add-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority, deadline })
    });

    document.getElementById('taskForm').reset();
    
    // Reset deadline
    const newNow = new Date();
    newNow.setMinutes(newNow.getMinutes() - newNow.getTimezoneOffset());
    document.getElementById('deadline').value = newNow.toISOString().slice(0, 16);
    
    refreshAll();
});

async function deleteTask(id) {
    const el = document.getElementById(`task-${id}`);
    if (el) el.classList.add('removing');
    
    setTimeout(async () => {
        await fetch(`${API_URL}/task/${id}`, { method: 'DELETE' });
        refreshAll();
    }, 400);
}

// Initial load
refreshAll();
