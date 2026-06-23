# Push Updates to GitHub

## ✅ Changes Ready to Push

Your repository has been updated with:
- Vercel deployment configuration
- Render deployment configuration  
- Updated admin credentials
- Deployment guides
- Example data files

## 🚀 Push to GitHub

### Option 1: Use the Script (Easiest)

```bash
./update-repo.sh
```

This will guide you through authentication.

### Option 2: Manual with Personal Access Token

1. **Generate Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Name: "Smart LinkTree"
   - Select: `repo` (full control)
   - Generate and copy token

2. **Push with Token:**
```bash
git push https://YOUR_TOKEN@github.com/codecraftersmca-hash/smart-linktree.git main
```

Replace `YOUR_TOKEN` with your actual token.

### Option 3: Clear Old Credentials

```bash
# Clear cached credentials
git credential-osxkeychain erase
host=github.com
protocol=https

# Press Enter twice, then push
git push origin main
```

When prompted:
- Username: `codecraftersmca-hash`
- Password: Use your Personal Access Token

### Option 4: Use SSH

```bash
# Change to SSH
git remote set-url origin git@github.com:codecraftersmca-hash/smart-linktree.git

# Push
git push origin main
```

(Requires SSH key setup on GitHub)

## 📊 What Will Be Pushed

```
New Files:
✅ vercel.json - Vercel configuration
✅ api/index.py - Serverless entry point
✅ render.yaml - Render configuration
✅ VERCEL_DEPLOYMENT.md - Deployment guide
✅ deploy-vercel.sh - Deployment script
✅ update-repo.sh - This helper script
✅ requirements-vercel.txt - Vercel dependencies

Updated Files:
✅ data/users.json - Admin credentials updated
✅ .gitignore - Protected sensitive files
```

## 🎯 After Pushing

Once pushed successfully:

1. **Deploy to Vercel:**
   ```bash
   ./deploy-vercel.sh
   ```

2. **Or Deploy to Render:**
   - Go to https://render.com
   - Import your repository
   - Deploy!

## 🆘 Still Having Issues?

If you keep getting 403 errors:

1. **Check which account is cached:**
```bash
git config user.name
git config user.email
```

2. **Update to correct account:**
```bash
git config user.name "codecraftersmca-hash"
git config user.email "codecraftersmca@gmail.com"
```

3. **Remove all GitHub credentials:**
```bash
# On Mac
git credential-osxkeychain erase
host=github.com
protocol=https

# On Windows
git credential-manager erase
host=github.com
protocol=https
```

4. **Try pushing again:**
```bash
git push origin main
```

## 💡 Quick Fix

The fastest way:

```bash
# Get your token from: https://github.com/settings/tokens
# Then run:
git push https://YOUR_TOKEN_HERE@github.com/codecraftersmca-hash/smart-linktree.git main
```

---

**Need your Personal Access Token?**
Generate at: https://github.com/settings/tokens
