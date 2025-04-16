# OpenAPI Documentation for Confluence Data Center/Server

A Confluence Data Center/Server plugin that transforms OpenAPI specifications into collaborative, tabular documentation with inline commenting capabilities.

## Features

- **API Spec Documentation Macro**: Easily embed OpenAPI specifications in Confluence pages
- **Interactive Documentation**: Expandable/collapsible sections for better readability
- **Tabular Format**: Clearly organized tables for endpoints, parameters, and schemas
- **Inline Commenting**: Collaborate directly on API specifications within Confluence
- **Multiple Input Methods**: Paste JSON/YAML or upload specification files
- **Live Preview**: Preview the rendered documentation before inserting the macro
- **Data Center Compatible**: Works with Confluence Data Center deployments

## Installation

1. Download the plugin JAR file from the releases page
2. Log in to Confluence as an administrator
3. Go to "Manage apps" in the administration console
4. Click on "Upload app"
5. Select the downloaded JAR file
6. Click "Upload"

## Usage

### Adding API Documentation to a Page

1. Edit a Confluence page
2. Insert the "API Spec Documentation" macro
3. Choose your input method (paste or upload)
4. Provide your OpenAPI/Swagger specification (JSON or YAML format)
5. Select the format (or let the macro auto-detect it)
6. Preview the rendered documentation
7. Click "Insert" to add it to the page

### Commenting on API Documentation

1. View a page containing the API Spec Documentation macro
2. Hover over any section (endpoint, parameter, response, etc.)
3. Click the comment icon that appears
4. Add your comment
5. Click "Save"

## Development

### Prerequisites

- Java 8 or higher
- Maven 3.5+
- Atlassian SDK

### Building the Plugin

```bash
# Clone the repository
git clone https://github.com/example/openapi-documentation.git
cd openapi-documentation

# Build the plugin
mvn clean package

# The plugin JAR file will be in the target directory
ls target/*.jar
```

### Running the Plugin in Development Mode

```bash
atlas-run
```

### Debugging

```bash
atlas-debug
```

### Running Tests

```bash
atlas-unit-test
```

## Architecture

The plugin consists of several components:

- **OpenApiMacro**: The main entry point for the macro
- **OpenApiParser**: Parses OpenAPI specifications
- **OpenApiRenderer**: Renders specifications as HTML tables
- **OpenApiResource**: Provides REST endpoints for the macro editor

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.

## Support

For support, please open an issue on the GitHub repository or contact the developer team.