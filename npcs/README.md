# NPC Template System

This directory contains individual NPC files that are automatically loaded by the main `npcs.html` page using JavaScript includes.

## File Structure

- `npc-template.html` - Template for creating new NPCs
- `npc-[name].html` - Individual NPC files (e.g., `npc-arden-kincaid.html`)
- `include_list.txt` - Automatically generated list of all NPC files

## Creating New NPCs

1. **Copy the template:**
   ```bash
   cp npc-template.html npc-[character-name].html
   ```

2. **Edit the new file** and replace all placeholders:
   - `npc-id` → unique identifier (e.g., "professor-albericiepr")
   - `NPC Name` → actual character name
   - `PATH_TO_IMAGE.jpg` → correct image path
   - Update `data-tags` attribute with relevant tags
   - Customize all content sections

3. **File naming convention:**
   - Use format: `npc-[name-with-hyphens].html`
   - Examples: `npc-arden-kincaid.html`, `npc-professor-albericiepr.html`

## Tag System

Use consistent tag names for filtering:

### Organization Tags
- `zhodani` - Zhodani Consulate
- `igs` - Institute for Geophysical Studies
- `hyperion` - Hyperion Lines
- `university` - University of Nielkladlief

### Location Tags
- `tiffanye` - Tiffanye system
- `drenalch` - Drenalch planet
- `nielkladlief` - Nielkladlief planet
- `damrong` - Damrong system

### Role Tags
- `employer` - Primary employer
- `liaison` - Contact/liaison
- `security` - Security personnel
- `academic` - Academic/researcher
- `engineer` - Technical role
- `bureaucrat` - Administrative role
- `diplomat` - Diplomatic role
- `media` - Media/communications
- `prole` - Working class
- `overseer` - Management role
- `guardian` - Protective role

### Campaign Tags
- `act1` - Act I: Shadows of the Past
- `mission1` - Mission 1: The Seeds of Curiosity
- `mission2` - Mission 2: The Shadows of the Past
- `mission3` - Mission 3: The Damrong Disappearance
- `deceased` - Character is deceased

### Species Tags
- `zhodani` - Zhodani species
- `human` - Human species
- `aslan` - Aslan species

## Image Guidelines

- Place images in `Images/npcs/` with appropriate subdirectories
- Use descriptive filenames in lowercase with underscores
- Recommended size: 400x600 pixels for consistency
- Include fallback placeholder in `onerror` attribute

## Content Guidelines

- Keep descriptions concise but informative
- Include relevant game information (stats, role, status)
- Use consistent formatting and structure
- Include only information relevant to the campaign
- Add `npc-links` section for related pages when applicable

## Link Formatting

Use consistent link formatting:
- Organizations: `organizations.html#org-id`
- Locations: `locations.html#location-id`
- Characters: `characters.html#character-id`

## Template Structure

Each NPC file should contain:
1. `<section>` with unique ID and data-tags
2. `<h2>` with character name
3. `<img>` with character image
4. `<div class="npc-tags">` with relevant tags
5. `<div class="npc-content">` with:
   - Brief description paragraph
   - `npc-stats` section with Role, Location, Status
   - Optional `npc-info` sections (Appearance, Personality, etc.)
   - Optional `npc-links` section

## Benefits of This System

1. **Modularity** - Each NPC is in its own file
2. **Consistency** - Standardized template ensures uniform formatting
3. **Maintainability** - Easy to update individual NPCs
4. **Scalability** - Simple to add new NPCs
5. **Reusability** - Template can be copied for new entries
6. **Organization** - Clear file structure and naming conventions

## Adding NPCs to Main Page

When you add a new NPC file, update the `npcFiles` array in `npcs.html`:

```javascript
const npcFiles = [
  // ... existing files ...
  'npcs/npc-new-character.html'
];
```

The system will automatically load and display the new NPC with all existing filtering functionality.
