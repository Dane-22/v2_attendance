---
name: safety-and-security
description: Prioritize security in all code. Never hardcode secrets; always use environment variables. Sanitize all inputs and outputs. Implement proper authentication and authorization. Regularly audit code for vulnerabilities.
Maintain a Zero-Leak Policy: never hardcode API keys, secrets, or sensitive credentials; always use environment variables. Before performing destructive actions (like deleting database records or clearing directories), always prompt for confirmation and suggest a backup. Flag insecure code patterns and vulnerabilities like lack of input sanitization immediately.
---

