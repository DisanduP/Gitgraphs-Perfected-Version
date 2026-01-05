# Mermaid GitGraph to Draw.io Converter

A Node.js tool that converts Mermaid gitGraph diagrams into Draw.io (diagrams.net) XML format for professional visualization.

## Features

- **Full Mermaid gitGraph Support**: Converts commits, branches, checkouts, and merges
- **Visual Enhancements**: Automatic branch coloring, proper positioning, and merge visualization
- **Professional Output**: Generates clean Draw.io XML files ready for editing
- **Command Line Interface**: Simple CLI with input/output file options

## Installation

```bash
git clone <repository-url>
cd gitgraphs
npm install
```

## Usage

### Basic Conversion

```bash
node converter.js -i input.mmd -o output.drawio
```

### Options

- `-i, --input <path>`: Input Mermaid gitGraph file path (required)
- `-o, --output <path>`: Output Draw.io file path (default: 'output.drawio')

### Example

```bash
node converter.js -i my-gitgraph.mmd -o my-visualization.drawio
```

## Mermaid gitGraph Syntax

The converter supports standard Mermaid gitGraph syntax:

```mermaid
gitGraph:
options
{
    "nodeSpacing": 150,
    "nodeRadius": 10
}
end
commit id: "initial-commit"
branch develop
checkout develop
commit id: "feature-work"
checkout main
merge develop
```

### Supported Commands

- `commit [id: "custom-id"] [tag: "version"]` - Create a commit
- `branch <name>` - Create a new branch
- `checkout <name>` - Switch to a branch
- `merge <source-branch>` - Merge a branch into current

## Example Git Graphs

The repository includes 11 pre-built examples demonstrating various git workflows:

### Basic Examples
- **`sample-gitgraph.mmd`** - Basic branching with main/develop/feature
- **`linear-history.mmd`** - Simple sequential commits with tags

### Workflow Examples
- **`gitflow-example.mmd`** - Traditional Git Flow methodology
- **`rebase-workflow.mmd`** - Feature development with main branch updates
- **`trunk-based.mmd`** - Trunk-based development with short-lived branches

### Advanced Patterns
- **`complex-gitgraph.mmd`** - Multi-branch workflow with releases
- **`complex-branching.mmd`** - Nested branches and cross-merges
- **`feature-flags.mmd`** - Feature flag development pattern
- **`pr-workflow.mmd`** - Pull request workflow with multiple contributors
- **`monorepo.mmd`** - Monorepo structure with services and shared libs
- **`emergency-release.mmd`** - Hotfix and emergency release workflow

## Output Features

The converter generates Draw.io XML with:

- **Branch Labels**: Colored branch names positioned on the left
- **Commit Nodes**: Elliptical nodes with custom IDs/tags
- **Connection Lines**: Solid lines for commits, dashed lines for merge sources
- **Automatic Layout**: Pre-calculated positioning for clean visualization
- **Color Coding**: Distinct colors for different branches

## Opening Generated Files

Generated `.drawio` files can be opened in:

- **Draw.io Desktop Application**
- **diagrams.net** (web version)
- **VS Code** with Draw.io extension
- Any text editor (to view/modify the XML)

## Technical Details

### Dependencies

- `commander`: Command-line interface parsing
- `xmlbuilder2`: XML generation for Draw.io format

### Architecture

1. **Parser**: Processes Mermaid syntax into structured data
2. **Layout Engine**: Calculates node positions and branch relationships
3. **XML Generator**: Creates Draw.io-compatible XML output

### Limitations

- Currently supports basic git operations (commit, branch, checkout, merge)
- Advanced git features (rebase, cherry-pick, etc.) not yet implemented
- Layout is pre-calculated; manual adjustment may be needed for complex graphs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Roadmap

- [ ] Support for rebase operations
- [ ] Cherry-pick visualization
- [ ] Custom styling options
- [ ] Interactive web interface
- [ ] Additional export formats (SVG, PNG)
