# Ship Template System

This directory contains individual ship files that are automatically loaded by the main `ships.html` page using JavaScript includes.

## File Structure

- `ship-template.html` - Template for creating new ships
- `ship-[name].html` - Individual ship files (e.g., `ship-varyrthar.html`)
- `include_list.txt` - Automatically generated list of all ship files

## Creating New Ships

1. **Copy the template:**
   ```bash
   cp ship-template.html ship-[ship-name].html
   ```

2. **Edit the new file** following the template instructions

3. **Add to main page** by updating the `shipFiles` array in `ships.html`

4. **All navigation and styling** works automatically!

## Template Features

- Complete ship statistics tables
- Hull point tracking
- Technical specifications
- History and notable features
- Crew quarters and performance notes

See the template file for detailed usage instructions.
