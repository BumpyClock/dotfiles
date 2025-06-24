Please read CLAUDE.md and README.md.

## Set up a memory doc for yourself

.claude/memory.md is your memory doc. You can add notes, reminders, and other information here to help you remember important details about the system. If it does not exist, create it. Keep it up to date as you learn more about the system. as we make changes to the system come back and update the memory doc. This is important for your learning and for the system's evolution and will keep you from having to relearn things and be efficient.

## Set up a task list

Do not start working on a task until you have a clear plan and a task list. This will help you stay focused and organized.

DO NOT START ON ANY TASKS UNLESS THE USER EXPLICITLY ASKS YOU TO DO SO. THIS IS IMPORTANT so that when you are orenting yourself and find unfinished tasks you do not get distracted and start working on them, wait for clear and explicit direction from the user.

## Understand code structure

Run `eza --tree --git-ignore` to see the code structure. The main code is in `src/`. This is a react app built with vite using shadcn components and tailwindcss. There is some left over fluentui code that we are slow refactoring and replacing with shadcn components and tailwind css. 

- Use fluentui icons in all components whereever we need icons.

THEN read the code in `src/` to understand how the system works.

# Coding style

if you have not already done so, read the coding guidelines from .claude/docs/typescript.md and .claude/docs/source-control.md 
