# KSHITIZ CODERS Laboratory - World-Class Engineering Workbench

Elite software development workbench built for code synthesis, security auditing, and high-fidelity research interaction.

## 🌐 Deployment & Account Migration

### 🚀 Moving to Another GitHub Account
If you are transitioning to a new GitHub account:

1. **GitHub Setup**: 
   - Sign out of GitHub in this browser.
   - Sign in with your **New Google/GitHub Account**.
   - Create a new repository (e.g., `kshitiz-lab-pro`).

2. **Upload Instructions**:
   - If the GitHub Web interface fails, use the **Git CLI**:
     ```bash
     git init
     git add .
     git commit -m "Initialize Lab"
     git remote add origin https://github.com/YOUR_NEW_USERNAME/YOUR_REPO_NAME.git
     git push -u origin main
     ```

3. **API Key Protocol (MANDATORY)**:
   - Go to your repository **Settings** on GitHub.
   - Navigate to **Secrets and variables** > **Actions**.
   - Click **New repository secret**.
   - **Name**: `API_KEY`
   - **Value**: Your actual Gemini API Key string.
   - *The included GitHub Action (`deploy.yml`) will automatically inject this into the production build.*

### 🎙️ Advanced Features
- **Neural Voice Uplink**: High-fidelity real-time voice interaction via Gemini Live.
- **Migration Hub**: Built-in instructions for environment transitions and deployment status checks.
- **Identity Registry**: Root, Admin, and Data Manager role management.

## 🔐 Administrative Access
Initial Root credentials:
- **Identity Code:** `kshitizmishra`
- **Access Key:** `9845189548`

## ⚠️ Troubleshooting
- **API Key Missing Error**: Ensure the secret name on GitHub is exactly `API_KEY`. Re-run the deployment action if you added the key after the first push.
- **Upload Failures**: Ensure you have pushed to the `main` branch. Check the **Actions** tab on GitHub for build logs.