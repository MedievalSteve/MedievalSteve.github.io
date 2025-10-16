# Flora & Fauna Template System

This directory contains individual species files that are automatically loaded by the main `flora-fauna.html` page using JavaScript includes.

## File Structure

- `species-template.html` - Template for creating new species
- `species-[name].html` - Individual species files (e.g., `species-tklan-tick.html`)
- `include_list.txt` - Automatically generated list of all species files

## Creating New Species

1. **Copy the template:**
   ```bash
   cp species-template.html species-[species-name].html
   ```

2. **Edit the new file** following the template instructions

3. **Add to main page** by updating the `speciesFiles` array in `flora-fauna.html`

4. **All styling** works automatically!

## Template Features

- Species images and descriptions
- Habitat and behavior information
- Threat level and game statistics
- Ecological role and cultural significance
- Campaign encounters and research notes

See the template file for detailed usage instructions.
