# Workflow Editor Guide

## Overview
The Workflow Editor is a visual tool for creating and editing work order template workflows. It allows you to design complex manufacturing processes with parallel and serial paths, assign stations to each step, and specify material requirements.

## Features

### 1. Visual Canvas
- **Grid Background**: Helps align nodes visually
- **Drag and Drop**: Click and drag nodes to reposition them on the canvas
- **Zoom View**: Large canvas area (800x600) for complex workflows

### 2. Node Types

#### Station Node (Blue)
- Represents a manufacturing station/step
- Can be assigned to a specific station
- Can have materials required for that step
- Primary workflow component

#### Split Node (Yellow)
- Creates parallel paths in the workflow
- Used when multiple processes can happen simultaneously
- Example: "Assemble Body" and "Paint Parts" can happen in parallel

#### Merge Node (Green)
- Joins parallel paths back together
- Used after split to synchronize parallel processes
- Example: After parallel "Assembly" and "Painting", merge before "Final QC"

### 3. Connections (Edges)
- **Blue arrows** show the flow direction
- **Click to delete**: Red circle in the middle of each edge - click to remove connection
- Supports:
  - **Series connections**: A → B → C (sequential steps)
  - **Parallel branches**: A → Split → [B, C] → Merge → D
  - **Complex routing**: Multiple splits and merges

### 4. Toolbar Tools

#### Select Mode (✋)
- Default mode
- Click nodes to select them
- Drag nodes to reposition
- Shows selected node with blue ring

#### Add Station (📍)
- Click anywhere on canvas to add a station node
- Station nodes represent work steps
- Must assign a station and can add materials

#### Add Split (🔀)
- Click anywhere to add a split node
- Creates branching point for parallel paths
- Connect one input, multiple outputs

#### Add Merge (🔃)
- Click anywhere to add a merge node
- Joins parallel paths back together
- Connect multiple inputs, one output

#### Connect Mode (🔗)
- Click first node (source) - node shows yellow indicator
- Click second node (target) - creates arrow connection
- Automatically returns to Select mode

#### Edit Button (✏️)
- Only visible when a node is selected
- Opens edit dialog for the selected node
- Configure station assignment and materials

#### Delete Button (🗑️)
- Only visible when a node is selected
- Removes the selected node
- Automatically removes all connected edges

#### Save Button (💾)
- Saves the entire workflow
- Updates the template in the system
- Closes the editor

## How to Use

### Creating a Simple Linear Workflow

1. Click **"+ New Template"** button
2. Enter template name, description, and cost
3. Click **"Create Template"** - editor opens automatically
4. Click **"📍 Add Station"**
5. Click on canvas to place first station
6. Repeat to add more stations
7. Click **"🔗 Connect"**
8. Click first station, then second station (creates arrow)
9. Repeat to connect all stations in sequence
10. Click each station and press **"✏️ Edit"** to:
    - Set station name/label
    - Assign physical station
    - Add required materials
11. Click **"💾 Save"**

**Example**:
```
Start → Cut Material → Assemble → Quality Check → Finish
```

### Creating a Workflow with Parallel Paths

1. Create template as above
2. Add stations for parallel work:
   - Station A (before split)
   - Station B1 (parallel path 1)
   - Station B2 (parallel path 2)
   - Station C (after merge)
3. Click **"🔀 Add Split"** and place split node
4. Click **"🔃 Add Merge"** and place merge node
5. Connect in this pattern:
   ```
   A → Split → B1 → Merge → C
          ↓         ↗
          B2 -------
   ```
6. Edit each station to assign details
7. Save

**Example**:
```
Cut Material → Split → [Assemble Body, Paint Parts] → Merge → Final QC
```

### Editing an Existing Template

1. Navigate to **Templates** page
2. Click on a template in the list
3. Click **"Edit Workflow"** button
4. Modify the workflow:
   - Add new nodes
   - Move existing nodes
   - Add/remove connections
   - Edit node properties
5. Click **"💾 Save"** when done

### Assigning Materials to Steps

1. Select a station node
2. Click **"✏️ Edit"**
3. In the edit dialog:
   - Click **"+ Add Material"**
   - Select material from dropdown
   - Enter quantity needed
   - Repeat for all materials
4. Click **"Save Changes"**

**Example**:
- Station: "Assemble Body"
- Materials:
  - Steel Frame × 1
  - Bolts × 12
  - Rivets × 24

### Deleting Nodes or Edges

**To delete a node:**
1. Click the node to select it
2. Click **"🗑️ Delete"** button
3. All connected edges are automatically removed

**To delete an edge:**
1. Click the red circle in the middle of the arrow
2. Edge is immediately removed

## Best Practices

### Workflow Design
1. **Start with the end in mind**: Identify final product requirements first
2. **Identify parallel opportunities**: Look for steps that don't depend on each other
3. **Keep it simple**: Only add splits/merges when truly necessary
4. **Label clearly**: Use descriptive names for each step

### Node Placement
1. **Top to bottom flow**: Place start at top, end at bottom
2. **Left to right for parallel**: Parallel branches side by side
3. **Align nodes**: Use grid to align nodes at same level
4. **Space adequately**: Leave room for future modifications

### Material Assignment
1. **Be specific**: Assign exact quantities needed
2. **Include consumables**: Don't forget items like adhesive, solder, etc.
3. **Account for waste**: Add extra for expected waste/scrap
4. **Review regularly**: Update as processes improve

## Examples

### Example 1: Simple Linear Assembly
```
Raw Material → Cut → Drill → Assemble → QC → Package
```

### Example 2: Parallel Processing
```
                    ┌→ Paint Body ──┐
Raw Material → Cut ─┤               ├→ Assemble → QC
                    └→ Prep Parts ─┘
```

### Example 3: Complex Multi-Stage
```
                    ┌→ Machine Part A ──┐
Raw Material → Cut ─┤                   ├→ Sub-Assembly 1 ─┐
                    └→ Machine Part B ──┘                  │
                                                            ├→ Final Assembly → QC
                    ┌→ Mold Part C ─────┐                  │
Raw Material → Mix ─┤                   ├→ Sub-Assembly 2 ─┘
                    └→ Mold Part D ─────┘
```

### Example 4: Quality Check Routing
```
Material → Process → QC ─┬→ Pass → Package
                         └→ Fail → Rework → QC (loop back)
```

## Keyboard Shortcuts
*(Not yet implemented, but planned)*
- **Esc**: Return to Select mode
- **Delete**: Delete selected node
- **Ctrl+S**: Save workflow
- **Ctrl+Z**: Undo last action

## Troubleshooting

### "Can't connect these nodes"
- Ensure you're in Connect mode (🔗)
- Click source node first (shows yellow indicator)
- Then click target node
- Can't connect node to itself

### "Nodes overlap"
- Switch to Select mode (✋)
- Click and drag nodes to reposition
- Use grid lines to align

### "Lost my changes"
- Changes are NOT auto-saved
- Always click **"💾 Save"** before closing
- Closing the editor without saving will discard changes

### "Can't assign materials"
- Only station nodes can have materials
- Split and Merge nodes cannot have materials
- Make sure you've selected a station node

### "Edge arrow disappeared"
- Check if nodes were deleted
- Edges are automatically removed when connected nodes are deleted
- Recreate connection if needed

## Technical Details

### Data Structure
Each workflow consists of:
- **Nodes**: Array of FlowNode objects
  - `id`: Unique identifier
  - `type`: 'station' | 'split' | 'merge'
  - `position`: {x, y} coordinates
  - `stationId`: Reference to physical station (station nodes only)
  - `data.label`: Display name
  - `data.materials`: Array of {materialId, quantity}

- **Edges**: Array of FlowEdge objects
  - `id`: Unique identifier
  - `source`: Source node ID
  - `target`: Target node ID

### Validation
The system automatically:
- Prevents self-loops (node connecting to itself)
- Removes orphaned edges when nodes are deleted
- Validates material assignments
- Ensures all required fields are filled

### Performance
- Handles up to 100 nodes smoothly
- Real-time drag and drop
- Immediate edge rendering
- Optimized re-renders

## Future Enhancements
- [ ] Zoom in/out controls
- [ ] Pan canvas for larger workflows
- [ ] Keyboard shortcuts
- [ ] Undo/Redo functionality
- [ ] Auto-layout algorithm
- [ ] Export workflow as image
- [ ] Template duplication
- [ ] Workflow validation (check for loops, dead ends)
- [ ] Step timing estimates
- [ ] Cost calculation per step
- [ ] Resource allocation view

## Support
For issues or questions about the Workflow Editor:
1. Check this guide first
2. Review example workflows
3. Try building a simple workflow before complex ones
4. Contact system administrator if problems persist
