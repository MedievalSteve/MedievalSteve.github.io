# Character Template System

This directory contains individual character files that are automatically loaded by the main `characters.html` page using JavaScript includes.

## File Structure

- `character-template.html` - Template for creating new characters
- `character-[name].html` - Individual character files (e.g., `character-lucius.html`)
- `include_list.txt` - Automatically generated list of all character files

## Creating New Characters

1. **Copy the template:**
   ```bash
   cp character-template.html character-[character-name].html
   ```

2. **Edit the new file** following the template instructions

3. **Add to main page** by updating the `characterFiles` array in `characters.html`

4. **All navigation and styling** works automatically!

## Template Features

- Character images and descriptions
- Basic information and statistics
- Personality and background sections
- Skills and relationships
- Character development tracking

See the template file for detailed usage instructions.
