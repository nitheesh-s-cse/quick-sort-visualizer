# Randomized Quick Sort — Recursion Tree Visualization

## Project Overview
This project is an interactive academic visualization of **Randomized Quick Sort** using a **true recursion tree**.

It is built with:
- HTML
- CSS
- JavaScript
- Three.js r128

No frameworks are used.

---

## Core Idea
This visualization shows Quick Sort as a **recursion tree**:

- Each node represents a **subarray**
- Each split represents a **pivot partition**
- Left child contains elements **less than pivot**
- Right child contains elements **greater than or equal to pivot**

This is not a generic graph.  
It is a real recursive tree structure.

---

## Node Structure
Each node displays:
1. The current subarray as small boxes
2. The pivot highlighted with a blue border
3. Left partition labeled `<= pivot`
4. Right partition labeled `>= pivot`

---

## Tree Generation
- Root node = full array
- After partition:
  - left child node is created
  - right child node is created
- Recursion continues until subarray size is 1

---

## Visual Design
- Tree grows from top to bottom
- Children spread horizontally
- Root is centered
- Slight 3D depth is added for perspective
- Soft lighting keeps the visualization clean and readable

---

## Step Types
The website precomputes and animates these step types:
- `choose_pivot`
- `compare`
- `partition_left`
- `partition_right`
- `create_node`
- `recursion_call`
- `base_case`
- `complete`

---

## Interaction
- Click node → zoom into subtree
- Hover → highlight node
- Drag → rotate scene
- Scroll → zoom

Controls:
- Run
- Step-by-step
- Auto play
- Reset

---

## Output Panel
Displays:
- Sorted Array
- Comparisons
- Swaps
- Recursion depth

---

## Performance Rules
- Maximum array size: 15
- Smooth animations
- 3D scene is cleaned up on reset
- Designed to avoid lag

---

## How to Run Locally
1. Put all files into the required folder structure
2. Open `index.html` in a browser

---

## Important Note
Some browsers restrict ES modules when opening with `file://`.

If needed, you can run this with a very small static server, or request a non-module version.

---

## GitHub Pages Deployment
1. Create a GitHub repository
2. Upload all files
3. Go to **Settings → Pages**
4. Choose **Deploy from branch**
5. Select **main** and **/ (root)**
6. Save
7. Access:

```text
https://<username>.github.io/<repo-name>/