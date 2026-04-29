// EXPLANATION OF HEAP VS SORTING:
// We use a Min Heap instead of Array.sort() to guarantee efficient prioritization.
// Using Array.sort() on every insert takes O(N log N) time, which is slow for dynamic queues.
// A Min Heap achieves:
// - Insert: O(log N)
// - Extract Min (or Delete): O(log N)
// - Retrieve Min (Next Task): O(1)
//
// TREE-TO-ARRAY MAPPING:
// A binary tree can be cleanly mapped to an array without pointers:
// For any node at index i:
// - Left Child is at index 2*i + 1
// - Right Child is at index 2*i + 2
// - Parent is at index Math.floor((i - 1) / 2)

class MinHeap {
  constructor() {
    this.heap = [];
    this.currentId = 1;
  }

  toJSON() { return { heap: this.heap, currentId: this.currentId }; }
  
  fromJSON(data) {
    if (data && data.heap) {
      this.heap = data.heap;
      this.currentId = data.currentId || 1;
    }
  }

  // --- Helper Methods ---
  getParentIndex(i) { return Math.floor((i - 1) / 2); }
  getLeftChildIndex(i) { return 2 * i + 1; }
  getRightChildIndex(i) { return 2 * i + 2; }
  
  swap(i1, i2) {
    const temp = this.heap[i1];
    this.heap[i1] = this.heap[i2];
    this.heap[i2] = temp;
  }

  isHigherPriority(i, j) {
    const task1 = this.heap[i];
    const task2 = this.heap[j];
    if (task1.priority !== task2.priority) return task1.priority < task2.priority;
    return task1.deadline < task2.deadline;
  }

  insert(title, priority, deadline) {
    const task = {
      id: this.currentId++,
      title,
      priority: parseInt(priority, 10),
      deadline: new Date(deadline).getTime()
    };
    this.heap.push(task);
    this.heapifyUp(this.heap.length - 1);
    return task;
  }

  extractMin() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();
    const minTask = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown(0);
    return minTask;
  }

  heapifyUp(index) {
    let currentIndex = index;
    let parentIndex = this.getParentIndex(currentIndex);
    while (currentIndex > 0 && this.isHigherPriority(currentIndex, parentIndex)) {
      this.swap(currentIndex, parentIndex);
      currentIndex = parentIndex;
      parentIndex = this.getParentIndex(currentIndex);
    }
  }

  heapifyDown(index) {
    let currentIndex = index;
    while (this.getLeftChildIndex(currentIndex) < this.heap.length) {
      let highestPriorityIndex = this.getLeftChildIndex(currentIndex);
      let rightChildIndex = this.getRightChildIndex(currentIndex);
      if (rightChildIndex < this.heap.length && this.isHigherPriority(rightChildIndex, highestPriorityIndex)) {
        highestPriorityIndex = rightChildIndex;
      }
      if (this.isHigherPriority(currentIndex, highestPriorityIndex)) break;
      this.swap(currentIndex, highestPriorityIndex);
      currentIndex = highestPriorityIndex;
    }
  }

  getAllTasksSorted() {
    const clonedHeap = new MinHeap();
    clonedHeap.heap = [...this.heap];
    clonedHeap.currentId = this.currentId;
    const sortedTasks = [];
    while (clonedHeap.heap.length > 0) {
      sortedTasks.push(clonedHeap.extractMin());
    }
    return sortedTasks;
  }

  getTopN(n) {
    const clonedHeap = new MinHeap();
    clonedHeap.heap = [...this.heap];
    clonedHeap.currentId = this.currentId;
    const res = [];
    while (clonedHeap.heap.length > 0 && res.length < n) {
      res.push(clonedHeap.extractMin());
    }
    return res;
  }

  deleteTask(id) {
    id = parseInt(id, 10);
    const index = this.heap.findIndex(t => t.id === id);
    if (index === -1) return null;

    const deletedTask = this.heap[index];
    this.swap(index, this.heap.length - 1);
    this.heap.pop();

    if (index < this.heap.length) {
      const parentIndex = this.getParentIndex(index);
      if (index > 0 && this.isHigherPriority(index, parentIndex)) {
        this.heapifyUp(index);
      } else {
        this.heapifyDown(index);
      }
    }
    return deletedTask;
  }

  // --- Debug Safety Check ---
  isValidHeap() {
    for (let i = 0; i < this.heap.length; i++) {
      const left = this.getLeftChildIndex(i);
      const right = this.getRightChildIndex(i);
      
      // If a child exists and is higher priority than its parent, the heap is invalid
      if (left < this.heap.length && this.isHigherPriority(left, i)) return false;
      if (right < this.heap.length && this.isHigherPriority(right, i)) return false;
    }
    return true;
  }
}

module.exports = MinHeap;
