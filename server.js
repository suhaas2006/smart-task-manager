const express = require('express');
const cors = require('cors');
const fs = require('fs');
const MinHeap = require('./heap');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DATA_FILE = './data.json';
const taskHeap = new MinHeap();
let completedTasks = [];

// Load data on server start
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

function saveData() {
  const data = {
    heapData: taskHeap.toJSON(),
    completedTasks
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Load initial data
loadData();

app.post('/add-task', (req, res) => {
  const { title, priority, deadline } = req.body;
  if (!title || priority === undefined || !deadline) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const task = taskHeap.insert(title, priority, deadline);
  saveData();
  
  // Debug Safety Check
  console.log(`[Insert] Heap valid: ${taskHeap.isValidHeap()} | Total Tasks: ${taskHeap.heap.length}`);
  
  res.status(201).json({ message: 'Task added successfully', task });
});

app.get('/tasks', (req, res) => {
  const sortedTasks = taskHeap.getAllTasksSorted();
  res.json({ tasks: sortedTasks });
});

app.get('/next-task', (req, res) => {
  const nextTask = taskHeap.heap.length > 0 ? taskHeap.heap[0] : null;
  res.json({ task: nextTask });
});

app.delete('/task/:id', (req, res) => {
  const { id } = req.params;
  const deletedTask = taskHeap.deleteTask(id);
  
  if (deletedTask) {
    deletedTask.completedAt = Date.now();
    completedTasks.push(deletedTask);
    saveData();
    
    // Debug Safety Check
    console.log(`[Delete] Heap valid: ${taskHeap.isValidHeap()} | Total Tasks: ${taskHeap.heap.length}`);
    
    res.json({ message: 'Task removed successfully' });
  } else {
    res.status(404).json({ error: 'Task not found in heap' });
  }
});

// NEW APIS
app.get('/history', (req, res) => {
  res.json({ history: completedTasks });
});

app.get('/insights', (req, res) => {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  let overdueTasks = 0;
  let dueIn24h = 0;

  for (const task of taskHeap.heap) {
    if (task.deadline < now) {
      overdueTasks++;
    } else if (task.deadline - now <= ONE_DAY) {
      dueIn24h++;
    }
  }

  res.json({
    totalTasks: taskHeap.heap.length,
    overdueTasks,
    tasksDueIn24Hours: dueIn24h,
    nextUrgentTask: taskHeap.heap.length > 0 ? taskHeap.heap[0] : null
  });
});

app.get('/raw-heap', (req, res) => {
  res.json({ nodes: taskHeap.heap });
});

app.get('/suggest-task', (req, res) => {
  res.json({ tasks: taskHeap.getTopN(3) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
