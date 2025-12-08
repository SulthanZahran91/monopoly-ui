# Agents main rules

1. Ask clarifying questions if you're not sure about something. Do not make architectural decision without my input.
2. Commit atomically. Do not commit half done work. Do not commit code that doesn't build.
3. Don't use browser to debug. Use terminal.
4. When making plans, be sure to update plan.md and technical_documents.md.


## Project overview
Look at plan.md for more details

## Architecture Philosophy
1. Clear Separation of Concerns
2. Interface Driven design
3. Minimize code duplication

## Code guidelines
1. Use /tmp folder if you need to create helper scripts such as bash, patch, small python scripts, etc.
2. Don't create any readme file to update the progress of the project. Use this file or plan.md or techincal_documents.md instead.
3. Whenever you're done modifying, please make sure to update AGENTS.md and techincal_documents.md if needed.
4. use linter to check for code quality and to make sure it builds properly. if you fail to build three times in a row. look for other approach to help you debug more effectively.
5. Do not make extra comments that a human wouldn't add.
6. Do not make extra defensive checks or try/catch block that are abnormal for that area of the codebase (especially if called by trusted / validated codepaths).
7. Do not cast to any in typescript just to get around type issues.
8. Make style consistent. Use eslint to check for style issues.
9. For frontend debugging, send the data to the backend so it can put the data in a file, then use that file to debug.