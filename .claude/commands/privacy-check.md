Run a privacy review of the current diff against docs/03-security/PRIVACY_MODEL.md.

For every changed file, check:
- Does any P0 or P1 data (content, filenames, subjects, addresses, URLs, why-text) cross the network, reach the database unencrypted, or reach a log?
- Does any new query skip firm scoping?
- Is any new third-party service introduced?
- Does any UI string claim a certification or audit that is not real?

Report findings as a table: file, line, rule broken, fix. If there are none, say so plainly.
