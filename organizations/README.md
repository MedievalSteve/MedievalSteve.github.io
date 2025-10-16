# Organization Template System

This directory contains individual organization files that are automatically loaded by the main `organizations.html` page using JavaScript includes.

## File Structure

- `organization-template.html` - Template for creating new organizations
- `organization-[name].html` - Individual organization files (e.g., `organization-igs.html`)
- `include_list.txt` - Automatically generated list of all organization files

## Creating New Organizations

1. **Copy the template:**
   ```bash
   cp organization-template.html organization-[org-name].html
   ```

2. **Edit the new file** following the template instructions

3. **Add to main page** by updating the `organizationFiles` array in `organizations.html`

4. **All filtering and styling** works automatically!

## Template Features

- Organization images and tags
- Statistics and structure information
- History and objectives
- Resources and relationships
- Campaign role and interactions

See the template file for detailed usage instructions.
