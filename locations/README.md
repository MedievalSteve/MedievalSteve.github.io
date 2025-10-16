# Location Template System

This directory contains individual location files that are automatically loaded by the main `locations.html` page using JavaScript includes.

## File Structure

- `location-template.html` - Template for creating new locations
- `location-[name].html` - Individual location files (e.g., `location-nielkladlief.html`)
- `include_list.txt` - Automatically generated list of all location files

## Creating New Locations

1. **Copy the template:**
   ```bash
   cp location-template.html location-[location-name].html
   ```

2. **Edit the new file** and replace all placeholders:
   - `location-id` → unique identifier (e.g., "nielkladlief", "tiffanye-station")
   - `Location Name` → actual location name
   - Update `data-tags` attribute with relevant tags
   - Add TravellerMap iframe for systems/planets OR image for stations
   - Customize all content sections

3. **File naming convention:**
   - Use format: `location-[name-with-hyphens].html`
   - Examples: `location-nielkladlief.html`, `location-tiffanye.html`

## Tag System

Use consistent tag names for filtering:

### Sector Tags
- `vanguard-reaches` - Vanguard Reaches sector

### Sub-sector Tags
- `dlieblafia` - Dlieblafia subsector
- `yavakrbi` - Yavakrbi subsector
- `diadem` - Diadem subsector

### System Tags
- `nielkladlief` - Nielkladlief system
- `drenalch` - Drenalch system
- `tiffanye` - Tiffanye system
- `damrong` - Damrong system

### Type Tags
- `planet` - Planetary location
- `station` - Space station
- `space-coordinate` - Space coordinate/landmark
- `debris-field` - Debris field/wreckage

### Faction Tags
- `zhodani-colonnade` - Zhodani Consulate
- `ghenani` - Ghenani faction
- `pirate` - Pirate controlled
- `igs` - Institute for Geophysical Studies

### Mission Tags
- `mission1` - Mission 1: The Seeds of Curiosity
- `mission2` - Mission 2: The Shadows of the Past
- `mission3` - Mission 3: The Damrong Disappearance

## TravellerMap Integration

For planetary systems, use TravellerMap iframes:

```html
<iframe class="location-map" 
        src="https://travellermap.com/?options=50175&p=X!Y!ZOOM&dimunofficial=1" 
        frameborder="0">
</iframe>
```

### Coordinates:
- `X` - X coordinate in parsecs
- `Y` - Y coordinate in parsecs
- `ZOOM` - Zoom level (typical: 7-8)

Example: `https://travellermap.com/?options=50175&p=-162.757!29.365!7.25&dimunofficial=1`

## Image Guidelines

For non-planetary locations (stations, specific sites):

- Place images in `Images/locations/` with appropriate subdirectories
- Use descriptive filenames in lowercase with underscores
- Recommended sizes: 800x600 pixels or similar aspect ratio
- Comment out the iframe and uncomment the img tag

```html
<!-- Use this for stations/specific locations -->
<img src="Images/locations/path-to-image.jpg" alt="Location Name" class="location-image">
```

## Content Guidelines

### Location Stats
Customize stat boxes based on location type:

**For Planets:**
- Population
- Starport Class
- Tech Level
- Government Type
- Law Level
- Trade Codes

**For Stations:**
- Operator
- Capacity
- Services Available
- Docking Fees

**For Space Coordinates:**
- Purpose/Significance
- Hazards
- Notable Features

### Information Sections

Use `location-info` divs for detailed information:

- **World Characteristics** - Physical properties, climate, etc.
- **Points of Interest** - Notable locations within
- **History** - Background and significance
- **Facilities** - Available services and infrastructure
- **Population** - Demographics and culture
- **Government** - Political structure

### Links

Use the `location-links` section to connect to related content:

```html
<div class="location-links">
  <a href="organizations.html#org-id">Related Organization</a>
  <a href="npcs.html#npc-id">Key NPC</a>
  <a href="locations.html#other-location">Nearby Location</a>
</div>
```

## Template Structure

Each location file should contain:

1. `<section>` with unique ID and data-tags
2. `<h2>` with location name
3. TravellerMap `<iframe>` OR location `<img>`
4. `<div class="location-tags">` with relevant tags
5. `<div class="location-content">` with:
   - Brief description paragraph
   - `location-stats` section with key statistics
   - Optional `location-info` sections for detailed information
   - Optional `location-links` section

## Benefits of This System

1. **Modularity** - Each location is in its own file
2. **Consistency** - Standardized template ensures uniform formatting
3. **Maintainability** - Easy to update individual locations
4. **Scalability** - Simple to add new locations
5. **Reusability** - Template can be copied for new entries
6. **Organization** - Clear file structure and naming conventions
7. **Integration** - TravellerMap iframes provide interactive maps

## Adding Locations to Main Page

When you add a new location file, update the `locationFiles` array in `locations.html`:

```javascript
const locationFiles = [
  // ... existing files ...
  'locations/location-new-location.html'
];
```

The system will automatically load and display the new location with all existing filtering functionality.

## Examples

### Planet Example
See: `location-nielkladlief.html` - Full planetary system with TravellerMap

### Station Example
See: `location-whisper-point.html` - Space station with specific details

### Space Coordinate Example
See: `location-the-nest.html` - Pirate base coordinates

## Notes

- All locations are loaded asynchronously for better performance
- Filtering works across all location attributes
- TravellerMap iframes are responsive and interactive
- Multiple tags can be active simultaneously for refined filtering
