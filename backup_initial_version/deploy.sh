#!/bin/bash

# GitHub Repository Deployment Script
# Run dit script nadat je de GitHub repository hebt gemaakt

echo "🚀 Cinematen Rapport Template - GitHub Deployment"
echo "================================================="

# Vraag om de GitHub repository URL
read -p "📝 Voer je GitHub repository URL in (bijv: https://github.com/username/cinematen-rapport-template.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ Geen repository URL opgegeven. Script gestopt."
    exit 1
fi

echo "🔗 Repository URL: $REPO_URL"

# Voeg remote toe
echo "📡 Remote repository toevoegen..."
git remote add origin "$REPO_URL"

# Push naar GitHub
echo "⬆️  Pushing naar GitHub..."
git branch -M main
git push -u origin main

echo "✅ Code succesvol gepusht naar GitHub!"
echo ""
echo "🌐 GitHub Pages Setup:"
echo "1. Ga naar: Settings > Pages"
echo "2. Source: Deploy from a branch"
echo "3. Branch: main"
echo "4. Folder: / (root)"
echo "5. Save"
echo ""
echo "🎉 Je website wordt beschikbaar op:"
echo "   https://[username].github.io/cinematen-rapport-template" 