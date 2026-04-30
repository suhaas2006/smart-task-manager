const API = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {

    // Set default deadline safely in Local Time
    function setDefaultDeadline() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('deadline').value = `${year}-${month}-${date}T${hours}:${minutes}`;
    }
    setDefaultDeadline();

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
            const res = await fetch(`${API}/insights`);
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
                    <div style="font-size:1.1em; font-weight:bold;">${data.nextUrgentTask.title}</div>
                </div>` : ''}
            `;
        } catch (e) {
            console.error("Error loading insights", e);
        }
    }

    async function loadSuggested() {
        try {
            const res = await fetch(`${API}/suggest-task`);
            const data = await res.json();
            renderTasksList(data.tasks, document.getElementById('suggestedTasks'), false);
        } catch (e) {
            console.error("Error loading suggested tasks", e);
        }
    }

    async function loadTasks() {
        try {
            const res = await fetch(`${API}/tasks`);
            const data = await res.json();
            renderTasksList(data.tasks, document.getElementById('taskList'), true);
        } catch (e) {
            console.error("Error loading tasks", e);
        }
    }

    async function loadHistory() {
        try {
            const res = await fetch(`${API}/history`);
            const data = await res.json();

            const container = document.getElementById('historyList');
            container.innerHTML = '';

            if (data.history.length === 0) {
                container.innerHTML = '<p style="color:#666;">No completed tasks yet.</p>';
                return;
            }

            data.history.slice().reverse().forEach(task => {
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
            const res = await fetch(`${API}/raw-heap`);
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

        const now = new Date();

        tasks.forEach((task, index) => {
            const taskDeadline = new Date(task.deadline);
            const isOverdue = taskDeadline < now;

            let classes = ['task-item'];
            if (isOverdue) {
                classes.push('overdue');
            } else if (task.priority === 1) {
                classes.push('urgent');
            }

            if (index === 0 && showDelete) {
                classes.push('highest-priority');
            }

            const div = document.createElement('div');
            div.className = classes.join(' ');
            div.id = `task-${task.id}`;

            div.innerHTML = `
                <div>
                    <div style="font-weight:bold;">${task.title} ${isOverdue ? '<span class="overdue-label">[OVERDUE]</span>' : ''}</div>
                    <div style="font-size:0.8em; color:#888;">
                        Priority: ${task.priority} | Due: ${new Date(task.deadline).toLocaleString()}
                    </div>
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

        const levels = [];

        nodes.forEach((node, i) => {
            const depth = Math.floor(Math.log2(i + 1));
            if (!levels[depth]) levels[depth] = [];
            levels[depth].push(node);
        });

        levels.forEach(levelNodes => {
            const levelDiv = document.createElement('div');
            levelDiv.className = 'tree-level';

            levelNodes.forEach(node => {
                const div = document.createElement('div');
                div.className = `tree-node ${node === nodes[0] ? 'root' : ''}`;
                div.textContent = node.id;
                div.setAttribute('data-prio', `P:${node.priority}`);
                levelDiv.appendChild(div);
            });

            container.appendChild(levelDiv);
        });
    }

    document.getElementById('taskForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const deadline = document.getElementById('deadline').value;

        let priority = 3;
        const deadlineDate = new Date(deadline);
        const now = new Date();
        const diffMs = deadlineDate - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours <= 6) {
            priority = 1;
        } else if (diffHours <= 24) {
            priority = 2;
        } else {
            priority = 3;
        }

        try {
            await fetch(`${API}/add-task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, priority, deadline })
            });

            e.target.reset();

            setDefaultDeadline();

            refreshAll();

        } catch (err) {
            console.error("Error adding task", err);
        }
    });

    window.deleteTask = async function (id) {
        try {
            await fetch(`${API}/task/${id}`, { method: 'DELETE' });
            refreshAll();
        } catch (err) {
            console.error("Error deleting task", err);
        }
    };

    refreshAll();

    // Auto-refresh every 60 seconds
    setInterval(refreshAll, 60000);
});
