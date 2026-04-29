const express = require('express');
const cors = require('cors');
const fs = require('fs');
const MinHeap = require('./heap');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DATA_FILE = './data.json';
const taskHeap = new MinHeap();
let completedTasks = [];

// --------------------
// LOAD DATA
// --------------------
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (data.heapData) taskHeap.fromJSON(data.heapData);
      if (data.completedTasks) completedTasks = data.completedTasks;
    } catch (e) {
      console.error("Error reading data file:", e);
    }
  }
}

// --------------------
// SAVE DATA
// --------------------
function saveData() {
  const data = {
    heapData: taskHeap.toJSON(),
    completedTasks
  };

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error saving data:", e);
  }
}

// Load initial data
loadData();

// --------------------
// ROUTES
// --------------------

// Add Task
app.post('/add-task', (req, res) => {
  const { title, priority, deadline } = req.body;

  if (!title || priority === undefined || !deadline) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const task = taskHeap.insert(title, Number(priority), new Date(deadline).getTime());
    saveData();

    console.log(`[Insert] Heap valid: ${taskHeap.isValidHeap()} | Total Tasks: ${taskHeap.heap.length}`);

    res.status(201).json({ message: 'Task added successfully', task });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: 'Failed to add task' });
  }
});

// Get Tasks
app.get('/tasks', (req, res) => {
  try {
    const tasks = taskHeap.getAllTasksSorted();
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get Next Task
app.get('/next-task', (req, res) => {
  const nextTask = taskHeap.heap.length > 0 ? taskHeap.heap[0] : null;
  res.json({ task: nextTask });
});

// Delete Task
app.delete('/task/:id', (req, res) => {
  const { id } = req.params;

  try {
    const deletedTask = taskHeap.deleteTask(id);

    if (deletedTask) {
      deletedTask.completedAt = Date.now();
      completedTasks.push(deletedTask);

      saveData();

      console.log(`[Delete] Heap valid: ${taskHeap.isValidHeap()} | Total Tasks: ${taskHeap.heap.length}`);

      res.json({ message: 'Task removed successfully' });
    } else {
      res.status(404).json({ error: 'Task not found in heap' });
    }
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// History
app.get('/history', (req, res) => {
  res.json({ history: completedTasks });
});

// Insights
app.get('/insights', (req, res) => {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  let overdueTasks = 0;
  let dueIn24h = 0;

  for (const task of taskHeap.heap) {
    if (task.deadline < now) overdueTasks++;
    else if (task.deadline - now <= ONE_DAY) dueIn24h++;
  }

  res.json({
    totalTasks: taskHeap.heap.length,
    overdueTasks,
    tasksDueIn24Hours: dueIn24h,
    nextUrgentTask: taskHeap.heap.length > 0 ? taskHeap.heap[0] : null
  });
});

// Raw Heap (Visualizer)
app.get('/raw-heap', (req, res) => {
  res.json({ nodes: taskHeap.heap });
});

// Suggest Tasks
app.get('/suggest-task', (req, res) => {
  res.json({ tasks: taskHeap.getTopN(3) });
});

// --------------------
// SERVER START
// --------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});