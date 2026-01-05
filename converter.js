#!/usr/bin/env node
const fs = require('fs');
const { program } = require('commander');
const { create } = require('xmlbuilder2');

program
  .requiredOption('-i, --input <path>', 'Input mermaid file path')
  .option('-o, --output <path>', 'Output drawio file path', 'output.drawio')
  .parse(process.argv);

const options = program.opts();

// --- Configuration ---
// Increased spacing for better readability with curved lines
const SPACING_X = 150; 
const SPACING_Y = 100;
// Increased node size to fit text like "Initial Commit"
const NODE_SIZE = 50;  
const COLORS = ['#1E90FF', '#FF6347', '#32CD32', '#FFD700', '#DA70D6'];

// --- Styles ---

// Commit Node: Circle, centered text, thicker border
const COMMIT_STYLE = "ellipse;whiteSpace=wrap;html=1;aspect=fixed;strokeWidth=2;fillColor=#FFFFFF;fontStyle=1;fontSize=10;";

// Branch Label: Floating text on the left
const BRANCH_LABEL_STYLE = "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontStyle=1;fontSize=14;";

// Edge Style: 
// - orthogonalEdgeStyle + curved=1 creates the "subway map" look
// - entryX/exitX forces the Left-to-Right flow
const EDGE_STYLE = "edgeStyle=orthogonalEdgeStyle;curved=1;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;";

// --- Logic ---

function parseMermaid(content) {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%') && !l.startsWith('gitGraph'));
  
  const branches = { 'main': { name: 'main', yIndex: 0, lastCommitId: null, color: COLORS[0] } };
  const commits = [];
  const edges = [];
  
  let currentBranch = 'main';
  let branchCounter = 1;
  let timeStep = 0;

  lines.forEach((line, index) => {
    // Regex Patterns
    const commitMatch = line.match(/^commit(\s+id:\s*"([^"]+)")?(\s+tag:\s*"([^"]+)")?/);
    const branchMatch = line.match(/^branch\s+([\w-]+)/);
    const checkoutMatch = line.match(/^checkout\s+([\w-]+)/);
    const mergeMatch = line.match(/^merge\s+([\w-]+)/);

    if (commitMatch) {
      const id = commitMatch[2] || `c${index}`;
      const tag = commitMatch[4] || null;
      
      const commitNode = {
        id: id,
        label: tag || id,
        x: timeStep * SPACING_X,
        y: branches[currentBranch].yIndex * SPACING_Y,
        branch: currentBranch,
        color: branches[currentBranch].color
      };

      // Link to parent (previous commit on this branch)
      if (branches[currentBranch].lastCommitId) {
        edges.push({ 
            source: branches[currentBranch].lastCommitId, 
            target: id,
            color: branches[currentBranch].color 
        });
      }

      commits.push(commitNode);
      branches[currentBranch].lastCommitId = id;
      timeStep++;
    } 
    else if (branchMatch) {
      const newBranchName = branchMatch[1];
      if (!branches[newBranchName]) {
        branches[newBranchName] = {
          name: newBranchName,
          yIndex: branchCounter++,
          lastCommitId: branches[currentBranch].lastCommitId, // Forks from current
          color: COLORS[branchCounter % COLORS.length]
        };
      }
      currentBranch = newBranchName;
    } 
    else if (checkoutMatch) {
      const targetBranch = checkoutMatch[1];
      if (branches[targetBranch]) {
        currentBranch = targetBranch;
      }
    } 
    else if (mergeMatch) {
      const sourceBranch = mergeMatch[1];
      const mergeId = `merge-${index}`;
      
      const commitNode = {
        id: mergeId,
        label: "Merge",
        x: timeStep * SPACING_X,
        y: branches[currentBranch].yIndex * SPACING_Y,
        branch: currentBranch,
        color: branches[currentBranch].color,
        isMerge: true
      };

      // Link 1: Previous commit on current branch (Target Branch)
      if (branches[currentBranch].lastCommitId) {
        edges.push({ 
            source: branches[currentBranch].lastCommitId, 
            target: mergeId,
            color: branches[currentBranch].color 
        });
      }
      
      // Link 2: Tip of the merged branch (Source Branch)
      if (branches[sourceBranch] && branches[sourceBranch].lastCommitId) {
        edges.push({ 
            source: branches[sourceBranch].lastCommitId, 
            target: mergeId,
            color: branches[sourceBranch].color, // Use source color for the merge line
            isMergeLine: true
        });
      }

      commits.push(commitNode);
      branches[currentBranch].lastCommitId = mergeId;
      timeStep++;
    }
  });

  return { commits, edges, branches };
}

function generateDrawioXml(data) {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('mxfile', { host: 'Electron', modified: new Date().toISOString(), agent: 'MermaidToDrawio', version: '21.0.0', type: 'device' })
      .ele('diagram', { id: 'gitgraph-diagram', name: 'GitGraph' })
        .ele('mxGraphModel', { dx: '1000', dy: '1000', grid: '1', gridSize: '10', guides: '1', tooltips: '1', connect: '1', arrows: '1', fold: '1', page: '1', pageScale: '1', pageWidth: '850', pageHeight: '1100', math: '0', shadow: '0' })
          .ele('root');

  // Base layers
  root.ele('mxCell', { id: '0' });
  root.ele('mxCell', { id: '1', parent: '0' });

  // 1. Draw Branch Labels (Left side)
  Object.values(data.branches).forEach(b => {
    root.ele('mxCell', {
      id: `label-${b.name}`,
      value: b.name,
      style: BRANCH_LABEL_STYLE + `;fontColor=${b.color};`,
      parent: '1',
      vertex: '1'
    }).ele('mxGeometry', { x: -120, y: (b.yIndex * SPACING_Y) + (NODE_SIZE/2) - 10, width: '100', height: '20', as: 'geometry' });
  });

  // 2. Draw Edges
  data.edges.forEach((edge, idx) => {
    // We use the color of the branch the line belongs to
    const strokeColor = edge.color || '#000000';
    
    root.ele('mxCell', {
      id: `edge-${idx}`,
      // Solid lines for everything, curved style, matching branch color
      style: `${EDGE_STYLE}strokeColor=${strokeColor};`,
      parent: '1',
      source: edge.source,
      target: edge.target,
      edge: '1'
    }).ele('mxGeometry', { relative: '1', as: 'geometry' });
  });

  // 3. Draw Commits
  data.commits.forEach(commit => {
    // If it's a merge, we fill it with color, otherwise white background with colored border
    const style = `${COMMIT_STYLE}strokeColor=${commit.color};${commit.isMerge ? 'fillColor=' + commit.color + ';fontColor=#FFFFFF;' : ''}`;
    
    root.ele('mxCell', {
      id: commit.id,
      value: commit.label,
      style: style,
      parent: '1',
      vertex: '1'
    }).ele('mxGeometry', { x: commit.x, y: commit.y, width: NODE_SIZE, height: NODE_SIZE, as: 'geometry' });
  });

  return root.end({ prettyPrint: true });
}

// --- Execution ---
try {
  const inputContent = fs.readFileSync(options.input, 'utf8');
  const graphData = parseMermaid(inputContent);
  const xmlOutput = generateDrawioXml(graphData);
  
  fs.writeFileSync(options.output, xmlOutput);
  console.log(`✅ Successfully converted ${options.input} to ${options.output}`);
  console.log(`   (Try 'Arrange > Layout > Horizontal Flow' in Draw.io if it looks messy, though coordinates are pre-calculated)`);
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}