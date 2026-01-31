---
description: Workflow for automatic deployment to Vercel
---

# Automatic Deployment to Vercel

This workflow describes how changes are automatically deployed to Vercel.

1.  **Make Changes**: The user or agent modifies the code in the local environment.
2.  **Commit Changes**: The changes are committed to the local git repository.
    ```bash
    git add .
    git commit -m "Description of changes"
    ```
3.  **Push to GitHub**: The committed changes are pushed to the `main` branch of the connected GitHub repository.
    ```bash
    git push origin main
    ```
4.  **Automatic Build & Deploy**:
    *   Vercel is connected to the GitHub repository.
    *   It listens for push events to the `main` branch.
    *   Upon detecting a push, Vercel automatically pulls the latest code, runs the build command (`npm run build`), and deploys the output to the live URL.

**Note**: No manual action is required on Vercel unless the build fails. The live site will update automatically, usually within a minute or two of the push.
