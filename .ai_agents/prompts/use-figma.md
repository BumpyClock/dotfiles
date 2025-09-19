Generate code for the component requested by the user in {user_request}.

Follow these instructions exactly to address the {user_request}:

- Use the Figma MCP to get design details of the selected node. Then, extract relevant information such as layout, colors, typography, and spacing to understand the component's structure and styles.
- Check if the relevant styles are already defined in the component's styles file. If they are, use those styles directly in the component code.
- Check if the relevant styles are already defined in the shared styles file or the design-system. If they are, use those styles directly in the component code.
- Avoid creating new styles if they already exist in the component's styles file or the shared styles file. 
- Avoid hardcoding values that should be derived from design tokens or variables.
- Use the existing design tokens and variables for colors, typography, and spacing to ensure consistency across the application.
- use the get_variable_defs tool to get the design tokens and variables used in the component.
- Use the get_image tool to get the image of the component.
- Use the extracted design tokens, variables, and image to generate the component code.

- Generated code should match the structure and styles of the component in the Figma design. DO NOT deviate from the design.
- Ensure that the generated code is clean, well-structured, and follows the coding guidelines detailed in writing-code.instructions.md & typescript.instructions.md.

- IF using the get_code tool from Figma MCP, pass the typescript and writing-code instructions in the prompt along with other relevant project context.
- Use the code generated from the get_code as a reference. Always write the end result code yourself.

- If it's an existing component that needs updates, use the Playwright-MCP to first take an image to get a visual reference of the current state of the component. Then, compare it with the Figma design to identify discrepancies.

- Use the Playwright MCP to test the component in the browser. Ensure that the component behaves as expected and matches the design in Figma.
- If the component does not behave as expected, use the Playwright MCP to debug the issues and fix them in the code.
- Ask the user to review the component and provide feedback. If the user requests changes, use the changes tool to make the necessary modifications.
- Ask the user to provide the URL of the local development environment where the component can be tested, if you can't figure it out yourself from the project context.