# Smart Task Manager

## Description
Smart Task Manager is a full-stack application designed to efficiently manage tasks using a Min Heap data structure. It prioritizes tasks based on user-defined priority levels and deadlines, ensuring you always know what to work on next. The application also includes a dynamic visualizer for the underlying heap structure and an insights dashboard.

## Features
- **Heap-based prioritization**: Tasks are dynamically sorted using a custom Min Heap based on priority and urgency.
- **Task suggestions**: Receive smart recommendations for the top most urgent tasks.
- **Visualizer**: View a live visual representation of the Min Heap binary tree structure.
- **Persistence**: Tasks and history are saved to ensure no data is lost between sessions.
- **History tracking**: Maintain a log of all completed tasks.

## Tech Stack
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Storage**: JSON file persistence

## Data Structure Used (Min Heap)
The core logic of the application relies on a custom-built Min Heap. The heap is ordered primarily by task priority (lower number = higher priority), and secondarily by deadline to break ties.

### Time Complexity:
- **Insert**: O(log n)
- **Delete**: O(log n)
- **Get top**: O(1)

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node server.js
   ```
4. Open your browser and navigate to `http://localhost:3000`

## Screenshots
*(Add your screenshots here)*
