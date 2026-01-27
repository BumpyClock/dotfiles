- Context: Fix invalid YAML warnings for SKILL.md frontmatter
  What I tried: Inspected SKILL.md frontmatter; converted long description values to block scalars
  Outcome: Worked; YAML parser no longer treats "Triggers on:" as a mapping delimiter
  Next time: Quote or use block scalars for descriptions containing colons
