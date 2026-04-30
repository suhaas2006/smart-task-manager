const API = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {

    // Set default deadline (LOCAL TIME FIX)
    const now = new Date();
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
            const res = await fetch(`${API}/insights`);
            const data = await res.json();

            document.getElementById('insightsPanel').innerHTML = `
                <div class="insight-card">
                    <div class="insight-val">${data.totalTasks}</div>
                    <div>Total Tasks</div>
                </div>
                <div class="insight-card">
                    <div class="insight-val">${data.overdueTasks}</div>
                    <div>Overdue</div>
                </div>
                <div class="insight-card">
                    <div class="insight-val">${data.tasksDueIn24Hours}</div>
                    <div>Due in 24h</div>
                </div>
            `;
        } catch (e) {
            console.error(e);
        }
    }

    async function loadSuggested() {
        const res = await fetch(`${API}/suggest-task`);
        const data = await res.json();
        renderTasksList(data.tasks, document.getElementById('suggestedTasks'), false);
    }

    async function loadTasks() {
        const res = await fetch(`${API}/tasks`);
        const data = await res.json();
        renderTasksList(data.tasks, document.getElementById('taskList'), true);
    }

    async function loadHistory() {
        const res = await fetch(`${API}/history`);
        const data = await res.json();

        const container = document.getElementById('historyList');
        container.innerHTML = '';

        data.history.forEach(task => {
            container.innerHTML += `
                <div class="task-item">
                    <div>${task.title}</div>
                </div>
            `;
        });
    }

    async function loadRawHeap() {
        const res = await fetch(`${API}/raw-heap`);
        const data = await res.json();
        renderTree(data.nodes);
    }

    function renderTasksList(tasks, container, showDelete) {
        container.innerHTML = '';
        const now = new Date();

        tasks.forEach((task, index) => {
            const deadline = new Date(task.deadline);
            const isOverdue = deadline < now;

            const div = document.createElement('div');
            div.className = `task-item ${isOverdue ? 'overdue' : ''}`;

            div.innerHTML = `
                <div>
                    <strong>${task.title}</strong>
                    ${isOverdue ? '<span style="color:red;"> [OVERDUE]</span>' : ''}
                    <br>
                    Priority: ${task.priority} |
                    Due: ${deadline.toLocaleString()}
                </div>
                ${showDelete ? `<button onclick="deleteTask(${task.id})">Complete</button>` : ''}
            `;

            container.appendChild(div);
        });
    }

    function renderTree(nodes) {
        const container = document.getElementById('heapVisualizer');
        container.innerHTML = '';

        nodes.forEach(node => {
            const div = document.createElement('div');
            div.innerText = node.id;
            container.appendChild(div);
        });
    }

    // FIXED ADD TASK (NO TIMEZONE BUG)
    document.getElementById('taskForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const deadline = document.getElementById('deadline').value;

        // AUTO PRIORITY (LOCAL TIME SAFE)
        const now = new Date().getTime();
        const deadlineTime = new Date(deadline).getTime();
        const diffHours = (deadlineTime - now) / (1000 * 60 * 60);

        let priority;
        if (diffHours <= 6) priority = 1;
        else if (diffHours <= 24) priority = 2;
        else priority = 3;

        try {
            await fetch(`${API}/add-task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    priority,
                    deadline // ✅ RAW VALUE (IMPORTANT FIX)
                })
            });

            e.target.reset();
            refreshAll();

        } catch (err) {
            console.error(err);
        }
    });

    window.deleteTask = async function (id) {
        await fetch(`${API}/task/${id}`, { method: 'DELETE' });
        refreshAll();
    };

    refreshAll();
});